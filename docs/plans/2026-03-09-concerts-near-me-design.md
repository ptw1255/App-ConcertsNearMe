# Concerts Near Wilmington, NC — Design Document

## Overview

A Next.js web app that aggregates concerts in the Wilmington, NC area into a single dark-themed, visually rich experience. Users can browse upcoming shows, see artist cover photos, check ticket prices with color-coded affordability indicators, get smart weather alerts for outdoor events, and preview an artist's top songs with 30-second Spotify clips.

## Tech Stack

- **Framework:** Next.js (React, SSR, API routes)
- **Database:** SQLite + Prisma (cached concert data)
- **Styling:** Tailwind CSS (dark concert theme)
- **Scraping:** Cheerio (static), Playwright (JS-rendered)

## External Integrations

| Service | Purpose | Auth | Free Tier |
|---------|---------|------|-----------|
| Ticketmaster Discovery API | Primary concert data | API key | 5,000 calls/day |
| SeatGeek API | Supplementary concert data | API key | Free with key |
| Spotify Web API | Artist images + top songs + preview URLs | Client credentials | Unlimited (rate limited) |
| OpenWeatherMap API | Weather forecasts for outdoor venues | API key | 1,000 calls/day |
| Local venue scraping | Venues not on major platforms | N/A | N/A |

## Pages

### Home (`/`)
- Hero banner: "Concerts Near Wilmington, NC" + upcoming show count
- Filterable/sortable grid of concert cards
- Filters: date range, venue, price range

### Event Detail (`/event/[id]`)
- Large artist cover photo
- Venue details + map
- Weather outlook (outdoor venues only)
- Ticket pricing with color-coded bar + booking link
- Top songs section with 30-second previews

## Concert Card Design

- Artist cover photo as background
- Artist name, venue name, date/time overlaid
- Color-coded price bar: green (bottom 33%), yellow (middle 33%), red (top 33%)
- Outdoor weather warning badge (only when rain/severe weather expected)
- "Buy Tickets" button linking to booking page

## Top Songs Section

- Artist photo + name header
- Top 3-5 tracks: album art thumbnail, song name, play/pause for 30-sec preview, "Open in Spotify" link
- Mini audio player bar at bottom when preview is playing

## Smart Weather Alerts

- Outdoor venues: weather icon + temp shown by default
- Rain expected: yellow warning banner
- Severe weather: red warning banner
- Indoor venues: no weather info shown

## Data Model

### Event
id, title, artistName, venueName, venueId, date, time, isOutdoor, ticketUrl, priceMin, priceMax, priceCategory (green/yellow/red), source (ticketmaster/seatgeek/scraped), sourceId, createdAt, updatedAt

### Venue
id, name, address, lat, lng, isOutdoor, website, scrapable

### Artist
id, name, spotifyId, imageUrl, genres

### TopSong
id, artistId, trackName, albumName, albumArtUrl, previewUrl, spotifyUrl, rank

### WeatherForecast
id, eventId, date, tempHigh, tempLow, icon, description, precipChance, windSpeed, severity (none/warning/severe), fetchedAt

## Price Categorization

- Aggregate all current event prices, calculate percentiles
- Green: bottom 33% | Yellow: middle 33% | Red: top 33%
- Recalculated on each data refresh

## Data Refresh Schedule

- Concert data: every 6 hours
- Weather forecasts: daily (only available ~7-10 days out)
- Spotify artist/songs: once per artist, refresh monthly

## Scraping Targets

- Greenfield Lake Amphitheater
- Brooklyn Arts Center
- Bourgie Nights
- Dead Crow Comedy Room
- Reggies 42nd Street Tavern

Each venue gets its own scraper module for independent maintenance.

## Deduplication Strategy

Match events across sources by normalizing artist name + event date + venue name. Prefer Ticketmaster data when duplicates found (better ticket links/pricing).

## Required API Keys

- Ticketmaster Discovery API key
- SeatGeek API key
- Spotify Client ID + Secret
- OpenWeatherMap API key
