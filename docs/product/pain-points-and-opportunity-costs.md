# Pain points and opportunity costs

Frequency and severity are hypotheses for discovery. No observed usage or commercial data is available.

## Pain inventory

| Pain | Frequency hypothesis | Potential severity | Consequence chain | Evidence/gap |
|---|---|---:|---|---|
| Checking multiple listings | Every open-ended browse | Medium | context switching → fatigue → default to known venues | Aggregation addresses; baseline unmeasured |
| Duplicate/inconsistent events | Common across aggregators | Medium | repeated cards or wrong merge → trust loss | Dedup key implemented, untested |
| Missing local venues/events | Ongoing | High | false “nothing happening” → missed show | No coverage report or venue scraping implementation evident |
| Missing price shown as low band | Every unknown-price event | High | green cue → affordability assumption → checkout surprise | Current calculator maps null to green |
| Fees/inventory change after cache | Every outbound transaction | High | stale amount → buyer frustration/abandonment | No freshness shown in UI |
| Wrong artist enrichment | Name ambiguity cases | Medium | unrelated image/tracks → poor decision/trust | Artist lookup exists; match confidence not modeled |
| Weather mistaken for event status | Outdoor events | High | forecast warning/clear cue → assumption about cancellation | UI provides forecast, not organizer status |
| Empty/error ambiguity | Filtered or failed request | Medium | “no shows” → user leaves without recovery | Home catches fetch errors only in console |

## Opportunity-cost formulas

- **Discovery effort:**
  `sources opened × median source-switch seconds + browse minutes`
- **Shortlist time:**
  `first shortlist timestamp − session start`
- **Missed-event proxy:**
  `relevant events learned about after event / relevant events later recognized`
- **Price surprise:**
  `checkout total − displayed minimum` and `outbound clicks with unknown/stale price / outbound clicks`
- **Coverage:**
  `verified in-scope events represented / verified in-scope events`
- **Deduplication precision/recall:**
  `correct merges / all merges`; `duplicate pairs merged / known duplicate pairs`
- **Weather context value:**
  `outdoor-event evaluations completed without separate forecast lookup`
- **Net user value:**
  `baseline discovery minutes − product discovery minutes − time spent verifying missing context`

No values or thresholds are asserted.

## Risks of inaction

- Visual polish may amplify trust in incomplete or stale inventory.
- “Budget” labels may mislead where price is unknown.
- Source outages can quietly shrink the catalog because aggregation uses fulfilled results from whichever providers succeed.
- Artist enrichment errors can make discovery feel careless.
- The project may remain a demo of integrations rather than a validated local product.
- Outdoor forecast cues may be confused with organizer updates.

## Prioritization

| Priority | Why now | Evidence needed |
|---|---|---|
| P0: distinguish unknown price | Directly prevents misleading value cue | UI comprehension and calculator tests |
| P0: expose source/freshness/coverage | Trust depends on inventory boundary | Source health, last refresh, verified venue sample |
| P0: separate weather from event status | Prevents risky inference | Copy comprehension; organizer-link usage |
| P1: test dedup and artist matching | Core aggregation quality | Curated match/duplicate fixtures |
| P1: actionable error/empty states | Preserves recovery | Simulated source/API/filter failures |
| P1: instrument shortlist funnel | Establish user value | Time to shortlist and verification behavior |
| P2: add direct local sources | Improve completeness after measurement | Per-venue incremental coverage and maintenance cost |
| P2: sharing/favorites | Supports repeat/group jobs | Discovery research on frequency |

Trust correction precedes more integrations.
