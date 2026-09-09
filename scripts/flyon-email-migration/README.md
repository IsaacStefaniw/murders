# Flyon email migration

Moves every Flyon-related message out of a personal Outlook mailbox and into
another account (Gmail, Fastmail, iCloud, a second Outlook — anything with IMAP,
or Microsoft Graph).

Messages are transferred as their original RFC-822 MIME, so senders, recipients,
attachments, threading headers and the received date all survive. The Outlook
originals are left alone unless you explicitly ask for them to be archived or
deleted, and that only happens after the destination has confirmed the copy.

One file, Python 3.9+, no pip install — everything is standard library.

## Setup (about five minutes, once)

### 1. An Azure app registration for the Outlook side

Microsoft turned off basic-auth IMAP for personal Outlook accounts, so reading
the mailbox means OAuth via Graph. You register a small app of your own; nothing
is shared with anyone else.

1. <https://portal.azure.com> → **Microsoft Entra ID** → **App registrations** →
   **New registration**.
2. Name it anything (`flyon-migration`). For **Supported account types** pick
   *Personal Microsoft accounts only* if the mailbox is `@outlook.com`,
   `@hotmail.com` or `@live.com`; pick *Accounts in any organizational directory
   and personal Microsoft accounts* if it might be a work/school account. Leave
   the redirect URI blank. Register.
3. **Authentication** → *Advanced settings* → **Allow public client flows** →
   **Yes** → Save. (This enables the device-code sign-in; without it the script
   cannot log in.)
4. **API permissions** → **Add a permission** → **Microsoft Graph** →
   **Delegated permissions** → tick **Mail.ReadWrite** → Add.
5. Copy the **Application (client) ID** from the Overview page.

```bash
export MS_CLIENT_ID=<the application (client) id>
# work/school mailbox instead of outlook.com? also: export MS_TENANT=common
```

The script prints a code and a URL on first run; you sign in once in a browser
and the refresh token is cached in `~/.flyon-email-migration/tokens.json`
(mode 0600).

### 2. Credentials for the new mailbox

| Destination | Host | Password to use |
| --- | --- | --- |
| Gmail | `imap.gmail.com` | an [app password](https://myaccount.google.com/apppasswords) (needs 2-Step Verification on, and IMAP enabled in Gmail → Settings → Forwarding and POP/IMAP) |
| iCloud | `imap.mail.me.com` | an app-specific password from appleid.apple.com |
| Fastmail | `imap.fastmail.com` | an app password from Settings → Privacy & Security |
| Another Outlook | — | use `--dest graph` instead, with its own client ID |

```bash
export DEST_IMAP_USER=new.address@gmail.com
export DEST_IMAP_PASSWORD='xxxx xxxx xxxx xxxx'   # or let the script prompt
```

## Use

Always look before you leap — with no `--execute`, the script only reports:

```bash
python3 migrate_flyon_emails.py
```

```
09:12:04  source mailbox: you@outlook.com
09:12:05  searching mailbox for 'flyon'
09:12:09    41 new (running total 41)
09:12:09  38 distinct message(s) match ['flyon']

--- dry run: nothing will be copied or removed ---

  2023-04-11  billing@flyon.io                    Your Flyon subscription
  ...
```

When the list looks right:

```bash
# copy everything into a "Flyon" folder/label on the new account
python3 migrate_flyon_emails.py --execute

# copy, then file the Outlook originals under "Flyon (migrated)"
python3 migrate_flyon_emails.py --execute --after archive

# copy, then delete the Outlook originals (they land in Deleted Items)
python3 migrate_flyon_emails.py --execute --after delete
```

Progress is written to `~/.flyon-email-migration/state.json` after every
message, so an interrupted run resumes where it left off and re-running never
duplicates mail. The destination is also checked for the `Message-ID` before
each append, as a second line of defence.

### Useful flags

```bash
--term flyon --term flyon.io      # add search terms (repeatable; default: flyon)
--mode scan                       # walk every folder instead of asking Exchange to search
--mode scan --deep                # ...and match against full message bodies, not previews
--include-all-folders             # scan mode: include Deleted Items and Junk too
--since 2022-01-01                # only mail from this date onwards
--limit 5                         # try a handful first
--dest-folder "Flyon/Personal"    # where it lands at the destination
--dest-dedupe-folder "[Gmail]/All Mail"   # check all of Gmail, not just the new label
--dest graph --dest-client-id <id>        # destination is another Microsoft account
```

## Choosing a mode

`--mode search` (the default) hands the query to Exchange. It is fast and looks
inside attachments, but a single search tops out around 1000 results, and it
matches Microsoft's notion of relevance rather than a literal substring.

`--mode scan` enumerates every folder and matches locally against the subject,
sender, recipients and the 255-character preview. Nothing is capped. Add
`--deep` to download each message and match the entire body — thorough, but it
transfers the whole mailbox, so pair it with `--since` on a large one.

If completeness matters more than time, run search first, then scan: the state
file means the second run only picks up what the first one missed.

## Notes

- Read/unread state is preserved. Outlook categories and folder structure are
  not — everything lands in one destination folder, which is what you want when
  the point is to consolidate.
- Gmail treats the destination folder as a label; nested labels use `/`.
- `--after delete` moves originals to Deleted Items rather than purging them, so
  there is a recovery window.
- Nothing about your mailbox leaves your machine: the script talks to Microsoft
  and to your destination server, and to nothing else.
