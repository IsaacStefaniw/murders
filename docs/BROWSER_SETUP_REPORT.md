# Browser session report, 7 September 2026

Against `docs/BROWSER_SETUP_BRIEF.md`. Every value below was read off a
screen in Isaac's Chrome on 7 September 2026; nothing is inferred. Where a
job could not be done it says so and why.

The account that holds everything is **isaac@intentnorth.app** (the third
Google login in Chrome). The Gmail login has only the Steam Saunas
properties. Other sessions using Search Console or GA4 must use the
intentnorth.app login.

```
SEARCH CONSOLE
  properties found:        intentnorth.app — Domain property, added 7 Sep 2026, account isaac@intentnorth.app.
                           No URL-prefix property. (isaac.stefaniw@gmail.com: steamsaunas.com.au domain and URL-prefix only.)
  verification method:     Domain name provider (DNS TXT), "Successfully verified". Durable; nothing depends on the Analytics tag.
  domain property:         already existed
  html-tag token:          NOT AVAILABLE. A Domain property offers only DNS methods; the HTML-tag option and its
                           content="..." value exist only on a URL-prefix property. Adding one was offered and declined
                           this session, so no token was captured. If wanted later: Add property → URL prefix
                           https://intentnorth.app/ → it auto-verifies under the domain property → Settings →
                           Ownership verification → HTML tag → copy the content value without clicking Verify.
  sitemap:                 https://intentnorth.app/sitemap.xml — submitted 7 Sep, last read 7 Sep, Status Success,
                           13 discovered pages, 0 videos (it was already submitted before this session).
  indexing requested:      all eight now requested. Status before each request was identical:
                           "URL is not on Google · Discovered – currently not indexed · found via sitemap · last crawl N/A".
                             /magnesium-for-sleep        requested this session
                             /works-with-what-you-wear   requested this session
                             /does-creatine-work         requested this session
                             /what-is-zone-2             requested this session
                             /cyclic-sighing             requested this session
                             /evidence                   requested this session
                             /sauna-benefits             already showed "Indexing requested" before this session
                             /cold-plunge-benefits       already showed "Indexing requested" before this session
                           No "Excluded" or "Crawled – currently not indexed" on any of them; Google has simply not
                           crawled the site yet. Crawl settings page also says "No robots.txt file" and "Crawl stats:
                           no data" for the same reason; the live robots.txt is correct (checked with curl).
  GA4 link:                confirmed both sides. GA4 Admin → Search Console links shows intentnorth.app (Domain) ↔
                           web stream IntentNorth 15731030818, linked by isaac@intentnorth.app, 7 Sept 2026.
                           Search Console → Settings → Associations shows "Google Analytics".

BING
  imported:                yes. Signed in to Bing Webmaster Tools with Google (isaac@intentnorth.app), granted
                           webmasters.readonly, imported from Search Console: 1 site found, intentnorth.app/ added,
                           role Administrator. The import carried 0 sitemaps, so the sitemap was submitted by hand:
                           https://intentnorth.app/sitemap.xml — submitted 9/7/2026, Status Success, 13 URLs discovered.
                           Dashboard note: "data and reports may take up to 48 hours to reflect".

GA4  (account 407085201, property 553023885, isaac@intentnorth.app)
  data retention:          Event data changed 2 months → 14 months and saved (page re-read shows 14 months; takes
                           effect after 24 h). User data was already 14 months.
  enhanced measurement:    ON — page views, scrolls, outbound clicks "+4 more" on stream 15731030818.
  key events marked:       none — events not present yet. Only page_view, first_visit and session_start have fired.
                           profile_complete and app_store_click are wired in the bundle (/assets/analytics-*.js)
                           but no visitor has triggered them, so they cannot be marked until they appear.
  ios stream:              absent, confirmed. Streams list shows one Web stream only (IntentNorth,
                           https://intentnorth.app, 15731030818, G-DZL9DH7HH9). Nothing added.
  google signals:          no prompt appeared; nothing changed.
  realtime users:          1 active user, 2 page_view, 1 first_visit, 1 session_start within a minute of loading
                           https://intentnorth.app/?utm_source=setup_check from this Chrome. The tag fires and
                           Cloudflare is serving the tagged bundle. (The load was mine from Isaac's machine, not
                           Isaac's own.) The stream page still says "No data received in past 48 hours"; that
                           banner lags Realtime and should clear on its own.

META
  instagram handle:        not done — creating an Instagram account is account creation, which this session will not do.
  facebook page:           not done — same reason (a Page, a Business Portfolio and a developer app all require it).
  PIXEL ID:                none exists. Events Manager needs a Business Portfolio first.
  app + permissions:       not done.
  token expiry:            n/a.
  What unblocks it:        Isaac creates the Instagram Business account, the Page and the Business Portfolio
                           himself. After that, creating the pixel "IntentNorth Web" and copying its ID, and creating
                           the developer app and requesting the three Instagram permissions, can be driven from the
                           browser on request.

ANYTHING THAT LOOKED WRONG
  - The brief's job 2.3 assumes a URL-prefix property. On a Domain property the HTML-tag method does not exist.
  - The brief said Search Console type and method were unknown; both are the good outcome (Domain, DNS).
  - Two of the seven pages already carried indexing requests before this session started, so somebody had
    begun 2.5 by hand; the daily quota covered the remaining six without hitting the limit.
  - Search Console's URL-inspection box drops the query if Return is pressed the instant typing finishes;
    each inspection needed a one-second pause. Worth knowing for the next session.
  - The GA4 tag is injected from the JavaScript bundle, not the HTML, so a curl of the page shows no
    G-DZL9DH7HH9; that is expected and not a fault.
```

Not touched: DNS, billing, users, permissions, anything public. No campaign,
no payment method, no promotional credit. The Keyword Planner draft plan
from the earlier research session in the Steam Saunas Google Ads account is
the only other artefact this Chrome session has created today.
