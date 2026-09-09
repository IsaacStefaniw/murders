# Flyon email migration

Moves every Flyon-related message out of a personal Outlook mailbox and into
another account (Gmail, Fastmail, iCloud, a second Outlook — anything with IMAP,
or Microsoft Graph), while leaving the rest of your personal mail where it is.

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

## What counts as Flyon mail

Searching for the word "flyon" is both too narrow and too wide. It misses the
accountant who writes from their own domain, the Stripe payout notice, the
supplier thread that drifts into "sounds good, see you Tuesday" — and it sweeps
up the friend who once asked how Flyon was going.

So matching is rule-driven, in three tiers, defined in a JSON file (start from
`flyon-rules.example.json`, copy it to `flyon-rules.json`):

| Tier | What triggers it | What happens |
| --- | --- | --- |
| **certain** | a Flyon address is on the message (`business_addresses`), the counterparty is a Flyon domain (`business_domains`) or a known business contact (`counterparties`), or a `strong_keywords` hit | migrated |
| **thread** | not a match itself, but part of a conversation containing a certain match | migrated — this is the catch-all |
| **review** | a `keywords` hit and nothing else | migrated, but flagged for you to check |

Against that, three exclusions — `exclude_addresses`, `exclude_domains`,
`exclude_keywords` (plus `exclude_folders` in scan mode) — drop personal mail
that would otherwise sneak in on a keyword. By default an exclusion beats a
review-tier match but not a certain one, on the grounds that mail sent to your
Flyon address is business mail whoever it came from. Set
`"exclusions_override_strong": true` if you want the exclusion to win outright.

Two details that matter in practice:

- **Domains cover their subdomains.** `flyon.io` matches `billing@flyon.io` and
  `receipts@mail.flyon.io`, and does not match `flyon.io.phish.example`.
- **Keywords match at a word start.** `flyon` catches `flyon.io`, `flyonapp` and
  `Flyon's`, but not `notflyon`.

### Writing the rules from evidence, not memory

You do not have to guess who you have been dealing with. Ask:

```bash
python3 migrate_flyon_emails.py --report-senders
```

```
 count  strong  domain / addresses
------------------------------------------------------------------------------
    64      64  flyon.io
                billing@flyon.io
                isaac@flyon.io
    31       0  etsy.com
    12       0  strava.com
```

Business domains go under `counterparties`, personal ones under
`exclude_domains`, and you converge in a couple of passes.

## Use

Always look before you leap — with no `--execute`, the script only reports:

```bash
python3 migrate_flyon_emails.py --rules flyon-rules.json
```

```
09:12:04  source mailbox: you@outlook.com
09:12:05  matching on 9 term(s); 4 exclude rule(s)
09:12:09  searching mailbox for 'flyon.io'
09:12:14  17 candidate(s) dropped as personal or unrelated
09:12:15  expanding 23 conversation(s) with a strong match
09:12:31    19 message(s) added from threads, 2 left behind by exclude rules
09:12:31  118 distinct message(s): 84 certain, 19 from their threads, 15 to review

--- dry run: nothing will be copied or removed ---

  [strong] certain — a Flyon address or business contact is on these
    2023-04-11  billing@flyon.io                  Your Flyon subscription   (flyon domain flyon.io)
  ...
  [weak] keyword only — check these before executing
    2023-08-02  shop@etsy.com                     Your invoice   (keyword 'invoice')

review list written to ~/.flyon-email-migration/review.csv
```

Every dry run writes that CSV: one row per message with `keep`, the tier, the
reason it matched, the date, the counterparty and the subject. Certain and
thread rows are pre-filled `keep=yes`, review rows say `review`. Open it in a
spreadsheet, set each `keep` to yes or no, and then move exactly what you
approved:

```bash
python3 migrate_flyon_emails.py --execute --use-review
```

Or, once the rules are tuned and the dry run looks right, skip the CSV:

```bash
# copy everything the rules matched into a "Flyon" folder/label
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
--rules flyon-rules.json          # the include/exclude rules (env: FLYON_RULES)
--term flyon --term flyon.io      # extra keywords on top of the rules file
--report-senders                  # who is this mail with? then exit
--use-review                      # migrate only the rows marked keep=yes
--review-file ./review.csv        # where that CSV lives
--no-thread-expansion             # do not pull in the rest of a matching conversation
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

Thread expansion runs after either mode, so a conversation only needs one
message to surface for the whole thread to come across.

## Notes

- The rules file is matched case-insensitively throughout; addresses and
  domains may be written with or without a leading `@`.
- Read/unread state is preserved. Outlook categories and folder structure are
  not — everything lands in one destination folder, which is what you want when
  the point is to consolidate.
- Gmail treats the destination folder as a label; nested labels use `/`.
- `--after delete` moves originals to Deleted Items rather than purging them, so
  there is a recovery window.
- Nothing about your mailbox leaves your machine: the script talks to Microsoft
  and to your destination server, and to nothing else.
