# Product brief

## WHY: local discovery breaks before checkout

A person deciding whether to attend live music does more than search for an event. They compare dates, venues, artists, price, travel effort, and—at outdoor venues—weather. Large ticket platforms optimize inventory and transactions across broad geographies. Venue calendars are authoritative but fragmented. Music services help evaluate artists but not local logistics. The user performs the join manually.

**Inference:** Wilmington's bounded venue ecosystem creates an opportunity for a locally coherent browse-and-evaluate experience. The value is not merely more listings; it is fewer context switches before a confident shortlist.

## Target user and context

- **Primary:** Wilmington-area resident open to attending live music but not tracking every venue.
- **Secondary:** visitor planning a date-specific activity; friend coordinating a group outing; fan deciding whether an unfamiliar opener/show is worth exploring.
- **Negative:** ticket broker, touring professional, user expecting guaranteed inventory, or user outside the configured geography.
- **Context:** spontaneous evening discovery, weekend planning, budget-sensitive comparison, or weather-sensitive outdoor event.

These users are hypotheses; no interviews, analytics, or market sizing are present.

## Current alternatives

| Alternative | Strength | Opportunity left open |
|---|---|---|
| Ticketmaster/SeatGeek | Transaction inventory and checkout | Split catalogs; broad rather than locally curated |
| Venue websites/social pages | Direct local source | One venue at a time; inconsistent structure |
| Spotify | Artist evaluation | No local event decision context |
| Search/social recommendations | Serendipity | Incomplete, difficult to compare |
| Weather app | Reliable weather context | User must know venue type/date/location |
| Do nothing | No planning cost | Missed events and local discovery |

## Opportunity

Support a decision funnel:

1. **Discover** upcoming local events across sources.
2. **Narrow** by artist/venue/date/relative price.
3. **Evaluate** artist familiarity, venue, weather, and price context.
4. **Act** through an external ticket link.

The prototype implements this basic funnel in the home, card, and event detail components. It does not implement accounts, favorites, alerts, group planning, or ticket checkout.

## Product thesis

If Wilmington concertgoers can browse a sufficiently complete local inventory and evaluate price, artist fit, and outdoor-weather risk without leaving the event context, they will form a shortlist faster and discover more relevant shows. “Sufficiently complete” and “faster” require measurement.

## WHAT: demonstrated scope

- Next.js browse and event-detail experience.
- Search plus venue, date, and relative price-category filtering.
- Ticketmaster/SeatGeek aggregation with source preference during deduplication.
- Spotify artist images, genres, top tracks, and optional preview URLs.
- Outdoor venue weather within a near-term forecast window.
- SQLite/Prisma cache and refresh endpoint.
- External ticket links rather than native transaction.

Relevant evidence: [`src/app/api/events/route.ts`](../../src/app/api/events/route.ts), [`src/lib/services/aggregator.ts`](../../src/lib/services/aggregator.ts), and [`prisma/schema.prisma`](../../prisma/schema.prisma).

## Scope and non-goals

### In scope

- Upcoming events represented in the local database.
- Wilmington-area venue and artist discovery.
- Relative price context within the currently aggregated set.
- Weather context only for venues marked outdoor and events with forecasts.

### Non-goals

- Exhaustive venue coverage or authoritative event truth.
- Ticket inventory, fees, seat maps, resale, fulfillment, or refunds.
- Absolute affordability advice.
- Weather guarantees or event cancellation status.
- Personalized recommendation, social network, or native purchasing.

## Product principles

1. **Coverage confidence before visual abundance.** A polished grid is not useful if users cannot tell what is missing.
2. **Unknown is not cheap.** Missing prices must not appear as the lowest category.
3. **Decision evidence stays together.** Artist, logistics, price, weather, and source should be adjacent.
4. **Relative labels need a reference set.** Explain what “below average” compares against.
5. **Outbound action must preserve trust.** Show source and last update before sending users to tickets.
6. **Local focus earns specificity.** Prefer reliable Wilmington depth over unsupported geographic breadth.

## Evidence gaps

No repository evidence establishes source coverage, refresh scheduling in deployment, listing accuracy, deduplication precision, price freshness/fees, weather accuracy, outdoor-venue completeness, accessibility testing, analytics, user outcomes, or automated tests. Seed data in [`prisma/seed.ts`](../../prisma/seed.ts) is demonstrative and must not be presented as live inventory.
