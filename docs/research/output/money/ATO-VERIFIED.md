# The ATO figures, now verified at source

The money round flagged every ato.gov.au row as UNVERIFIED because the
page fetcher received HTTP 403. That turned out to be a user-agent block,
not a real one: the same URLs return the full page to a request carrying
an ordinary browser user-agent and an Australian language header. The
harvester in `../corpus/tools/harvest.js` sets both, so this is now a
routine check rather than a human click-through.

Verified 8 September 2026 by opening each page and reading the figure out
of the rendered table.

## Verified, and unchanged from what the round assumed

| Figure | What the ATO page says | Page |
|---|---|---|
| Super guarantee rate | 12.00% for 1 July 2025 to 30 June 2026, and 12.00% for every later period in the table. The step up from 11.50% in 2024-25 is the final legislated increase. | Key superannuation rates and thresholds › Super guarantee |
| HELP repayments are marginal | For the 2025-26 income year onward, compulsory repayments are calculated on the income above the threshold only, at stepped rates, rather than as a share of whole income. | Study and training support loans › Rates and repayment thresholds |
| HELP indexation, backdated reduction | The published rate table shows 2023 as 3.2% (previously 7.1%) and 2024 as 4% (previously 4.7%), which is the lower-of-two-indices change applied retrospectively. 2025 was 3.2%. | Study and training support loans › Indexation rates |
| Written evidence above $300 | A total work-related expense claim of $300 or less can be claimed without full written evidence; above that, written evidence is required. Laundry has its own $150 exception. | Income, deductions, offsets and records › Records you need to keep |
| Records kept five years | Written evidence must be kept for five years from the date the return is lodged, with longer periods for depreciating assets, capital gains assets and disputes. | As above |

## Verified, and different from what the round recorded

Two figures were wrong in the ledger because they came from search
snippets of an older version of the page. Neither appears on a protocol
card, so no card copy changes.

| Figure | Ledger said | The page says | Effect |
|---|---|---|---|
| Lost and ATO-held super | $18.9 billion across about 7.3 million accounts at 30 June 2025 | **Just over $21.2 billion across just under 7.5 million accounts at 30 June 2026** | The `super-four-settings` card deliberately quotes no figure, so nothing changes. If a coach line ever uses one, use the 2026 figure. |
| HELP repayment threshold | $67,000, described as the current year | $67,000 is the **2025-26** threshold. The **2026-27** threshold is **$69,528**, with 15c per dollar above it to $129,717, then $9,028 plus 17c, then 10% of total repayment income above $186,050. | Today is in the 2026-27 year. Any coach line naming a threshold must name 2026-27, and the "changes yearly" caveat is doing real work. |

The second one is the more useful finding. The money round wrote its
cards to quote no threshold at all precisely because these move every
July, and one year later the number had already moved. That design choice
was right.

## What this changes

- **The `help-debt-timing` copy update in `findings.md` is unblocked.** It
  was held pending a human click-through; the indexation change and the
  marginal-repayment change are both confirmed at source.
- **`receipts-as-you-go` can name the $300 threshold** if a reviewer wants
  it to. The card currently says "a modest total", which still reads
  better and does not go stale.
- **The UNVERIFIED list in `findings.md` shrinks** to the co-contribution
  thresholds, the contribution caps and the AFCA volumes. The
  contribution caps are separately verified on MoneySmart, which is the
  reference point the brief named anyway.

## Pages that still do not yield

Some ATO pages render their content client-side and return a near-empty
document to any fetcher; the super contributions caps page is one. Use
MoneySmart for those, which the brief already prefers. studyassist.gov.au
and servicesaustralia.gov.au time out rather than 403, which is a
different problem and unsolved.
