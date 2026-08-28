# Value proposition

## Canvas

### Jobs

- Find local live music.
- Judge fit across schedule, taste, venue, cost, and weather.
- Coordinate an outing.
- Reach the source to transact.

### Pains

- Listings are fragmented and duplicated.
- Unknown artists create taste risk.
- Ticket amounts, availability, and fees change.
- Relative price labels can be opaque.
- Outdoor-weather context lives elsewhere.
- Empty results can mean no events, strict filters, or stale coverage.

### Gains

- One locally bounded browse surface.
- Faster event shortlisting.
- Artist context without a separate search.
- Weather shown only when relevant.
- Source-aware path to purchase.
- Confidence about inventory freshness and limitations.

### Relievers and creators

| Mechanism | Intended benefit | Evidence/status |
|---|---|---|
| Ticketmaster + SeatGeek aggregation | Broader inventory than one source | Implemented; coverage unmeasured |
| Normalized artist/date/venue deduplication | Reduce duplicate cards | Implemented; precision untested |
| Filters | Reduce browse effort | Implemented |
| Spotify enrichment | Lower taste uncertainty | Implemented when data is returned |
| Relative price categories | Provide scanning shorthand | Implemented; reference and missing-price behavior need work |
| Outdoor weather | Reduce planning context switches | Implemented for marked venues in forecast window |
| Ticket link + source | Preserve transaction authority | Implemented |

## Alternatives and differentiation

The product is not a better ticket exchange or music catalog. Its differentiation is the local **join** across event discovery, artist evaluation, relative price, venue context, and weather. A ticket marketplace is stronger at inventory and checkout; Spotify is stronger at music exploration; venue pages are stronger as direct sources. Concerts Near Me creates value only if its combined local view is sufficiently accurate and faster than that bundle of alternatives.

## Positioning statement

For Wilmington-area people deciding what live music is worth attending, Concerts Near Me is a local event discovery prototype that combines multi-source listings with artist previews, relative price context, venue details, and outdoor-weather cues. Unlike checking marketplaces, venue calendars, music apps, and forecasts separately, it keeps the evidence for shortlisting a show in one flow and then routes purchase to the source.

## Benefit ladder

| Capability | Functional benefit | Emotional/social benefit | Higher value |
|---|---|---|---|
| Local aggregation | See more options together | Feel informed | Participate in local scene |
| Search/filters | Reach feasible options | Less overwhelm | Faster planning |
| Artist previews | Evaluate unfamiliar act | More adventurous confidence | Discovery |
| Price context | Compare relative cost | Less budget anxiety | Better shortlist |
| Weather context | Prepare for outdoor show | Less surprise | More reliable outing |
| Source link | Continue to transaction | Trust boundary stays clear | Action |

## Proof discipline

**Repository proof:** pages, API query behavior, source integrations, deduplication logic, data schema, price categorization, event detail, weather association, and seed fixtures.

**Not proof:** live catalog completeness, correct matches, current prices, fee inclusion, ticket availability, artist match accuracy, weather/event status, conversion, attendance, or demand. Notably, [`src/lib/services/price-calculator.ts`](../../src/lib/services/price-calculator.ts) currently maps missing prices to `green`; documentation and future UI must not translate that implementation detail into “budget” proof.
