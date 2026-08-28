# Concerts Near Me product portfolio

## Thesis

The Wilmington live-music decision is fragmented across ticket marketplaces, venue calendars, artist pages, weather forecasts, and social recommendations. Concerts Near Me explores a local decision surface that helps someone move from “what is happening?” to “is this show worth my time and budget?” It aggregates Ticketmaster and SeatGeek events, enriches artists through Spotify, calculates relative price bands, and adds weather context for marked outdoor venues. The repository demonstrates this flow; it does not establish comprehensive coverage, price accuracy, ticket availability, user adoption, or conversion.

## Artifact map

| Artifact | Purpose |
|---|---|
| [Product brief](product-brief.md) | Why local concert choice is costly and what the prototype addresses |
| [Users and JTBD](users-and-jtbd.md) | Discovery contexts, functional/emotional/social jobs, and journey |
| [Value proposition](value-proposition.md) | Canvas, alternatives, differentiation, positioning, and proof |
| [Pain points and opportunity costs](pain-points-and-opportunity-costs.md) | Friction inventory, proxy formulas, risks, and prioritization |
| [Wireframes](wireframes.md) | Browse, evaluate, weather, no-price, empty, loading, and error states |
| [Roadmap and success metrics](roadmap-and-success-metrics.md) | Hypotheses, phases, metrics, instrumentation, and experiments |

## Evidence/status legend

- **Evidence:** directly observable in source, schema, configuration, or design docs.
- **Inference:** product interpretation grounded in evidence but not validated with users.
- **Assumption:** belief requiring research or measurement.
- **Hypothesis:** proposed, falsifiable change or outcome.

## Repository evidence snapshot

- **Evidence:** the home page supports artist/venue search and venue, date, and price-band filters in [`src/app/page.tsx`](../../src/app/page.tsx) and [`src/components/FilterBar.tsx`](../../src/components/FilterBar.tsx).
- **Evidence:** event cards combine artist imagery, venue/date, price band, ticket link, and outdoor-weather badges in [`src/components/ConcertCard.tsx`](../../src/components/ConcertCard.tsx).
- **Evidence:** event detail includes venue, weather, tickets, and top-song previews in [`src/app/event/[id]/page.tsx`](../../src/app/event/[id]/page.tsx).
- **Evidence:** aggregation uses Ticketmaster and SeatGeek, deduplicates by normalized artist/date/venue, enriches artists, and adds near-term outdoor weather in [`src/lib/services/aggregator.ts`](../../src/lib/services/aggregator.ts).
- **Evidence:** Prisma models events, venues, artists, songs, and weather in [`prisma/schema.prisma`](../../prisma/schema.prisma).
- **Assumption:** combining these signals reduces meaningful discovery effort for Wilmington-area concertgoers.
