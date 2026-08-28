# Users and jobs to be done

## Personas

### Primary: locally curious concertgoer

Likes live music but follows venues inconsistently. Wants a fast scan of credible options rather than starting with a specific artist.

### Secondary: budget-aware planner

Balances ticket price with date, venue, and group cost. Needs actual price availability and reference context—not just a color.

### Secondary: weather-sensitive outdoor attendee

Needs enough forecast context to prepare, delay purchase, or check the organizer. Weather does not replace cancellation information.

### Secondary: group coordinator

Needs a compact event case—artist, date, venue, price, weather, link—to propose to others.

### Negative personas

- Buyer requiring live seat-level inventory and total fees.
- User outside the Wilmington market.
- Promoter expecting listing-management tools.
- Person treating forecast status as event-operating status.

## Contexts

| Situation | Constraint | Product implication |
|---|---|---|
| “Anything good this weekend?” | Open-ended intent | Browse by date before requiring search |
| Date/group night | Multiple preferences | Comparable cards and shareable evidence |
| Unfamiliar artist | Taste uncertainty | Genres and short previews on detail |
| Outdoor show soon | Forecast uncertainty | Time-stamped warning plus organizer check |
| Tight budget | Fees/unknown prices | Explicit unknown and source caveat |

## Jobs

### Functional

- Discover upcoming shows across local sources.
- Filter to a feasible date, venue, and budget band.
- Evaluate an unfamiliar artist quickly.
- Understand outdoor weather context.
- Reach the authoritative ticket source.

### Emotional

- Feel “in the know” without constant venue monitoring.
- Reduce regret about missed shows.
- Avoid buyer's remorse from price or weather surprises.
- Feel confident proposing an event to others.

### Social

- Share a credible outing option.
- Coordinate a group around common constraints.
- Participate in the local music scene.

## JTBD statements

1. **When** I have an open evening or weekend, **I want** to see upcoming Wilmington shows in one place, **so I can** discover options without checking every venue.
2. **When** I find an unfamiliar artist, **I want** a quick taste and genre context beside the event, **so I can** decide whether to investigate further.
3. **When** tickets vary widely, **I want** actual price information and its local reference set, **so I can** shortlist without mistaking relative color for total cost.
4. **When** a show is outdoors, **I want** timely weather context and a link to the organizer, **so I can** prepare and verify status.
5. **When** I coordinate with friends, **I want** a compact event summary, **so I can** get to a group decision with fewer messages.
6. **When** no event matches, **I want** to know whether filters, coverage, or refresh failed, **so I can** correct the right problem.

## User stories and acceptance signals

| Story | Acceptance signal |
|---|---|
| Browse upcoming events | API filters `date >= now` and orders ascending |
| Search across artist, venue, title | Implemented in [`src/app/api/events/route.ts`](../../src/app/api/events/route.ts) |
| Filter by venue/date/price category | Implemented in `FilterBar` and query parameters |
| Evaluate event detail | Page shows venue, price, weather when available, and top songs |
| Buy externally | Ticket link opens a new context and identifies event source |
| Recover from no matches | Home page shows “No shows found,” but does not distinguish coverage/failure |

## Forces of progress

| Push | Pull | Anxiety | Habit |
|---|---|---|---|
| Fragmented local calendars | One local grid | “What listings are missing?” | Follow favorite venues |
| Missed show discovery | Artist enrichment | “Are previews representative?” | Search known artists only |
| Price uncertainty | Relative bands + amounts | “Does this include fees?” | Open every marketplace |
| Outdoor uncertainty | Event-specific weather | “Is the event canceled?” | Check weather separately |

## Journey

1. **Trigger:** free date, artist mention, or desire for an outing.
2. **Orient:** browse event count and coverage/freshness.
3. **Narrow:** search/filter date, venue, price.
4. **Evaluate:** inspect artist, venue, weather, price, and source.
5. **Coordinate:** share or compare.
6. **Act:** open ticket source.
7. **Outcome:** attend, defer, or abandon; assess whether listing matched reality.

Acceptance signals include time to shortlist, filter success, event-detail depth, preview engagement, outbound click with known price, source coverage comprehension, and post-event listing accuracy. None are currently observed.
