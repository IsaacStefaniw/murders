# Brief: the browser session

Written 2026-09-07 for a Claude session with access to Isaac's browser, and
therefore to accounts he is already signed in to. Everything here needs a
logged-in human session and cannot be done from a sandboxed session with no
network egress, which is why it is a separate brief.

Work top to bottom. Stop and report at the end of each part rather than
saving it all for the end — several of the values you collect unblock work
in other sessions immediately.

---

## 0. The rules, because you are inside live accounts

You are operating in Isaac's real Google, Meta and registrar accounts. Read
these before touching anything.

**Never, under any circumstances:**
- Spend money. Do not create, enable or publish an ad campaign, do not add a
  payment method, do not accept a promotional credit that requires a card.
- Delete a property, tag, stream, Page or account.
- Change billing, ownership, or user permissions.
- Publish anything publicly — no posts, no Page announcements.

**Ask Isaac before:** anything irreversible, anything that changes a public
URL or handle, and anything that would send email to people.

**Never invent a value.** If a screen does not show what this brief expects,
report what you actually saw. A made-up pixel ID or verification token is
worse than a missing one, because someone downstream will paste it in and it
will fail silently weeks later. Screenshots beat descriptions.

**Two-factor.** Several steps may prompt for a code on Isaac's phone. Stop
and ask him rather than trying alternatives.

---

## 1. What already exists

Do not redo any of this.

| Thing | State |
|---|---|
| Website | `https://intentnorth.app`, live on Cloudflare Workers. 13 routes. |
| `robots.txt` | Live, permissive, points at the sitemap. |
| `sitemap.xml` | Live, lists all 13 routes. |
| GA4 | Property created, **web stream only**, `G-DZL9DH7HH9`. Live on the site since 07 Sep 04:39 and confirmed firing `page_view`. |
| Search Console | Isaac created a property today. **Which type and which verification method is unknown — that is job 2.1.** |
| Meta | Nothing exists yet. |
| App Store | Build 16 in review. **No public App Store URL yet**, so nothing may link to one. |

Seven of the thirteen pages went live within the hour before this brief was
written: `/works-with-what-you-wear`, `/magnesium-for-sleep`,
`/sauna-benefits`, `/cold-plunge-benefits`, `/what-is-zone-2`,
`/does-creatine-work`, `/cyclic-sighing`.

---

## 2. Google Search Console

### 2.1 Establish what Isaac actually created

Open <https://search.google.com/search-console> and report, before changing
anything:

- Every property listed, and for each whether it is a **Domain** property
  (shows as `intentnorth.app`) or a **URL-prefix** property (shows as
  `https://intentnorth.app/`).
- Under Settings → Ownership verification, **which method is green**.

This matters more than it looks. There is no `google*.html` file in the
repository and no `google-site-verification` meta tag in the site's code, and
on this site nothing can be uploaded except through the repository. So the
verification is either a DNS TXT record (durable) or the Google Analytics tag
(depends on that tag staying on the site). Knowing which one decides whether
anything needs hardening.

### 2.2 Add the Domain property if it is missing

If only a URL-prefix property exists, add a **Domain** property for
`intentnorth.app`. It covers every subdomain and both protocols in one
report, which a URL-prefix property does not.

That requires a DNS TXT record at the registrar. Google shows the exact
record; add it in the registrar's DNS panel, then click Verify. If DNS is on
Cloudflare, the record goes in Cloudflare's DNS tab and must be **DNS only**,
not proxied. Verification can take a few minutes to propagate — wait and
retry rather than assuming failure.

Do not delete the URL-prefix property afterwards. It costs nothing to keep
and its history is not transferable.

### 2.3 Capture the HTML-tag token

In Settings → Ownership verification → **HTML tag**, expand it and copy the
`content="..."` value, **without verifying by that method**.

Bring that token back. It gets added to the site's `layout.tsx` as a second,
independent verification method with a guardrail so a deploy cannot lose it.
This is the one durable fix available if 2.1 shows verification currently
rests on the Analytics tag.

### 2.4 Submit the sitemap

Sitemaps → add `sitemap.xml` → Submit. Report the status and the "discovered
URLs" count. Expect 13. Anything less means the sitemap is being read wrong
and should be reported immediately.

### 2.5 Request indexing on the seven new pages

URL Inspection, one at a time, "Request indexing" for each:

```
https://intentnorth.app/works-with-what-you-wear
https://intentnorth.app/magnesium-for-sleep
https://intentnorth.app/does-creatine-work
https://intentnorth.app/what-is-zone-2
https://intentnorth.app/cyclic-sighing
https://intentnorth.app/sauna-benefits
https://intentnorth.app/cold-plunge-benefits
```

Also request `https://intentnorth.app/evidence`, whose content changed
substantially today.

There is a daily quota of roughly ten to twelve manual requests. If you hit
it, do the rest tomorrow and say which are outstanding.

For each URL, report what the inspection says **before** you request:
"URL is not on Google" is expected today. If any says "Excluded" or
"Crawled – currently not indexed", quote the exact reason — that is a real
finding and worth more than the indexing request itself.

### 2.6 Link Search Console to GA4

Search Console → Settings → Associations, or GA4 → Admin → Product links →
Search Console. Link the Domain property to the `G-DZL9DH7HH9` property.
Confirm it shows as linked from both sides; this link fails silently often
enough to be worth checking twice.

---

## 3. Bing Webmaster Tools

Ten minutes, and worth more than its market share suggests: Bing's index is
what Copilot and ChatGPT search read.

<https://www.bing.com/webmasters> → Import from Google Search Console. That
carries the verification and the sitemap across without a second DNS record.
Confirm the site appears and the sitemap is recognised.

---

## 4. GA4 settings

The property exists and is collecting. Four settings still need changing, and
one prompt needs declining.

1. **Admin → Data Settings → Data Retention → 14 months.** It defaults to 2.
   This is the setting people discover a year too late, when the data they
   want is already gone.
2. **Admin → Data Streams → the web stream → confirm Enhanced Measurement is
   on.** It gives outbound clicks and scroll depth for free.
3. **Key events.** Once the events have appeared (Admin → Events; they need
   real traffic first), mark `profile_complete` and `app_store_click` as key
   events. If they are not listed yet, say so — that is expected on day one
   and is not a fault.
4. **Confirm the property has no iOS stream, and do not add one.** This is
   deliberate and important: GA4 for iOS is Firebase, so an app stream means
   the Firebase SDK in the binary, which would falsify "there is no analytics
   SDK in the app" on `/privacy`, move the App Store privacy label off
   "Device ID, not linked to you", and lose the comparison
   `/whoop-alternative` is built on — with build 16 in review, which is the
   worst possible week to change a privacy label.

**Decline Google Signals** if prompted. It adds demographics and cross-device
at the cost of data thresholding, which hides rows with small user counts —
at launch traffic that means half the reports come back empty. It also
widens the consent obligations. Revisit when volume justifies it.

While in there, note the Realtime report: if it shows zero users after Isaac
loads the site himself, say so. That means Cloudflare is serving a cached
bundle and the website session needs to know.

---

## 5. Meta

This is §1 of `docs/SOCIAL_BRIEF.md`, which the social session cannot start
without. Read that document's §0 before doing any of it.

1. **Instagram account** `@intentnorth` (or the nearest available handle —
   report what you actually got). Convert to a **Business** account under
   Settings → Account type. Creator will not do; Business is what the
   publishing API requires.
2. **Facebook Page** named IntentNorth, category Health & Wellness, linked to
   that Instagram account.
3. **Meta Business Suite**: both assets inside one Business Portfolio.
4. **Events Manager → create a pixel** named IntentNorth Web. **Copy the
   pixel ID and bring it back.** It is the single highest-value thing in this
   brief: `web/app/analytics.tsx` is already wired for it, and until it
   exists no retargeting audience is being built and any future ad spend is
   unmeasurable.
5. **Meta for Developers**: create an app, request `instagram_basic`,
   `instagram_content_publish` and `instagram_manage_insights`, and generate a
   long-lived token. **Record the token's expiry date** — a channel that
   stops posting because a 60-day token lapsed is the most common failure in
   this whole setup.

Do not write a bio, post anything, or upload a profile picture. The social
session drafts those and Isaac approves them.

**Handle availability is a real risk.** If `@intentnorth` is taken, do not
improvise a variant — report it and let Isaac choose. The handle appears on
the website, in the App Store listing and in every future post.

---

## 6. What to bring back

Report in this shape, and mark anything you could not do rather than omitting
it:

```
SEARCH CONSOLE
  properties found:        (type, and verification method for each)
  domain property:         added / already existed / blocked because…
  html-tag token:          content="..."
  sitemap:                 status, discovered URL count
  indexing requested:      which URLs, and what each said beforehand
  GA4 link:                confirmed both sides / not

BING
  imported:                yes / no, and what it shows

GA4
  data retention:          set to 14 months / blocked
  key events marked:       which, or "events not present yet"
  ios stream:              absent, confirmed
  realtime users:          count seen when Isaac loaded the site

META
  instagram handle:        @… (Business account confirmed)
  facebook page:           name + URL
  PIXEL ID:                …
  app + permissions:       which were granted, which pending review
  token expiry:            date

ANYTHING THAT LOOKED WRONG
```

The two values other sessions are waiting on are the **Meta pixel ID** and the
**Search Console HTML-tag token**. If you get nothing else done, get those.

---

## 7. One thing not to conclude

Search Console will be close to empty, and that is correct. The property was
created today and seven of the thirteen pages went live within the hour. An
empty Performance report means "not indexed yet", not "ranking badly".

Do not report positions, impressions or competitor comparisons from this
session. If a number is not on a screen you actually loaded, it does not go
in the report.
