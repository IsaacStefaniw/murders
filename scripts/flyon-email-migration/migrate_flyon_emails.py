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
import csv
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
from typing import Any, Iterable, Iterator, Optional

GRAPH = "https://graph.microsoft.com/v1.0"
LOGIN = "https://login.microsoftonline.com"
SCOPES = "offline_access Mail.ReadWrite"

DEFAULT_STATE = os.path.expanduser("~/.flyon-email-migration/state.json")
DEFAULT_REVIEW = os.path.expanduser("~/.flyon-email-migration/review.csv")
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
    "id,internetMessageId,conversationId,subject,receivedDateTime,sentDateTime,isRead,"
    "from,sender,toRecipients,ccRecipients,bccRecipients,replyTo,bodyPreview,"
    "hasAttachments,parentFolderId"
)

# Folders whose contents are not mail you want to carry over.
SKIP_FOLDERS = {"deleteditems", "junkemail", "recoverableitemsdeletions", "conflicts", "syncissues"}

STRONG, WEAK, THREAD, EXCLUDED, NO_MATCH = "strong", "weak", "thread", "excluded", "no-match"


def domain_of(address: str) -> str:
    return address.rpartition("@")[2].lower()


def domain_matches(address: str, domains: Iterable[str]) -> bool:
    """flyon.io matches billing@flyon.io and billing@mail.flyon.io, not notflyon.io."""
    host = domain_of(address)
    return any(host == d or host.endswith("." + d) for d in domains)


class Rules:
    """What counts as Flyon business mail, and what is merely personal.

    Three tiers, because a business's mail does not all mention the business by
    name — the accountant writes from their own domain, Stripe writes about
    "your account", and a supplier thread wanders off into small talk:

      strong  a Flyon address is on the message, or the counterparty is one of
              your known business contacts, or a strong keyword is present.
              Migrated without further question.
      weak    a keyword turned up somewhere. Migrated unless an exclude rule
              fires, and flagged for review in the report.
      thread  not a match itself, but part of a conversation that has a strong
              match in it. This is what catches the replies that say only
              "sounds good" — a strong signal, but never overriding an exclude.
    """

    FIELDS = (
        "business_addresses",
        "business_domains",
        "counterparties",
        "strong_keywords",
        "keywords",
        "exclude_addresses",
        "exclude_domains",
        "exclude_keywords",
        "exclude_folders",
    )

    def __init__(self, cfg: Optional[dict] = None):
        cfg = cfg or {}
        for field in self.FIELDS:
            value = cfg.get(field) or []
            if not isinstance(value, list):
                die(f"rules: {field} must be a list")
            setattr(self, field, [str(v).strip().lower().lstrip("@") for v in value if str(v).strip()])
        if not any(getattr(self, f) for f in ("business_addresses", "business_domains", "keywords", "strong_keywords")):
            self.keywords = ["flyon"]
        self.thread_expansion = bool(cfg.get("thread_expansion", True))
        self.exclusions_override_strong = bool(cfg.get("exclusions_override_strong", False))
        self._strong_kw = self._compile(self.strong_keywords)
        self._kw = self._compile(self.keywords)
        self._exclude_kw = self._compile(self.exclude_keywords)

    @staticmethod
    def _compile(words: list[str]) -> Optional[re.Pattern]:
        """Keywords match at a word start only.

        So "flyon" catches flyon.io, flyonapp and Flyon's, but not the
        notflyon.io that a lookalike sender would give you.
        """
        if not words:
            return None
        return re.compile(
            "|".join(r"(?<![0-9a-z])" + re.escape(w) for w in words), re.IGNORECASE
        )

    @classmethod
    def load(cls, path: Optional[str], extra_terms: Optional[list[str]] = None) -> "Rules":
        cfg: dict = {}
        if path:
            if not os.path.exists(path):
                die(f"rules file not found: {path}")
            try:
                with open(path) as fh:
                    cfg = json.load(fh)
            except json.JSONDecodeError as exc:
                die(f"rules file {path} is not valid JSON: {exc}")
            known = set(cls.FIELDS) | {"thread_expansion", "exclusions_override_strong"}
            unknown = {k for k in cfg if k not in known and not k.startswith("_")}
            if unknown:
                log(f"warning: ignoring unknown rule key(s): {', '.join(sorted(unknown))}")
        if extra_terms:
            cfg = dict(cfg)
            cfg["keywords"] = list(cfg.get("keywords") or []) + list(extra_terms)
        return cls(cfg)

    # -- what to ask Exchange for ----------------------------------------- #

    def search_terms(self) -> list[str]:
        terms = (
            self.business_addresses
            + self.business_domains
            + self.counterparties
            + self.strong_keywords
            + self.keywords
        )
        return list(dict.fromkeys(terms))

    # -- classification ---------------------------------------------------- #

    @staticmethod
    def participants(msg: dict) -> list[str]:
        out = []
        for key in ("from", "sender"):
            addr = ((msg.get(key) or {}).get("emailAddress") or {}).get("address")
            if addr:
                out.append(addr.lower())
        for key in ("toRecipients", "ccRecipients", "bccRecipients", "replyTo"):
            for rec in msg.get(key) or []:
                addr = (rec.get("emailAddress") or {}).get("address")
                if addr:
                    out.append(addr.lower())
        return out

    def classify(self, msg: dict, extra_text: str = "") -> tuple[str, str]:
        addrs = self.participants(msg)
        text = message_haystack(msg) + extra_text

        strong: Optional[str] = None
        for addr in addrs:
            if addr in self.business_addresses:
                strong = f"flyon address {addr}"
                break
            if self.business_domains and domain_matches(addr, self.business_domains):
                strong = f"flyon domain {domain_of(addr)}"
                break
            if self.counterparties and (
                addr in self.counterparties or domain_matches(addr, self.counterparties)
            ):
                strong = f"business contact {addr}"
                break
        if not strong and self._strong_kw:
            hit = self._strong_kw.search(text)
            if hit:
                strong = f"keyword {hit.group(0)!r}"

        excluded: Optional[str] = None
        for addr in addrs:
            if addr in self.exclude_addresses:
                excluded = f"excluded address {addr}"
                break
            if self.exclude_domains and domain_matches(addr, self.exclude_domains):
                excluded = f"excluded domain {domain_of(addr)}"
                break
        if not excluded and self._exclude_kw:
            hit = self._exclude_kw.search(text)
            if hit:
                excluded = f"excluded keyword {hit.group(0)!r}"

        weak = self._kw.search(text) if self._kw else None

        if strong:
            if excluded and self.exclusions_override_strong:
                return EXCLUDED, excluded
            return STRONG, strong
        if excluded:
            return EXCLUDED, excluded
        if weak:
            return WEAK, f"keyword {weak.group(0)!r}"
        return NO_MATCH, ""

    def folder_excluded(self, folder_path: str) -> bool:
        low = folder_path.lower()
        return any(f in low for f in self.exclude_folders)


def message_haystack(msg: dict) -> str:
    """Everything about a message that is cheap to search."""
    parts = [msg.get("subject") or "", msg.get("bodyPreview") or ""]
    for key in ("from", "sender"):
        addr = (msg.get(key) or {}).get("emailAddress") or {}
        parts += [addr.get("name") or "", addr.get("address") or ""]
    for key in ("toRecipients", "ccRecipients", "bccRecipients", "replyTo"):
        for rec in msg.get(key) or []:
            addr = rec.get("emailAddress") or {}
            parts += [addr.get("name") or "", addr.get("address") or ""]
    return "\n".join(parts)


def walk_folders(account: GraphAccount) -> Iterator[tuple[dict, str]]:
    """Every mail folder, with its full path, including nested ones."""
    stack = [(f, f.get("displayName", "?")) for f in account.paged("/me/mailFolders", **{"$top": "100"})]
    while stack:
        folder, path = stack.pop()
        yield folder, path
        if folder.get("childFolderCount"):
            for child in account.paged(
                f"/me/mailFolders/{folder['id']}/childFolders", **{"$top": "100"}
            ):
                stack.append((child, f"{path}/{child.get('displayName', '?')}"))


def discover_by_search(account: GraphAccount, rules: Rules) -> dict[str, dict]:
    """Mailbox-side search: fast, but Exchange caps a search at ~1000 hits per term."""
    found: dict[str, dict] = {}
    for term in rules.search_terms():
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
    account: GraphAccount, rules: Rules, deep: bool, include_all_folders: bool
) -> dict[str, dict]:
    """Walk every folder and match locally. Slower, but nothing is capped."""
    found: dict[str, dict] = {}
    for folder, path in walk_folders(account):
        well_known = (folder.get("wellKnownName") or "").lower()
        if not include_all_folders and well_known in SKIP_FOLDERS:
            log(f"skipping folder {path}")
            continue
        if rules.folder_excluded(path):
            log(f"skipping excluded folder {path}")
            continue
        if not folder.get("totalItemCount"):
            continue
        log(f"scanning {path} ({folder['totalItemCount']} items)")
        hits = 0
        for msg in account.paged(
            f"/me/mailFolders/{folder['id']}/messages",
            **{"$select": MESSAGE_FIELDS, "$top": "100"},
        ):
            body = ""
            if deep:
                body = account.get_raw(f"/me/messages/{msg['id']}/$value").decode("utf-8", "replace")
            verdict, reason = rules.classify(msg, body)
            if verdict in (STRONG, WEAK):
                msg["_verdict"], msg["_reason"] = verdict, reason
                found[msg["id"]] = msg
                hits += 1
        log(f"  {hits} match")
    return found


def classify_all(rules: Rules, candidates: dict[str, dict]) -> dict[str, dict]:
    """Apply the include/exclude rules to whatever discovery turned up."""
    kept: dict[str, dict] = {}
    dropped = 0
    for msg_id, msg in candidates.items():
        verdict, reason = msg.get("_verdict"), msg.get("_reason")
        if not verdict:
            verdict, reason = rules.classify(msg)
        if verdict in (STRONG, WEAK):
            msg["_verdict"], msg["_reason"] = verdict, reason
            kept[msg_id] = msg
        else:
            dropped += 1
    if dropped:
        log(f"{dropped} candidate(s) dropped as personal or unrelated")
    return kept


def expand_threads(account: GraphAccount, rules: Rules, kept: dict[str, dict]) -> dict[str, dict]:
    """Pull in the rest of any conversation that has a strong match in it.

    This is the catch-all: the reply that says only "sounds good, see you then"
    never mentions Flyon, but it belongs with the thread that does.
    """
    conversations = {
        msg["conversationId"]
        for msg in kept.values()
        if msg.get("_verdict") == STRONG and msg.get("conversationId")
    }
    if not conversations:
        return kept
    log(f"expanding {len(conversations)} conversation(s) with a strong match")
    added = skipped = 0
    for index, conversation in enumerate(sorted(conversations), 1):
        if index % 25 == 0:
            log(f"  {index}/{len(conversations)} conversations")
        escaped = conversation.replace("'", "''")
        try:
            siblings = account.paged(
                "/me/messages",
                **{
                    "$filter": f"conversationId eq '{escaped}'",
                    "$select": MESSAGE_FIELDS,
                    "$top": "50",
                },
            )
            for msg in siblings:
                if msg["id"] in kept:
                    continue
                verdict, reason = rules.classify(msg)
                if verdict == EXCLUDED:
                    skipped += 1
                    continue
                msg["_verdict"] = verdict if verdict in (STRONG, WEAK) else THREAD
                msg["_reason"] = reason or "same thread as a Flyon message"
                kept[msg["id"]] = msg
                added += 1
        except RuntimeError as exc:
            log(f"  could not expand a conversation: {exc}")
    log(f"  {added} message(s) added from threads, {skipped} left behind by exclude rules")
    return kept


def dedupe(messages: Iterable[dict]) -> list[dict]:
    """One copy per Message-ID — the same mail often sits in Inbox and Sent/Archive."""
    seen: dict[str, dict] = {}
    for msg in messages:
        key = msg.get("internetMessageId") or msg["id"]
        current = seen.get(key)
        if current is None:
            seen[key] = msg
        elif current.get("_verdict") != STRONG and msg.get("_verdict") == STRONG:
            seen[key] = msg  # keep the copy with the clearest reason
    return sorted(seen.values(), key=lambda m: m.get("receivedDateTime") or "")


def counterparty(msg: dict) -> str:
    """The other end of the message — who it is from, or failing that, who to."""
    addr = ((msg.get("from") or {}).get("emailAddress") or {}).get("address")
    if addr:
        return addr.lower()
    for rec in msg.get("toRecipients") or []:
        addr = (rec.get("emailAddress") or {}).get("address")
        if addr:
            return addr.lower()
    return "(unknown)"


def report_senders(messages: list[dict]) -> None:
    """Who is in the candidate set, so the rules can be written from evidence."""
    by_domain: dict[str, list[dict]] = {}
    for msg in messages:
        by_domain.setdefault(domain_of(counterparty(msg)) or "(none)", []).append(msg)
    print(f"\n{'count':>6}  {'strong':>6}  domain / addresses")
    print("-" * 78)
    for domain, msgs in sorted(by_domain.items(), key=lambda kv: -len(kv[1])):
        strong = sum(1 for m in msgs if m.get("_verdict") == STRONG)
        addrs = sorted({counterparty(m) for m in msgs})
        print(f"{len(msgs):>6}  {strong:>6}  {domain}")
        for addr in addrs[:6]:
            print(f"{'':>16}{addr}")
        if len(addrs) > 6:
            print(f"{'':>16}... and {len(addrs) - 6} more")
    print(
        "\nPut the business ones under \"counterparties\" and the personal ones under "
        '"exclude_domains" / "exclude_addresses" in your rules file.'
    )


REVIEW_COLUMNS = ["keep", "verdict", "reason", "date", "counterparty", "subject", "message_id", "graph_id"]


def write_review(path: str, messages: list[dict]) -> None:
    directory = os.path.dirname(path)
    if directory:
        os.makedirs(directory, exist_ok=True)
    with open(path, "w", newline="") as fh:
        writer = csv.DictWriter(fh, fieldnames=REVIEW_COLUMNS)
        writer.writeheader()
        for msg in messages:
            verdict = msg.get("_verdict", WEAK)
            writer.writerow(
                {
                    "keep": "yes" if verdict in (STRONG, THREAD) else "review",
                    "verdict": verdict,
                    "reason": msg.get("_reason", ""),
                    "date": (msg.get("receivedDateTime") or "")[:10],
                    "counterparty": counterparty(msg),
                    "subject": (msg.get("subject") or "")[:120],
                    "message_id": msg.get("internetMessageId") or "",
                    "graph_id": msg["id"],
                }
            )
    log(f"review list written to {path}")


def read_review(path: str) -> set[str]:
    """Message keys the reviewer left marked 'yes'."""
    if not os.path.exists(path):
        die(f"review file not found: {path} (run without --execute first)")
    keep: set[str] = set()
    with open(path, newline="") as fh:
        for row in csv.DictReader(fh):
            if (row.get("keep") or "").strip().lower().startswith("y"):
                keep.add(row.get("message_id") or row.get("graph_id") or "")
    return keep


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
    date = (msg.get("receivedDateTime") or "")[:10]
    subject = (msg.get("subject") or "(no subject)")[:62]
    return f"{date}  {counterparty(msg):<32.32}  {subject}"


def ensure_source_archive(account: GraphAccount, name: str) -> str:
    for folder in account.paged("/me/mailFolders", **{"$top": "100"}):
        if folder.get("displayName", "").lower() == name.lower():
            return folder["id"]
    log(f"creating source archive folder {name}")
    return account.post("/me/mailFolders", {"displayName": name})["id"]


def migrate(args: argparse.Namespace) -> int:
    rules = Rules.load(args.rules, args.term)
    if args.no_thread_expansion:
        rules.thread_expansion = False

    source = GraphAccount(args.client_id, args.tenant, args.token_file, "source")
    log(f"source mailbox: {source.whoami()}")

    log(f"matching on {len(rules.search_terms())} term(s); "
        f"{len(rules.exclude_addresses) + len(rules.exclude_domains) + len(rules.exclude_keywords)} "
        "exclude rule(s)")

    if args.mode == "search":
        candidates = discover_by_search(source, rules)
    else:
        candidates = discover_by_scan(source, rules, args.deep, args.include_all_folders)

    kept = classify_all(rules, candidates)
    if rules.thread_expansion:
        kept = expand_threads(source, rules, kept)

    messages = dedupe(kept.values())
    if args.since:
        messages = [m for m in messages if (m.get("receivedDateTime") or "") >= args.since]
    if args.limit:
        messages = messages[: args.limit]

    tally = {v: sum(1 for m in messages if m.get("_verdict") == v) for v in (STRONG, THREAD, WEAK)}
    log(
        f"{len(messages)} distinct message(s): {tally[STRONG]} certain, "
        f"{tally[THREAD]} from their threads, {tally[WEAK]} to review"
    )
    if not messages:
        return 0

    if args.report_senders:
        report_senders(messages)
        return 0

    if not args.execute:
        print("\n--- dry run: nothing will be copied or removed ---\n")
        for verdict, heading in (
            (STRONG, "certain — a Flyon address or business contact is on these"),
            (THREAD, "part of a conversation that has a certain match in it"),
            (WEAK, "keyword only — check these before executing"),
        ):
            group = [m for m in messages if m.get("_verdict") == verdict]
            if not group:
                continue
            print(f"  [{verdict}] {heading}")
            for msg in group:
                print(f"    {describe(msg)}   ({msg.get('_reason', '')})")
            print()
        write_review(args.review_file, messages)
        print(
            f"{len(messages)} message(s) would be copied to {args.dest_folder!r}"
            f"{' and then ' + args.after + 'd at the source' if args.after != 'none' else ''}."
            f"\n\nEdit the keep column in {args.review_file} (yes/no), then re-run with"
            "\n--execute --use-review to move exactly what you approved,"
            "\nor --execute alone to move everything listed above."
        )
        return 0

    if args.use_review:
        approved = read_review(args.review_file)
        before = len(messages)
        messages = [
            m for m in messages
            if (m.get("internetMessageId") or "") in approved or m["id"] in approved
        ]
        log(f"review file approves {len(messages)} of {before} message(s)")
        if not messages:
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
  # 1. who is this mail actually with? use it to write flyon-rules.json
  python3 migrate_flyon_emails.py --dest-user me@gmail.com --report-senders

  # 2. see what the rules catch, and get a review CSV (nothing moves)
  python3 migrate_flyon_emails.py --dest-user me@gmail.com --rules flyon-rules.json

  # 3. move exactly the rows you left marked keep=yes in that CSV
  python3 migrate_flyon_emails.py --dest-user me@gmail.com --execute --use-review

  # move everything the rules matched, and file the Outlook originals away
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
        "--rules",
        default=os.environ.get("FLYON_RULES") or (
            "flyon-rules.json" if os.path.exists("flyon-rules.json") else None
        ),
        help="JSON file describing what is Flyon business mail and what is not "
        "(see flyon-rules.example.json). Env: FLYON_RULES",
    )
    p.add_argument(
        "--term",
        action="append",
        help="extra keyword on top of the rules file, repeatable (default: flyon)",
    )
    p.add_argument(
        "--no-thread-expansion",
        action="store_true",
        help="do not pull in the rest of a conversation that has a certain match in it",
    )
    p.add_argument(
        "--report-senders",
        action="store_true",
        help="list who the candidate mail is with, grouped by domain, and exit — "
        "the quickest way to write the rules file",
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

    p.add_argument(
        "--review-file",
        default=DEFAULT_REVIEW,
        help="CSV of what matched and why, written on every dry run",
    )
    p.add_argument(
        "--use-review",
        action="store_true",
        help="migrate only the rows you left marked keep=yes in the review file",
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
    if args.use_review and not args.execute:
        p.error("--use-review applies to the migration itself; add --execute")
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
    except RuntimeError as exc:
        message = str(exc)
        if "AADSTS700016" in message:
            die("Microsoft does not recognise that client ID — check MS_CLIENT_ID, "
                "and that --tenant matches the account type (consumers vs common).")
        if "AADSTS7000218" in message or "public client" in message:
            die("the app registration has not enabled public client flows — "
                "Authentication -> Allow public client flows -> Yes.")
        die(message)


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
