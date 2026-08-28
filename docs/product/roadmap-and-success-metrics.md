# Roadmap and success metrics

## Outcome framing

Success is a faster, better-informed local concert shortlist—not page views alone and not ticket sales the repository cannot observe end to end.

## Now: establish catalog trust

- Change the product treatment of missing prices from green/budget to unknown.
- Display last refresh, contributing sources, and partial-source failures.
- Explain the price band's reference set and exclude unknown prices from affordability claims.
- Add curated tests for price categories, deduplication, artist matching, API filters, and error states.
- Validate outdoor-venue flags and separate forecast from event status.
- Replace generic root landing copy only when setup/deployment instructions are verified.
- Audit keyboard, screen-reader, contrast, focus, and audio-preview behavior.

## Next: prove discovery value

- Instrument browse → filter → detail → ticket-source funnel.
- Run Wilmington-area discovery sessions comparing current habits to the prototype.
- Build a coverage benchmark against a maintained sample of venue calendars.
- Add explicit organizer/venue links where available.
- Prototype a shareable event summary and optional shortlist.
- Add data-quality flags for artist-match confidence, stale price, duplicate uncertainty, and weather age.

## Later: deepen local usefulness

- Add direct venue sources only when incremental coverage outweighs scraper maintenance.
- Offer saved venues/artists or notifications after repeat-use evidence.
- Add group comparison or voting if coordination emerges as a frequent job.
- Expand geography through configuration only after Wilmington coverage is dependable.
- Evaluate total-price/fee context only through permitted, reliable sources.

Native checkout, resale, and guaranteed availability remain out of scope.

## Hypotheses

| Hypothesis | Leading signal | Falsifier |
|---|---|---|
| Combined local inventory reduces discovery effort | Lower time and sources opened to shortlist | Users still rely on the same external bundle |
| Artist previews increase unfamiliar-show consideration | Preview use followed by detail/shortlist action | Previews distract or rarely influence choice |
| Transparent coverage increases calibrated trust | Users identify sources/missing areas correctly | Trust falls without improved understanding |
| Event-specific weather reduces context switching | Fewer separate weather lookups | Users still verify every forecast elsewhere |
| Relative price helps scanning | Faster shortlist with correct interpretation | Users mistake band for total affordability |

## Metrics

### Leading

- Source refresh success, duration, and event yield.
- Verified coverage by venue/source.
- Dedup merge precision and residual duplicate rate.
- Artist-match confidence/error rate.
- Time to first relevant detail and shortlist.
- Filter use and zero-result recovery.
- Weather and preview engagement.

### Lagging

- Shortlist completion rate.
- Discovery time versus baseline.
- Relevant events discovered that user had not known.
- Outbound ticket-source click after informed detail review.
- Repeat discovery sessions.
- Post-event report that listing logistics matched reality.

### Guardrails

- Unknown/stale price shown as budget.
- Incorrect merge or artist enrichment.
- Outbound clicks to unavailable/wrong event.
- Users interpreting weather as cancellation status.
- Partial-source catalog presented as complete.
- Accessibility task failures and unwanted audio.

No current baselines or targets are asserted.

## Instrumentation plan

Data pipeline events: `refresh_started`, `source_completed(source, result_class, event_count)`, `dedup_completed(input_count, output_count)`, `artist_match(result_class)`, `weather_refresh(result_class)`, `refresh_published`.

Product events: `browse_loaded(coverage_state, age_bucket)`, `search_used`, `filter_changed(type)`, `empty_state_seen(reason)`, `event_opened`, `preview_started`, `weather_source_opened`, `ticket_source_opened(source, price_state)`, `shortlist_changed` if that feature is built.

Avoid building cross-site identity or collecting sensitive location. Aggregate local-market behavior unless a clear user benefit and consent model justify more.

## Experiment backlog

1. Catalog count only vs count + source/freshness coverage panel.
2. Price color bar vs amount + labeled relative reference.
3. Artist preview on detail vs preview on card.
4. Weather badge vs full forecast warning with organizer link.
5. Browse-all default vs “this weekend” default.
6. Share link vs lightweight shortlist for group planning.

## Risks and dependencies

- Provider APIs, rate limits, terms, schema, and credentials.
- Direct-venue source maintenance.
- Cache scheduling and stale-data detection.
- Artist/entity matching and deduplication quality.
- Price availability, fees, and changing inventory.
- Weather horizon and venue classification.
- Accessibility and external-link continuity.

## Definition of success

Advance the product when Wilmington users can build a relevant shortlist faster than with their current source bundle, understand catalog/price/weather limitations, and encounter low verified rates of missing, duplicate, stale, or mismatched information. Increased outbound clicks count only when users reached them with accurate context.
