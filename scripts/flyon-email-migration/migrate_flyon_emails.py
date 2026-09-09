#!/usr/bin/env python3
"""Move Flyon-related mail out of a personal Outlook mailbox into another account.

Source is read through the Microsoft Graph API (Outlook.com and Microsoft 365 both
work; Microsoft turned off basic-auth IMAP for personal accounts, so Graph is the
only route that still authenticates). Destination is any IMAP server (Gmail,
Fastmail, iCloud, another Outlook via Graph).

Each message is copied as its original RFC-822 MIME, so headers, attachments,
threading and the received date survive the move. Nothing is removed from the
source unless you ask for it with --after, and then only after the destination has
confirmed the append.

Standard library only. Python 3.9+.

    python3 migrate_flyon_emails.py --help
"""

from __future__ import annotations

import argparse
import base64
import getpass
import imaplib
import json
import os
import re
import ssl
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from typing import Any, Callable, Iterable, Iterator, Optional

GRAPH = "https://graph.microsoft.com/v1.0"
LOGIN = "https://login.microsoftonline.com"
SCOPES = "offline_access Mail.ReadWrite"

DEFAULT_TERMS = ["flyon"]
DEFAULT_STATE = os.path.expanduser("~/.flyon-email-migration/state.json")
DEFAULT_TOKENS = os.path.expanduser("~/.flyon-email-migration/tokens.json")


# --------------------------------------------------------------------------- #
# small helpers
# --------------------------------------------------------------------------- #


def log(msg: str) -> None:
    print(f"{datetime.now().strftime('%H:%M:%S')}  {msg}", flush=True)


def die(msg: str) -> "NoReturn":  # type: ignore[valid-type]
    print(f"error: {msg}", file=sys.stderr)
    raise SystemExit(1)


def write_private_json(path: str, data: Any) -> None:
    """Write JSON with 0600 permissions — these files hold refresh tokens."""
    directory = os.path.dirname(path)
    if directory:
        os.makedirs(directory, mode=0o700, exist_ok=True)
    tmp = f"{path}.tmp"
    fd = os.open(tmp, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
    with os.fdopen(fd, "w") as fh:
        json.dump(data, fh, indent=2)
    os.replace(tmp, path)


def read_json(path: str, default: Any) -> Any:
    try:
        with open(path) as fh:
            return json.load(fh)
    except (OSError, json.JSONDecodeError):
        return default


def http(
    method: str,
    url: str,
    *,
    headers: Optional[dict] = None,
    data: Optional[bytes] = None,
    raw: bool = False,
    attempts: int = 6,
) -> Any:
    """One HTTP call with Graph-aware throttling and transient-failure retries."""
    headers = dict(headers or {})
    for attempt in range(1, attempts + 1):
        req = urllib.request.Request(url, data=data, headers=headers, method=method)
        try:
            with urllib.request.urlopen(req, timeout=180) as resp:
                body = resp.read()
                if raw:
                    return body
                return json.loads(body) if body else {}
        except urllib.error.HTTPError as exc:
            body = exc.read()
            retryable = exc.code in (429, 500, 502, 503, 504)
            if retryable and attempt < attempts:
                delay = float(exc.headers.get("Retry-After") or 0) or min(2**attempt, 60)
                log(f"  http {exc.code}, retrying in {delay:.0f}s")
                time.sleep(delay)
                continue
            detail = body.decode("utf-8", "replace")[:600]
            raise RuntimeError(f"{method} {url} -> {exc.code}: {detail}") from exc
        except (urllib.error.URLError, TimeoutError, ssl.SSLError) as exc:
            if attempt < attempts:
                delay = min(2**attempt, 60)
                log(f"  network error ({exc}), retrying in {delay}s")
                time.sleep(delay)
                continue
            raise
    raise RuntimeError("unreachable")


def form(fields: dict) -> bytes:
    return urllib.parse.urlencode(fields).encode()


# --------------------------------------------------------------------------- #
# Microsoft Graph: OAuth device-code flow
# --------------------------------------------------------------------------- #


class GraphAccount:
    """A signed-in Graph mailbox. Tokens are cached per account key."""

    def __init__(self, client_id: str, tenant: str, token_path: str, key: str):
        self.client_id = client_id
        self.tenant = tenant
        self.token_path = token_path
        self.key = key
        self._access: Optional[str] = None
        self._expires = 0.0

    # -- auth ------------------------------------------------------------- #

    def _cache(self) -> dict:
        return read_json(self.token_path, {})

    def _store_refresh(self, refresh: str) -> None:
        cache = self._cache()
        cache[self.key] = {"refresh_token": refresh, "client_id": self.client_id}
        write_private_json(self.token_path, cache)

    def _token_endpoint(self) -> str:
        return f"{LOGIN}/{self.tenant}/oauth2/v2.0/token"

    def _from_refresh(self) -> bool:
        entry = self._cache().get(self.key)
        if not entry or entry.get("client_id") != self.client_id:
            return False
        try:
            tok = http(
                "POST",
                self._token_endpoint(),
                headers={"Content-Type": "application/x-www-form-urlencoded"},
                data=form(
                    {
                        "client_id": self.client_id,
                        "grant_type": "refresh_token",
                        "refresh_token": entry["refresh_token"],
                        "scope": SCOPES,
                    }
                ),
                attempts=2,
            )
        except RuntimeError:
            return False
        self._apply(tok)
        return True

    def _device_code(self) -> None:
        start = http(
            "POST",
            f"{LOGIN}/{self.tenant}/oauth2/v2.0/devicecode",
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            data=form({"client_id": self.client_id, "scope": SCOPES}),
        )
        print()
        print("=" * 72)
        print(f"  Sign in to the {self.key} mailbox:")
        print(f"    1. open {start['verification_uri']}")
        print(f"    2. enter the code {start['user_code']}")
        print("=" * 72)
        print()
        interval = int(start.get("interval", 5))
        deadline = time.time() + int(start.get("expires_in", 900))
        while time.time() < deadline:
            time.sleep(interval)
            req = urllib.request.Request(
                self._token_endpoint(),
                data=form(
                    {
                        "client_id": self.client_id,
                        "grant_type": "urn:ietf:params:oauth:grant-type:device_code",
                        "device_code": start["device_code"],
                    }
                ),
                headers={"Content-Type": "application/x-www-form-urlencoded"},
                method="POST",
            )
            try:
                with urllib.request.urlopen(req, timeout=60) as resp:
                    self._apply(json.loads(resp.read()))
                    return
            except urllib.error.HTTPError as exc:
                payload = json.loads(exc.read() or b"{}")
                err = payload.get("error")
                if err == "authorization_pending":
                    continue
                if err == "slow_down":
                    interval += 5
                    continue
                die(f"sign-in failed: {payload.get('error_description', err)}")
        die("sign-in timed out")

    def _apply(self, tok: dict) -> None:
        self._access = tok["access_token"]
        self._expires = time.time() + int(tok.get("expires_in", 3600)) - 120
        if tok.get("refresh_token"):
            self._store_refresh(tok["refresh_token"])

    def token(self) -> str:
        if self._access and time.time() < self._expires:
            return self._access
        if not self._from_refresh():
            self._device_code()
        assert self._access
        return self._access

    # -- requests ---------------------------------------------------------- #

    def get(self, path_or_url: str, **params: Any) -> dict:
        url = path_or_url if path_or_url.startswith("http") else GRAPH + path_or_url
        if params:
            url += ("&" if "?" in url else "?") + urllib.parse.urlencode(params)
        return http("GET", url, headers={"Authorization": f"Bearer {self.token()}"})

    def get_raw(self, path: str) -> bytes:
        return http(
            "GET",
            GRAPH + path,
            headers={"Authorization": f"Bearer {self.token()}"},
            raw=True,
        )

    def post(self, path: str, body: Any, content_type: str = "application/json") -> Any:
        data = body if isinstance(body, bytes) else json.dumps(body).encode()
        return http(
            "POST",
            GRAPH + path,
            headers={
                "Authorization": f"Bearer {self.token()}",
                "Content-Type": content_type,
            },
            data=data,
        )

    def delete(self, path: str) -> None:
        http("DELETE", GRAPH + path, headers={"Authorization": f"Bearer {self.token()}"})

    def paged(self, path: str, **params: Any) -> Iterator[dict]:
        page = self.get(path, **params)
        while True:
            yield from page.get("value", [])
            nxt = page.get("@odata.nextLink")
            if not nxt:
                return
            page = self.get(nxt)

    def whoami(self) -> str:
        me = self.get("/me", **{"$select": "mail,userPrincipalName"})
        return me.get("mail") or me.get("userPrincipalName") or "(unknown)"


# --------------------------------------------------------------------------- #
# finding the Flyon mail
# --------------------------------------------------------------------------- #

MESSAGE_FIELDS = (
    "id,internetMessageId,subject,receivedDateTime,sentDateTime,isRead,"
    "from,sender,toRecipients,ccRecipients,bccRecipients,bodyPreview,"
    "hasAttachments,parentFolderId"
)

# Folders whose contents are not mail you want to carry over.
SKIP_FOLDERS = {"deleteditems", "junkemail", "recoverableitemsdeletions", "conflicts", "syncissues"}


def build_matcher(terms: Iterable[str]) -> Callable[[str], bool]:
    pattern = re.compile("|".join(re.escape(t) for t in terms), re.IGNORECASE)
    return lambda text: bool(pattern.search(text))


def message_haystack(msg: dict) -> str:
    """Everything about a message that is cheap to search."""
    parts = [msg.get("subject") or "", msg.get("bodyPreview") or ""]
    for key in ("from", "sender"):
        addr = (msg.get(key) or {}).get("emailAddress") or {}
        parts += [addr.get("name") or "", addr.get("address") or ""]
    for key in ("toRecipients", "ccRecipients", "bccRecipients"):
        for rec in msg.get(key) or []:
            addr = rec.get("emailAddress") or {}
            parts += [addr.get("name") or "", addr.get("address") or ""]
    return "\n".join(parts)


def walk_folders(account: GraphAccount) -> Iterator[dict]:
    """Every mail folder, including nested ones."""
    stack = list(account.paged("/me/mailFolders", **{"$top": "100"}))
    while stack:
        folder = stack.pop()
        yield folder
        if folder.get("childFolderCount"):
            stack.extend(
                account.paged(f"/me/mailFolders/{folder['id']}/childFolders", **{"$top": "100"})
            )


def discover_by_search(account: GraphAccount, terms: list[str]) -> dict[str, dict]:
    """Mailbox-side search: fast, but Exchange caps a search at ~1000 hits per term."""
    found: dict[str, dict] = {}
    for term in terms:
        log(f"searching mailbox for {term!r}")
        before = len(found)
        for msg in account.paged(
            "/me/messages",
            **{"$search": f'"{term}"', "$select": MESSAGE_FIELDS, "$top": "50"},
        ):
            found[msg["id"]] = msg
        log(f"  {len(found) - before} new (running total {len(found)})")
    return found


def discover_by_scan(
    account: GraphAccount, terms: list[str], deep: bool, include_all_folders: bool
) -> dict[str, dict]:
    """Walk every folder and match locally. Slower, but nothing is capped."""
    matches = build_matcher(terms)
    found: dict[str, dict] = {}
    for folder in walk_folders(account):
        name = folder.get("displayName", "?")
        well_known = (folder.get("wellKnownName") or "").lower()
        if not include_all_folders and well_known in SKIP_FOLDERS:
            log(f"skipping folder {name}")
            continue
        if not folder.get("totalItemCount"):
            continue
        log(f"scanning {name} ({folder['totalItemCount']} items)")
        hits = 0
        for msg in account.paged(
            f"/me/mailFolders/{folder['id']}/messages",
            **{"$select": MESSAGE_FIELDS, "$top": "100"},
        ):
            hit = matches(message_haystack(msg))
            if not hit and deep:
                hit = matches(account.get_raw(f"/me/messages/{msg['id']}/$value").decode("utf-8", "replace"))
            if hit:
                found[msg["id"]] = msg
                hits += 1
        log(f"  {hits} match")
    return found


def dedupe(messages: Iterable[dict]) -> list[dict]:
    """One copy per Message-ID — the same mail often sits in Inbox and Sent/Archive."""
    seen: dict[str, dict] = {}
    for msg in messages:
        key = msg.get("internetMessageId") or msg["id"]
        seen.setdefault(key, msg)
    return sorted(seen.values(), key=lambda m: m.get("receivedDateTime") or "")


# --------------------------------------------------------------------------- #
# destinations
# --------------------------------------------------------------------------- #


class Destination:
    def has(self, message_id: str) -> bool: ...
    def append(self, mime: bytes, received: Optional[datetime], seen: bool) -> None: ...
    def close(self) -> None: ...


class ImapDestination(Destination):
    def __init__(self, host: str, port: int, user: str, password: str, folder: str, dedupe_scope: str):
        self.folder = folder
        self.dedupe_scope = dedupe_scope
        log(f"connecting to {host}:{port} as {user}")
        self.conn = imaplib.IMAP4_SSL(host, port, ssl_context=ssl.create_default_context())
        try:
            self.conn.login(user, password)
        except imaplib.IMAP4.error as exc:
            die(
                f"IMAP login failed ({exc}). Gmail and iCloud need an app password, "
                "not your normal one — see the README."
            )
        code, _ = self.conn.create(self._quote(folder))
        if code == "OK":
            log(f"created destination folder {folder}")
        self._select(self.dedupe_scope or folder, readonly=True)

    @staticmethod
    def _quote(name: str) -> str:
        return '"%s"' % name.replace("\\", "\\\\").replace('"', '\\"')

    def _select(self, folder: str, readonly: bool = False) -> bool:
        code, _ = self.conn.select(self._quote(folder), readonly=readonly)
        return code == "OK"

    def has(self, message_id: str) -> bool:
        if not message_id:
            return False
        scope = self.dedupe_scope or self.folder
        if not self._select(scope, readonly=True):
            return False
        code, data = self.conn.search(None, "HEADER", "Message-ID", self._quote(message_id))
        return code == "OK" and bool(data and data[0].split())

    def append(self, mime: bytes, received: Optional[datetime], seen: bool) -> None:
        stamp = imaplib.Time2Internaldate(received.timestamp()) if received else None
        flags = "(\\Seen)" if seen else None
        code, data = self.conn.append(self._quote(self.folder), flags, stamp, mime)
        if code != "OK":
            raise RuntimeError(f"IMAP APPEND rejected: {data!r}")

    def close(self) -> None:
        try:
            self.conn.logout()
        except Exception:  # noqa: BLE001 - logout failures are not interesting
            pass


class GraphDestination(Destination):
    """Second Microsoft account — same MIME, uploaded through Graph."""

    def __init__(self, account: GraphAccount, folder: str):
        self.account = account
        self.folder_id = self._ensure_folder(folder)

    def _ensure_folder(self, name: str) -> str:
        for folder in self.account.paged("/me/mailFolders", **{"$top": "100"}):
            if folder.get("displayName", "").lower() == name.lower():
                return folder["id"]
        log(f"creating destination folder {name}")
        return self.account.post("/me/mailFolders", {"displayName": name})["id"]

    def has(self, message_id: str) -> bool:
        if not message_id:
            return False
        escaped = message_id.replace("'", "''")
        res = self.account.get(
            f"/me/mailFolders/{self.folder_id}/messages",
            **{"$filter": f"internetMessageId eq '{escaped}'", "$select": "id", "$top": "1"},
        )
        return bool(res.get("value"))

    def append(self, mime: bytes, received: Optional[datetime], seen: bool) -> None:
        self.account.post(
            f"/me/mailFolders/{self.folder_id}/messages",
            base64.b64encode(mime),
            content_type="text/plain",
        )

    def close(self) -> None:
        pass


# --------------------------------------------------------------------------- #
# the migration itself
# --------------------------------------------------------------------------- #


def parse_graph_time(value: Optional[str]) -> Optional[datetime]:
    if not value:
        return None
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00")).astimezone(timezone.utc)
    except ValueError:
        return None


def describe(msg: dict) -> str:
    sender = ((msg.get("from") or {}).get("emailAddress") or {}).get("address", "?")
    date = (msg.get("receivedDateTime") or "")[:10]
    subject = (msg.get("subject") or "(no subject)")[:70]
    return f"{date}  {sender:<34.34}  {subject}"


def ensure_source_archive(account: GraphAccount, name: str) -> str:
    for folder in account.paged("/me/mailFolders", **{"$top": "100"}):
        if folder.get("displayName", "").lower() == name.lower():
            return folder["id"]
    log(f"creating source archive folder {name}")
    return account.post("/me/mailFolders", {"displayName": name})["id"]


def migrate(args: argparse.Namespace) -> int:
    source = GraphAccount(args.client_id, args.tenant, args.token_file, "source")
    log(f"source mailbox: {source.whoami()}")

    terms = args.term or DEFAULT_TERMS
    if args.mode == "search":
        found = discover_by_search(source, terms)
    else:
        found = discover_by_scan(source, terms, args.deep, args.include_all_folders)

    messages = dedupe(found.values())
    if args.since:
        messages = [m for m in messages if (m.get("receivedDateTime") or "") >= args.since]
    if args.limit:
        messages = messages[: args.limit]

    log(f"{len(messages)} distinct message(s) match {terms}")
    if not messages:
        return 0

    if not args.execute:
        print("\n--- dry run: nothing will be copied or removed ---\n")
        for msg in messages:
            print("  " + describe(msg))
        print(
            f"\n{len(messages)} message(s) would be copied to {args.dest_folder!r}"
            f"{' and then ' + args.after + 'd at the source' if args.after != 'none' else ''}."
            "\nRe-run with --execute to perform the move."
        )
        return 0

    state = read_json(args.state_file, {})
    dest = build_destination(args)
    archive_id = (
        ensure_source_archive(source, args.archive_folder) if args.after == "archive" else None
    )

    copied = skipped = failed = 0
    try:
        for index, msg in enumerate(messages, 1):
            key = msg.get("internetMessageId") or msg["id"]
            if state.get(key, {}).get("copied"):
                skipped += 1
                continue
            log(f"[{index}/{len(messages)}] {describe(msg)}")
            try:
                if dest.has(key):
                    log("  already at the destination — skipping")
                    state[key] = {"copied": True, "reason": "already-present"}
                    skipped += 1
                else:
                    mime = source.get_raw(f"/me/messages/{msg['id']}/$value")
                    dest.append(
                        mime,
                        parse_graph_time(msg.get("receivedDateTime")),
                        bool(msg.get("isRead")),
                    )
                    state[key] = {
                        "copied": True,
                        "subject": msg.get("subject"),
                        "received": msg.get("receivedDateTime"),
                        "at": datetime.now(timezone.utc).isoformat(),
                    }
                    copied += 1
                    log("  copied")

                if args.after == "archive":
                    source.post(
                        f"/me/messages/{msg['id']}/move", {"destinationId": archive_id}
                    )
                    state[key]["source"] = "archived"
                elif args.after == "delete":
                    source.delete(f"/me/messages/{msg['id']}")
                    state[key]["source"] = "deleted"
            except Exception as exc:  # noqa: BLE001 - one bad message must not end the run
                failed += 1
                log(f"  FAILED: {exc}")
                state[key] = {"copied": False, "error": str(exc)}
            finally:
                write_private_json(args.state_file, state)
    finally:
        dest.close()

    log(f"done — {copied} copied, {skipped} skipped, {failed} failed")
    log(f"progress recorded in {args.state_file} (re-running resumes from here)")
    return 1 if failed else 0


def build_destination(args: argparse.Namespace) -> Destination:
    if args.dest == "graph":
        account = GraphAccount(
            args.dest_client_id or args.client_id,
            args.dest_tenant or args.tenant,
            args.token_file,
            "destination",
        )
        log(f"destination mailbox: {account.whoami()}")
        return GraphDestination(account, args.dest_folder)

    password = args.dest_password or os.environ.get("DEST_IMAP_PASSWORD")
    if not password:
        password = getpass.getpass(f"IMAP app password for {args.dest_user}: ")
    return ImapDestination(
        args.dest_host,
        args.dest_port,
        args.dest_user,
        password,
        args.dest_folder,
        args.dest_dedupe_folder,
    )


# --------------------------------------------------------------------------- #
# cli
# --------------------------------------------------------------------------- #


def parse_args(argv: list[str]) -> argparse.Namespace:
    p = argparse.ArgumentParser(
        description=__doc__,
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""examples:
  # see what would move (always start here)
  python3 migrate_flyon_emails.py --dest-user me@gmail.com

  # actually move it, leaving the originals in Outlook
  python3 migrate_flyon_emails.py --dest-user me@gmail.com --execute

  # move it and file the originals away in Outlook under "Flyon (migrated)"
  python3 migrate_flyon_emails.py --dest-user me@gmail.com --execute --after archive

  # exhaustive folder-by-folder scan, matching the full message body
  python3 migrate_flyon_emails.py --dest-user me@gmail.com --mode scan --deep --execute
""",
    )
    p.add_argument(
        "--client-id",
        default=os.environ.get("MS_CLIENT_ID"),
        help="Azure app registration (public client) ID. Env: MS_CLIENT_ID",
    )
    p.add_argument(
        "--tenant",
        default=os.environ.get("MS_TENANT", "consumers"),
        help="'consumers' for outlook.com/hotmail/live (default), 'common' for work accounts",
    )
    p.add_argument(
        "--term",
        action="append",
        help=f"search term, repeatable (default: {DEFAULT_TERMS})",
    )
    p.add_argument(
        "--mode",
        choices=("search", "scan"),
        default="search",
        help="'search' asks Exchange (fast, ~1000 hits per term); "
        "'scan' walks every folder locally (slow, complete)",
    )
    p.add_argument(
        "--deep",
        action="store_true",
        help="scan mode: download each message and match the full body, not just the preview",
    )
    p.add_argument(
        "--include-all-folders",
        action="store_true",
        help="scan mode: also include Deleted Items and Junk",
    )
    p.add_argument("--since", help="only messages received on/after this date (YYYY-MM-DD)")
    p.add_argument("--limit", type=int, help="stop after this many messages")

    p.add_argument("--dest", choices=("imap", "graph"), default="imap", help="destination kind")
    p.add_argument(
        "--dest-host",
        default=os.environ.get("DEST_IMAP_HOST", "imap.gmail.com"),
        help="IMAP host (default imap.gmail.com). Env: DEST_IMAP_HOST",
    )
    p.add_argument("--dest-port", type=int, default=int(os.environ.get("DEST_IMAP_PORT", "993")))
    p.add_argument(
        "--dest-user",
        default=os.environ.get("DEST_IMAP_USER"),
        help="the new email address. Env: DEST_IMAP_USER",
    )
    p.add_argument(
        "--dest-password",
        default=None,
        help="IMAP app password. Prefer the DEST_IMAP_PASSWORD env var or the prompt",
    )
    p.add_argument(
        "--dest-folder",
        default="Flyon",
        help="folder/label the mail lands in at the destination (default: Flyon)",
    )
    p.add_argument(
        "--dest-dedupe-folder",
        default=os.environ.get("DEST_DEDUPE_FOLDER", ""),
        help='folder searched for already-migrated Message-IDs (Gmail: "[Gmail]/All Mail")',
    )
    p.add_argument("--dest-client-id", help="Azure client ID for a Graph destination")
    p.add_argument("--dest-tenant", help="tenant for a Graph destination")

    p.add_argument(
        "--after",
        choices=("none", "archive", "delete"),
        default="none",
        help="what to do with the Outlook original once the copy is confirmed (default: none)",
    )
    p.add_argument(
        "--archive-folder",
        default="Flyon (migrated)",
        help="folder the originals move to with --after archive",
    )

    p.add_argument("--state-file", default=DEFAULT_STATE, help="resume/progress log")
    p.add_argument("--token-file", default=DEFAULT_TOKENS, help="OAuth token cache (0600)")
    p.add_argument(
        "--execute",
        action="store_true",
        help="perform the migration; without it the script only reports what it found",
    )

    args = p.parse_args(argv)
    if not args.client_id:
        p.error("--client-id (or MS_CLIENT_ID) is required — see the README for the 5-minute setup")
    if args.dest == "imap" and not args.dest_user:
        p.error("--dest-user (or DEST_IMAP_USER) is required for an IMAP destination")
    if args.deep and args.mode != "scan":
        p.error("--deep only applies to --mode scan")
    if args.since:
        try:
            datetime.strptime(args.since, "%Y-%m-%d")
        except ValueError:
            p.error("--since must be YYYY-MM-DD")
        args.since = f"{args.since}T00:00:00Z"
    return args


def main(argv: list[str]) -> int:
    args = parse_args(argv)
    try:
        return migrate(args)
    except KeyboardInterrupt:
        log("interrupted — re-run the same command to resume")
        return 130


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
