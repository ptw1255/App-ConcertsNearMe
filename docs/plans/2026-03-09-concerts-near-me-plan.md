# Concerts Near Me — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a Next.js web app that aggregates concerts in Wilmington, NC from multiple sources with artist photos, ticket pricing, weather alerts, and Spotify song previews.

**Architecture:** Next.js app with API routes for data aggregation, SQLite + Prisma for caching, Tailwind CSS for dark concert-themed UI. Scheduled data refresh pulls from Ticketmaster, SeatGeek, venue scrapers, Spotify, and OpenWeatherMap, stores in local DB, serves to SSR frontend.

**Tech Stack:** Next.js 15, React 19, TypeScript, Prisma + SQLite, Tailwind CSS 4, Cheerio, Playwright (scraping), Jest + React Testing Library

---

## Task 1: Project Scaffolding

**Files:**
- Create: `package.json`, `tsconfig.json`, `tailwind.config.ts`, `next.config.ts`, `postcss.config.mjs`
- Create: `.env.example`
- Create: `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`

**Step 1: Initialize Next.js project**

Run:
```bash
cd /Users/parker/myClaudeWorkspace/projects/Concerts\ Near\ Me/.clubhouse/agents/grand-iguana
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm
```

Accept defaults. This creates the full Next.js scaffold with Tailwind.

**Step 2: Create .env.example**

Create `.env.example`:
```
TICKETMASTER_API_KEY=
SEATGEEK_CLIENT_ID=
SPOTIFY_CLIENT_ID=
SPOTIFY_CLIENT_SECRET=
OPENWEATHERMAP_API_KEY=
DATABASE_URL=file:./dev.db
```

**Step 3: Update .gitignore**

Append to `.gitignore`:
```
.env
.env.local
*.db
*.db-journal
```

**Step 4: Verify dev server starts**

Run: `npm run dev`
Expected: Server starts on localhost:3000

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: scaffold Next.js project with TypeScript and Tailwind"
```

---

## Task 2: Database Schema with Prisma

**Files:**
- Create: `prisma/schema.prisma`
- Modify: `package.json` (add prisma deps)

**Step 1: Install Prisma**

Run:
```bash
npm install prisma --save-dev
npm install @prisma/client
npx prisma init --datasource-provider sqlite
```

**Step 2: Define schema**

Write `prisma/schema.prisma`:
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model Venue {
  id        String   @id @default(cuid())
  name      String
  address   String?
  lat       Float?
  lng       Float?
  isOutdoor Boolean  @default(false)
  website   String?
  scrapable Boolean  @default(false)
  events    Event[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Artist {
  id        String    @id @default(cuid())
  name      String
  spotifyId String?   @unique
  imageUrl  String?
  genres    String?
  events    Event[]
  topSongs  TopSong[]
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
}

model TopSong {
  id          String @id @default(cuid())
  artistId    String
  artist      Artist @relation(fields: [artistId], references: [id], onDelete: Cascade)
  trackName   String
  albumName   String?
  albumArtUrl String?
  previewUrl  String?
  spotifyUrl  String?
  rank        Int
}

model Event {
  id            String            @id @default(cuid())
  title         String
  artistName    String
  artistId      String?
  artist        Artist?           @relation(fields: [artistId], references: [id])
  venueId       String?
  venue         Venue?            @relation(fields: [venueId], references: [id])
  venueName     String
  date          DateTime
  time          String?
  isOutdoor     Boolean           @default(false)
  ticketUrl     String?
  priceMin      Float?
  priceMax      Float?
  priceCategory String?
  source        String
  sourceId      String?
  weather       WeatherForecast?
  createdAt     DateTime          @default(now())
  updatedAt     DateTime          @updatedAt

  @@unique([artistName, date, venueName])
}

model WeatherForecast {
  id           String   @id @default(cuid())
  eventId      String   @unique
  event        Event    @relation(fields: [eventId], references: [id], onDelete: Cascade)
  date         DateTime
  tempHigh     Float?
  tempLow      Float?
  icon         String?
  description  String?
  precipChance Float?
  windSpeed    Float?
  severity     String   @default("none")
  fetchedAt    DateTime @default(now())
}
```

**Step 3: Create .env file**

Create `.env`:
```
DATABASE_URL=file:./dev.db
```

**Step 4: Generate client and push schema**

Run:
```bash
npx prisma db push
npx prisma generate
```

Expected: SQLite database created, Prisma client generated.

**Step 5: Create Prisma client singleton**

Create `src/lib/prisma.ts`:
```typescript
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

**Step 6: Commit**

```bash
git add -A
git commit -m "feat: add Prisma schema with Event, Venue, Artist, TopSong, WeatherForecast models"
```

---

## Task 3: Ticketmaster Integration

**Files:**
- Create: `src/lib/integrations/ticketmaster.ts`
- Create: `src/lib/integrations/__tests__/ticketmaster.test.ts`

**Step 1: Write the failing test**

Create `src/lib/integrations/__tests__/ticketmaster.test.ts`:
```typescript
import { fetchTicketmasterEvents, parseTicketmasterEvent } from "../ticketmaster";

describe("parseTicketmasterEvent", () => {
  it("parses a Ticketmaster API event into our Event shape", () => {
    const raw = {
      id: "tm123",
      name: "Test Band Live",
      dates: {
        start: { localDate: "2026-04-15", localTime: "20:00:00" },
      },
      _embedded: {
        venues: [
          {
            name: "Greenfield Lake Amphitheater",
            address: { line1: "1941 Amphitheatre Dr" },
            location: { latitude: "34.2104", longitude: "-77.9277" },
          },
        ],
        attractions: [{ name: "Test Band" }],
      },
      priceRanges: [{ min: 25, max: 75, currency: "USD" }],
      url: "https://ticketmaster.com/event/tm123",
    };

    const parsed = parseTicketmasterEvent(raw);

    expect(parsed.title).toBe("Test Band Live");
    expect(parsed.artistName).toBe("Test Band");
    expect(parsed.venueName).toBe("Greenfield Lake Amphitheater");
    expect(parsed.date).toBe("2026-04-15");
    expect(parsed.time).toBe("20:00:00");
    expect(parsed.priceMin).toBe(25);
    expect(parsed.priceMax).toBe(75);
    expect(parsed.ticketUrl).toBe("https://ticketmaster.com/event/tm123");
    expect(parsed.source).toBe("ticketmaster");
    expect(parsed.sourceId).toBe("tm123");
  });

  it("handles missing price ranges gracefully", () => {
    const raw = {
      id: "tm456",
      name: "Free Show",
      dates: { start: { localDate: "2026-05-01" } },
      _embedded: {
        venues: [{ name: "Local Bar" }],
        attractions: [{ name: "Local Act" }],
      },
      url: "https://ticketmaster.com/event/tm456",
    };

    const parsed = parseTicketmasterEvent(raw);
    expect(parsed.priceMin).toBeNull();
    expect(parsed.priceMax).toBeNull();
  });
});
```

**Step 2: Install Jest and configure**

Run:
```bash
npm install --save-dev jest ts-jest @types/jest
```

Create `jest.config.ts`:
```typescript
import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  testMatch: ["**/__tests__/**/*.test.ts"],
};

export default config;
```

Add to `package.json` scripts: `"test": "jest"`

**Step 3: Run test to verify it fails**

Run: `npm test -- --testPathPattern=ticketmaster`
Expected: FAIL — module not found

**Step 4: Implement Ticketmaster integration**

Create `src/lib/integrations/ticketmaster.ts`:
```typescript
interface ParsedEvent {
  title: string;
  artistName: string;
  venueName: string;
  venueAddress: string | null;
  venueLat: number | null;
  venueLng: number | null;
  date: string;
  time: string | null;
  priceMin: number | null;
  priceMax: number | null;
  ticketUrl: string | null;
  source: string;
  sourceId: string;
}

export function parseTicketmasterEvent(raw: Record<string, unknown>): ParsedEvent {
  const embedded = raw._embedded as Record<string, unknown[]> | undefined;
  const venues = embedded?.venues as Record<string, unknown>[] | undefined;
  const attractions = embedded?.attractions as Record<string, unknown>[] | undefined;
  const venue = venues?.[0];
  const dates = raw.dates as Record<string, Record<string, string>> | undefined;
  const priceRanges = raw.priceRanges as Array<{ min: number; max: number }> | undefined;

  const venueAddress = venue?.address as Record<string, string> | undefined;
  const venueLocation = venue?.location as Record<string, string> | undefined;

  return {
    title: raw.name as string,
    artistName: (attractions?.[0] as Record<string, string>)?.name ?? (raw.name as string),
    venueName: (venue?.name as string) ?? "Unknown Venue",
    venueAddress: venueAddress?.line1 ?? null,
    venueLat: venueLocation?.latitude ? parseFloat(venueLocation.latitude) : null,
    venueLng: venueLocation?.longitude ? parseFloat(venueLocation.longitude) : null,
    date: dates?.start?.localDate ?? "",
    time: dates?.start?.localTime ?? null,
    priceMin: priceRanges?.[0]?.min ?? null,
    priceMax: priceRanges?.[0]?.max ?? null,
    ticketUrl: (raw.url as string) ?? null,
    source: "ticketmaster",
    sourceId: raw.id as string,
  };
}

export async function fetchTicketmasterEvents(): Promise<ParsedEvent[]> {
  const apiKey = process.env.TICKETMASTER_API_KEY;
  if (!apiKey) throw new Error("TICKETMASTER_API_KEY not set");

  const url = new URL("https://app.ticketmaster.com/discovery/v2/events.json");
  url.searchParams.set("apikey", apiKey);
  url.searchParams.set("city", "Wilmington");
  url.searchParams.set("stateCode", "NC");
  url.searchParams.set("classificationName", "music");
  url.searchParams.set("size", "100");
  url.searchParams.set("sort", "date,asc");

  const response = await fetch(url.toString());
  if (!response.ok) throw new Error(`Ticketmaster API error: ${response.status}`);

  const data = await response.json();
  const events = data?._embedded?.events ?? [];

  return events.map(parseTicketmasterEvent);
}
```

**Step 5: Run test to verify it passes**

Run: `npm test -- --testPathPattern=ticketmaster`
Expected: PASS

**Step 6: Commit**

```bash
git add -A
git commit -m "feat: add Ticketmaster API integration with event parser"
```

---

## Task 4: SeatGeek Integration

**Files:**
- Create: `src/lib/integrations/seatgeek.ts`
- Create: `src/lib/integrations/__tests__/seatgeek.test.ts`

**Step 1: Write the failing test**

Create `src/lib/integrations/__tests__/seatgeek.test.ts`:
```typescript
import { parseSeatGeekEvent } from "../seatgeek";

describe("parseSeatGeekEvent", () => {
  it("parses a SeatGeek API event into our Event shape", () => {
    const raw = {
      id: 12345,
      title: "Rock Show",
      performers: [{ name: "Rock Band", image: "https://img.seatgeek.com/rock.jpg" }],
      venue: {
        name: "Brooklyn Arts Center",
        address: "516 N 4th St",
        location: { lat: 34.2428, lon: -77.9469 },
      },
      datetime_local: "2026-04-20T19:30:00",
      stats: { lowest_price: 30, highest_price: 90 },
      url: "https://seatgeek.com/rock-show-tickets",
    };

    const parsed = parseSeatGeekEvent(raw);

    expect(parsed.title).toBe("Rock Show");
    expect(parsed.artistName).toBe("Rock Band");
    expect(parsed.venueName).toBe("Brooklyn Arts Center");
    expect(parsed.date).toBe("2026-04-20");
    expect(parsed.time).toBe("19:30:00");
    expect(parsed.priceMin).toBe(30);
    expect(parsed.priceMax).toBe(90);
    expect(parsed.source).toBe("seatgeek");
    expect(parsed.sourceId).toBe("12345");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- --testPathPattern=seatgeek`
Expected: FAIL

**Step 3: Implement SeatGeek integration**

Create `src/lib/integrations/seatgeek.ts`:
```typescript
interface ParsedEvent {
  title: string;
  artistName: string;
  venueName: string;
  venueAddress: string | null;
  venueLat: number | null;
  venueLng: number | null;
  date: string;
  time: string | null;
  priceMin: number | null;
  priceMax: number | null;
  ticketUrl: string | null;
  source: string;
  sourceId: string;
}

export function parseSeatGeekEvent(raw: Record<string, unknown>): ParsedEvent {
  const performers = raw.performers as Array<{ name: string; image?: string }> | undefined;
  const venue = raw.venue as Record<string, unknown> | undefined;
  const location = venue?.location as { lat: number; lon: number } | undefined;
  const stats = raw.stats as { lowest_price?: number; highest_price?: number } | undefined;
  const datetimeLocal = raw.datetime_local as string;

  const [date, timeWithZone] = datetimeLocal?.split("T") ?? ["", null];
  const time = timeWithZone ?? null;

  return {
    title: raw.title as string,
    artistName: performers?.[0]?.name ?? (raw.title as string),
    venueName: (venue?.name as string) ?? "Unknown Venue",
    venueAddress: (venue?.address as string) ?? null,
    venueLat: location?.lat ?? null,
    venueLng: location?.lon ?? null,
    date,
    time,
    priceMin: stats?.lowest_price ?? null,
    priceMax: stats?.highest_price ?? null,
    ticketUrl: (raw.url as string) ?? null,
    source: "seatgeek",
    sourceId: String(raw.id),
  };
}

export async function fetchSeatGeekEvents(): Promise<ParsedEvent[]> {
  const clientId = process.env.SEATGEEK_CLIENT_ID;
  if (!clientId) throw new Error("SEATGEEK_CLIENT_ID not set");

  const url = new URL("https://api.seatgeek.com/2/events");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("lat", "34.2257");
  url.searchParams.set("lon", "-77.9447");
  url.searchParams.set("range", "30mi");
  url.searchParams.set("type", "concert");
  url.searchParams.set("per_page", "100");
  url.searchParams.set("sort", "datetime_local.asc");

  const response = await fetch(url.toString());
  if (!response.ok) throw new Error(`SeatGeek API error: ${response.status}`);

  const data = await response.json();
  return (data.events ?? []).map(parseSeatGeekEvent);
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- --testPathPattern=seatgeek`
Expected: PASS

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: add SeatGeek API integration with event parser"
```

---

## Task 5: Spotify Integration

**Files:**
- Create: `src/lib/integrations/spotify.ts`
- Create: `src/lib/integrations/__tests__/spotify.test.ts`

**Step 1: Write the failing test**

Create `src/lib/integrations/__tests__/spotify.test.ts`:
```typescript
import { parseSpotifyTopTracks, parseSpotifyArtist } from "../spotify";

describe("parseSpotifyArtist", () => {
  it("parses Spotify artist search result", () => {
    const raw = {
      id: "abc123",
      name: "Test Band",
      images: [
        { url: "https://i.scdn.co/image/large.jpg", width: 640 },
        { url: "https://i.scdn.co/image/medium.jpg", width: 300 },
      ],
      genres: ["rock", "indie"],
    };

    const parsed = parseSpotifyArtist(raw);
    expect(parsed.spotifyId).toBe("abc123");
    expect(parsed.name).toBe("Test Band");
    expect(parsed.imageUrl).toBe("https://i.scdn.co/image/large.jpg");
    expect(parsed.genres).toBe("rock, indie");
  });
});

describe("parseSpotifyTopTracks", () => {
  it("parses Spotify top tracks with preview URLs", () => {
    const tracks = [
      {
        name: "Hit Song",
        album: {
          name: "Great Album",
          images: [{ url: "https://i.scdn.co/image/album.jpg", width: 300 }],
        },
        preview_url: "https://p.scdn.co/mp3-preview/abc",
        external_urls: { spotify: "https://open.spotify.com/track/123" },
      },
    ];

    const parsed = parseSpotifyTopTracks(tracks);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].trackName).toBe("Hit Song");
    expect(parsed[0].albumName).toBe("Great Album");
    expect(parsed[0].previewUrl).toBe("https://p.scdn.co/mp3-preview/abc");
    expect(parsed[0].spotifyUrl).toBe("https://open.spotify.com/track/123");
    expect(parsed[0].rank).toBe(1);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- --testPathPattern=spotify`
Expected: FAIL

**Step 3: Implement Spotify integration**

Create `src/lib/integrations/spotify.ts`:
```typescript
interface SpotifyArtistInfo {
  spotifyId: string;
  name: string;
  imageUrl: string | null;
  genres: string;
}

interface SpotifyTrack {
  trackName: string;
  albumName: string | null;
  albumArtUrl: string | null;
  previewUrl: string | null;
  spotifyUrl: string | null;
  rank: number;
}

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getSpotifyToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.token;
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error("Spotify credentials not set");

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
    },
    body: "grant_type=client_credentials",
  });

  if (!response.ok) throw new Error(`Spotify auth error: ${response.status}`);

  const data = await response.json();
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  };
  return cachedToken.token;
}

export function parseSpotifyArtist(raw: Record<string, unknown>): SpotifyArtistInfo {
  const images = raw.images as Array<{ url: string; width: number }> | undefined;
  const genres = raw.genres as string[] | undefined;

  return {
    spotifyId: raw.id as string,
    name: raw.name as string,
    imageUrl: images?.[0]?.url ?? null,
    genres: genres?.join(", ") ?? "",
  };
}

export function parseSpotifyTopTracks(tracks: Array<Record<string, unknown>>): SpotifyTrack[] {
  return tracks.slice(0, 5).map((track, index) => {
    const album = track.album as Record<string, unknown> | undefined;
    const albumImages = album?.images as Array<{ url: string }> | undefined;
    const externalUrls = track.external_urls as Record<string, string> | undefined;

    return {
      trackName: track.name as string,
      albumName: (album?.name as string) ?? null,
      albumArtUrl: albumImages?.[0]?.url ?? null,
      previewUrl: (track.preview_url as string) ?? null,
      spotifyUrl: externalUrls?.spotify ?? null,
      rank: index + 1,
    };
  });
}

export async function searchArtist(artistName: string): Promise<SpotifyArtistInfo | null> {
  const token = await getSpotifyToken();

  const url = new URL("https://api.spotify.com/v1/search");
  url.searchParams.set("q", artistName);
  url.searchParams.set("type", "artist");
  url.searchParams.set("limit", "1");

  const response = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) return null;

  const data = await response.json();
  const artist = data.artists?.items?.[0];
  if (!artist) return null;

  return parseSpotifyArtist(artist);
}

export async function getTopTracks(spotifyId: string): Promise<SpotifyTrack[]> {
  const token = await getSpotifyToken();

  const response = await fetch(
    `https://api.spotify.com/v1/artists/${spotifyId}/top-tracks`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!response.ok) return [];

  const data = await response.json();
  return parseSpotifyTopTracks(data.tracks ?? []);
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- --testPathPattern=spotify`
Expected: PASS

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: add Spotify integration for artist search and top tracks"
```

---

## Task 6: Weather Integration

**Files:**
- Create: `src/lib/integrations/weather.ts`
- Create: `src/lib/integrations/__tests__/weather.test.ts`

**Step 1: Write the failing test**

Create `src/lib/integrations/__tests__/weather.test.ts`:
```typescript
import { parseWeatherForecast, getWeatherSeverity } from "../weather";

describe("getWeatherSeverity", () => {
  it("returns 'none' for clear weather", () => {
    expect(getWeatherSeverity("Clear", 0)).toBe("none");
  });

  it("returns 'warning' for rain", () => {
    expect(getWeatherSeverity("Rain", 60)).toBe("warning");
  });

  it("returns 'severe' for thunderstorm", () => {
    expect(getWeatherSeverity("Thunderstorm", 80)).toBe("severe");
  });

  it("returns 'warning' for high precipitation chance", () => {
    expect(getWeatherSeverity("Clouds", 70)).toBe("warning");
  });
});

describe("parseWeatherForecast", () => {
  it("parses OpenWeatherMap daily forecast", () => {
    const raw = {
      dt: 1745193600,
      temp: { min: 55, max: 72 },
      weather: [{ main: "Clear", description: "clear sky", icon: "01d" }],
      pop: 0.1,
      wind_speed: 8,
    };

    const parsed = parseWeatherForecast(raw);
    expect(parsed.tempHigh).toBe(72);
    expect(parsed.tempLow).toBe(55);
    expect(parsed.icon).toBe("01d");
    expect(parsed.description).toBe("clear sky");
    expect(parsed.precipChance).toBe(10);
    expect(parsed.severity).toBe("none");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- --testPathPattern=weather`
Expected: FAIL

**Step 3: Implement weather integration**

Create `src/lib/integrations/weather.ts`:
```typescript
interface WeatherData {
  date: Date;
  tempHigh: number | null;
  tempLow: number | null;
  icon: string | null;
  description: string | null;
  precipChance: number | null;
  windSpeed: number | null;
  severity: string;
}

export function getWeatherSeverity(condition: string, precipPercent: number): string {
  const severe = ["Thunderstorm", "Tornado", "Hurricane"];
  const warning = ["Rain", "Drizzle", "Snow", "Squall"];

  if (severe.some((s) => condition.includes(s))) return "severe";
  if (warning.some((w) => condition.includes(w))) return "warning";
  if (precipPercent >= 60) return "warning";
  return "none";
}

export function parseWeatherForecast(raw: Record<string, unknown>): WeatherData {
  const temp = raw.temp as { min: number; max: number };
  const weather = (raw.weather as Array<{ main: string; description: string; icon: string }>)?.[0];
  const pop = (raw.pop as number) ?? 0;

  const precipPercent = Math.round(pop * 100);
  const severity = getWeatherSeverity(weather?.main ?? "", precipPercent);

  return {
    date: new Date((raw.dt as number) * 1000),
    tempHigh: temp?.max ?? null,
    tempLow: temp?.min ?? null,
    icon: weather?.icon ?? null,
    description: weather?.description ?? null,
    precipChance: precipPercent,
    windSpeed: (raw.wind_speed as number) ?? null,
    severity,
  };
}

export async function fetchWeatherForecast(
  lat: number,
  lng: number
): Promise<WeatherData[]> {
  const apiKey = process.env.OPENWEATHERMAP_API_KEY;
  if (!apiKey) throw new Error("OPENWEATHERMAP_API_KEY not set");

  const url = new URL("https://api.openweathermap.org/data/3.0/onecall");
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lon", String(lng));
  url.searchParams.set("exclude", "current,minutely,hourly,alerts");
  url.searchParams.set("units", "imperial");
  url.searchParams.set("appid", apiKey);

  const response = await fetch(url.toString());
  if (!response.ok) throw new Error(`Weather API error: ${response.status}`);

  const data = await response.json();
  return (data.daily ?? []).map(parseWeatherForecast);
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- --testPathPattern=weather`
Expected: PASS

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: add OpenWeatherMap integration with smart severity detection"
```

---

## Task 7: Data Aggregation Service

**Files:**
- Create: `src/lib/services/aggregator.ts`
- Create: `src/lib/services/price-calculator.ts`

**Step 1: Create price calculator**

Create `src/lib/services/price-calculator.ts`:
```typescript
export function calculatePriceCategories(
  events: Array<{ priceMin: number | null; priceMax: number | null }>
): Map<number, string> {
  const prices = events
    .map((e) => e.priceMin ?? e.priceMax)
    .filter((p): p is number => p !== null)
    .sort((a, b) => a - b);

  if (prices.length === 0) return new Map();

  const low = prices[Math.floor(prices.length * 0.33)];
  const high = prices[Math.floor(prices.length * 0.66)];

  const categories = new Map<number, string>();
  events.forEach((event, index) => {
    const price = event.priceMin ?? event.priceMax;
    if (price === null) {
      categories.set(index, "green");
    } else if (price <= low) {
      categories.set(index, "green");
    } else if (price <= high) {
      categories.set(index, "yellow");
    } else {
      categories.set(index, "red");
    }
  });

  return categories;
}
```

**Step 2: Create aggregator service**

Create `src/lib/services/aggregator.ts`:
```typescript
import { prisma } from "@/lib/prisma";
import { fetchTicketmasterEvents } from "@/lib/integrations/ticketmaster";
import { fetchSeatGeekEvents } from "@/lib/integrations/seatgeek";
import { searchArtist, getTopTracks } from "@/lib/integrations/spotify";
import { fetchWeatherForecast } from "@/lib/integrations/weather";
import { calculatePriceCategories } from "./price-calculator";

function normalizeArtistName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

interface ParsedEvent {
  title: string;
  artistName: string;
  venueName: string;
  venueAddress: string | null;
  venueLat: number | null;
  venueLng: number | null;
  date: string;
  time: string | null;
  priceMin: number | null;
  priceMax: number | null;
  ticketUrl: string | null;
  source: string;
  sourceId: string;
}

function deduplicateEvents(events: ParsedEvent[]): ParsedEvent[] {
  const seen = new Map<string, ParsedEvent>();

  for (const event of events) {
    const key = `${normalizeArtistName(event.artistName)}-${event.date}-${normalizeArtistName(event.venueName)}`;

    const existing = seen.get(key);
    if (!existing || event.source === "ticketmaster") {
      seen.set(key, event);
    }
  }

  return Array.from(seen.values());
}

export async function refreshConcertData(): Promise<void> {
  console.log("Refreshing concert data...");

  // Fetch from all sources
  const [tmEvents, sgEvents] = await Promise.allSettled([
    fetchTicketmasterEvents(),
    fetchSeatGeekEvents(),
  ]);

  const allEvents: ParsedEvent[] = [
    ...(tmEvents.status === "fulfilled" ? tmEvents.value : []),
    ...(sgEvents.status === "fulfilled" ? sgEvents.value : []),
  ];

  const deduplicated = deduplicateEvents(allEvents);

  // Calculate price categories
  const priceCategories = calculatePriceCategories(deduplicated);

  // Upsert events
  for (let i = 0; i < deduplicated.length; i++) {
    const event = deduplicated[i];
    const priceCategory = priceCategories.get(i) ?? "green";

    // Upsert venue
    let venue = await prisma.venue.findFirst({
      where: { name: event.venueName },
    });

    if (!venue) {
      venue = await prisma.venue.create({
        data: {
          name: event.venueName,
          address: event.venueAddress,
          lat: event.venueLat,
          lng: event.venueLng,
        },
      });
    }

    // Upsert artist + Spotify data
    let artist = await prisma.artist.findFirst({
      where: { name: event.artistName },
    });

    if (!artist) {
      const spotifyInfo = await searchArtist(event.artistName);

      artist = await prisma.artist.create({
        data: {
          name: event.artistName,
          spotifyId: spotifyInfo?.spotifyId,
          imageUrl: spotifyInfo?.imageUrl,
          genres: spotifyInfo?.genres,
        },
      });

      // Fetch top songs
      if (spotifyInfo?.spotifyId) {
        const tracks = await getTopTracks(spotifyInfo.spotifyId);
        for (const track of tracks) {
          await prisma.topSong.create({
            data: {
              artistId: artist.id,
              ...track,
            },
          });
        }
      }
    }

    // Upsert event
    await prisma.event.upsert({
      where: {
        artistName_date_venueName: {
          artistName: event.artistName,
          date: new Date(event.date),
          venueName: event.venueName,
        },
      },
      update: {
        title: event.title,
        time: event.time,
        ticketUrl: event.ticketUrl,
        priceMin: event.priceMin,
        priceMax: event.priceMax,
        priceCategory,
        source: event.source,
        sourceId: event.sourceId,
      },
      create: {
        title: event.title,
        artistName: event.artistName,
        artistId: artist.id,
        venueId: venue.id,
        venueName: event.venueName,
        date: new Date(event.date),
        time: event.time,
        isOutdoor: venue.isOutdoor,
        ticketUrl: event.ticketUrl,
        priceMin: event.priceMin,
        priceMax: event.priceMax,
        priceCategory,
        source: event.source,
        sourceId: event.sourceId,
      },
    });
  }

  console.log(`Refreshed ${deduplicated.length} events`);
}

export async function refreshWeatherData(): Promise<void> {
  const tenDaysFromNow = new Date();
  tenDaysFromNow.setDate(tenDaysFromNow.getDate() + 10);

  const outdoorEvents = await prisma.event.findMany({
    where: {
      isOutdoor: true,
      date: { lte: tenDaysFromNow, gte: new Date() },
    },
    include: { venue: true },
  });

  // Group by venue to minimize API calls
  const venueGroups = new Map<string, typeof outdoorEvents>();
  for (const event of outdoorEvents) {
    const key = event.venueId ?? event.venueName;
    if (!venueGroups.has(key)) venueGroups.set(key, []);
    venueGroups.get(key)!.push(event);
  }

  for (const [, events] of venueGroups) {
    const venue = events[0].venue;
    if (!venue?.lat || !venue?.lng) continue;

    const forecasts = await fetchWeatherForecast(venue.lat, venue.lng);

    for (const event of events) {
      const eventDate = event.date.toISOString().split("T")[0];
      const forecast = forecasts.find(
        (f) => f.date.toISOString().split("T")[0] === eventDate
      );

      if (forecast) {
        await prisma.weatherForecast.upsert({
          where: { eventId: event.id },
          update: {
            date: forecast.date,
            tempHigh: forecast.tempHigh,
            tempLow: forecast.tempLow,
            icon: forecast.icon,
            description: forecast.description,
            precipChance: forecast.precipChance,
            windSpeed: forecast.windSpeed,
            severity: forecast.severity,
            fetchedAt: new Date(),
          },
          create: {
            eventId: event.id,
            date: forecast.date,
            tempHigh: forecast.tempHigh,
            tempLow: forecast.tempLow,
            icon: forecast.icon,
            description: forecast.description,
            precipChance: forecast.precipChance,
            windSpeed: forecast.windSpeed,
            severity: forecast.severity,
          },
        });
      }
    }
  }
}
```

**Step 3: Commit**

```bash
git add -A
git commit -m "feat: add data aggregation service with deduplication and price categorization"
```

---

## Task 8: API Routes

**Files:**
- Create: `src/app/api/events/route.ts`
- Create: `src/app/api/events/[id]/route.ts`
- Create: `src/app/api/refresh/route.ts`

**Step 1: Create events list API**

Create `src/app/api/events/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const venue = searchParams.get("venue");
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");
  const priceCategory = searchParams.get("priceCategory");
  const search = searchParams.get("search");

  const where: Record<string, unknown> = {
    date: { gte: new Date() },
  };

  if (venue) where.venueName = venue;
  if (dateFrom || dateTo) {
    where.date = {
      ...(where.date as Record<string, unknown>),
      ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
      ...(dateTo ? { lte: new Date(dateTo) } : {}),
    };
  }
  if (priceCategory) where.priceCategory = priceCategory;
  if (search) {
    where.OR = [
      { artistName: { contains: search } },
      { venueName: { contains: search } },
      { title: { contains: search } },
    ];
  }

  const events = await prisma.event.findMany({
    where,
    include: {
      artist: true,
      venue: true,
      weather: true,
    },
    orderBy: { date: "asc" },
  });

  return NextResponse.json(events);
}
```

**Step 2: Create event detail API**

Create `src/app/api/events/[id]/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      artist: {
        include: { topSongs: { orderBy: { rank: "asc" } } },
      },
      venue: true,
      weather: true,
    },
  });

  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  return NextResponse.json(event);
}
```

**Step 3: Create refresh API**

Create `src/app/api/refresh/route.ts`:
```typescript
import { NextResponse } from "next/server";
import { refreshConcertData, refreshWeatherData } from "@/lib/services/aggregator";

export async function POST() {
  try {
    await refreshConcertData();
    await refreshWeatherData();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Refresh failed:", error);
    return NextResponse.json(
      { error: "Refresh failed" },
      { status: 500 }
    );
  }
}
```

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: add API routes for events listing, detail, and data refresh"
```

---

## Task 9: Shared Types and UI Utilities

**Files:**
- Create: `src/types/index.ts`
- Create: `src/lib/utils.ts`

**Step 1: Create shared types**

Create `src/types/index.ts`:
```typescript
export interface EventWithRelations {
  id: string;
  title: string;
  artistName: string;
  venueName: string;
  date: string;
  time: string | null;
  isOutdoor: boolean;
  ticketUrl: string | null;
  priceMin: number | null;
  priceMax: number | null;
  priceCategory: string | null;
  source: string;
  artist: {
    id: string;
    name: string;
    spotifyId: string | null;
    imageUrl: string | null;
    genres: string | null;
    topSongs?: TopSongData[];
  } | null;
  venue: {
    id: string;
    name: string;
    address: string | null;
    lat: number | null;
    lng: number | null;
    isOutdoor: boolean;
  } | null;
  weather: WeatherData | null;
}

export interface TopSongData {
  id: string;
  trackName: string;
  albumName: string | null;
  albumArtUrl: string | null;
  previewUrl: string | null;
  spotifyUrl: string | null;
  rank: number;
}

export interface WeatherData {
  tempHigh: number | null;
  tempLow: number | null;
  icon: string | null;
  description: string | null;
  precipChance: number | null;
  windSpeed: number | null;
  severity: string;
}
```

**Step 2: Create utility functions**

Create `src/lib/utils.ts`:
```typescript
export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function formatTime(time: string | null): string {
  if (!time) return "TBA";
  const [hours, minutes] = time.split(":");
  const h = parseInt(hours);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${minutes} ${ampm}`;
}

export function formatPrice(min: number | null, max: number | null): string {
  if (min === null && max === null) return "Free / TBA";
  if (min === max || max === null) return `$${min}`;
  if (min === null) return `Up to $${max}`;
  return `$${min} - $${max}`;
}

export function getPriceCategoryColor(category: string | null): string {
  switch (category) {
    case "green": return "#22c55e";
    case "yellow": return "#eab308";
    case "red": return "#ef4444";
    default: return "#6b7280";
  }
}

export function getWeatherIconUrl(icon: string | null): string {
  if (!icon) return "";
  return `https://openweathermap.org/img/wn/${icon}@2x.png`;
}
```

**Step 3: Commit**

```bash
git add -A
git commit -m "feat: add shared types and UI utility functions"
```

---

## Task 10: Concert Card Component

**Files:**
- Create: `src/components/ConcertCard.tsx`

**Step 1: Build the concert card**

Create `src/components/ConcertCard.tsx`:
```tsx
"use client";

import Link from "next/link";
import { EventWithRelations } from "@/types";
import { formatDate, formatTime, formatPrice, getPriceCategoryColor, getWeatherIconUrl } from "@/lib/utils";

interface ConcertCardProps {
  event: EventWithRelations;
}

export default function ConcertCard({ event }: ConcertCardProps) {
  const priceColor = getPriceCategoryColor(event.priceCategory);
  const weatherIcon = event.weather?.icon ? getWeatherIconUrl(event.weather.icon) : null;
  const showWeatherWarning = event.isOutdoor && event.weather && event.weather.severity !== "none";

  return (
    <Link href={`/event/${event.id}`}>
      <div className="group relative overflow-hidden rounded-xl bg-gray-900 border border-gray-800 hover:border-purple-500/50 transition-all duration-300 cursor-pointer h-[360px]">
        {/* Artist Cover Photo */}
        <div className="absolute inset-0">
          {event.artist?.imageUrl ? (
            <img
              src={event.artist.imageUrl}
              alt={event.artistName}
              className="w-full h-full object-cover opacity-60 group-hover:opacity-75 group-hover:scale-105 transition-all duration-500"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-purple-900/50 to-gray-900" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
        </div>

        {/* Weather Warning Badge */}
        {showWeatherWarning && (
          <div
            className={`absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${
              event.weather!.severity === "severe"
                ? "bg-red-600/90 text-white"
                : "bg-yellow-500/90 text-black"
            }`}
          >
            {weatherIcon && (
              <img src={weatherIcon} alt="" className="w-5 h-5" />
            )}
            {event.weather!.severity === "severe" ? "Severe Weather" : "Rain Expected"}
          </div>
        )}

        {/* Outdoor Weather Info (non-warning) */}
        {event.isOutdoor && event.weather && event.weather.severity === "none" && (
          <div className="absolute top-3 right-3 flex items-center gap-1 text-xs text-gray-300 bg-black/50 rounded-full px-2 py-1">
            {weatherIcon && <img src={weatherIcon} alt="" className="w-5 h-5" />}
            <span>{event.weather.tempHigh ? `${Math.round(event.weather.tempHigh)}°` : ""}</span>
          </div>
        )}

        {/* Content */}
        <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2">
          <h3 className="text-xl font-bold text-white truncate">{event.artistName}</h3>
          <p className="text-sm text-gray-300">{event.venueName}</p>
          <div className="flex items-center justify-between">
            <span className="text-sm text-purple-300">
              {formatDate(event.date)} &middot; {formatTime(event.time)}
            </span>
          </div>

          {/* Price Bar */}
          <div className="space-y-1">
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-400">{formatPrice(event.priceMin, event.priceMax)}</span>
            </div>
            <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  backgroundColor: priceColor,
                  width: event.priceCategory === "red" ? "100%" : event.priceCategory === "yellow" ? "66%" : "33%",
                }}
              />
            </div>
          </div>

          {/* Buy Tickets Button */}
          {event.ticketUrl && (
            <button
              onClick={(e) => {
                e.preventDefault();
                window.open(event.ticketUrl!, "_blank");
              }}
              className="w-full mt-2 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              Buy Tickets
            </button>
          )}
        </div>
      </div>
    </Link>
  );
}
```

**Step 2: Commit**

```bash
git add -A
git commit -m "feat: add ConcertCard component with price bar and weather badges"
```

---

## Task 11: Audio Preview Player Component

**Files:**
- Create: `src/components/AudioPreviewPlayer.tsx`

**Step 1: Build the audio player**

Create `src/components/AudioPreviewPlayer.tsx`:
```tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { TopSongData } from "@/types";

interface AudioPreviewPlayerProps {
  songs: TopSongData[];
}

export default function AudioPreviewPlayer({ songs }: AudioPreviewPlayerProps) {
  const [currentTrack, setCurrentTrack] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  function togglePlay(previewUrl: string) {
    if (currentTrack === previewUrl && isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
    }

    const audio = new Audio(previewUrl);
    audioRef.current = audio;
    setCurrentTrack(previewUrl);

    audio.addEventListener("timeupdate", () => {
      setProgress((audio.currentTime / audio.duration) * 100);
    });

    audio.addEventListener("ended", () => {
      setIsPlaying(false);
      setProgress(0);
      setCurrentTrack(null);
    });

    audio.play();
    setIsPlaying(true);
  }

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-bold text-white">Top Songs</h3>
      {songs.map((song) => (
        <div
          key={song.id}
          className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/50 hover:bg-gray-800 transition-colors"
        >
          {/* Album Art */}
          {song.albumArtUrl ? (
            <img
              src={song.albumArtUrl}
              alt={song.albumName ?? ""}
              className="w-12 h-12 rounded object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-12 h-12 rounded bg-gray-700 flex-shrink-0" />
          )}

          {/* Track Info */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{song.trackName}</p>
            <p className="text-xs text-gray-400 truncate">{song.albumName}</p>

            {/* Progress bar when playing */}
            {currentTrack === song.previewUrl && (
              <div className="mt-1 h-0.5 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 transition-all duration-200"
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}
          </div>

          {/* Play Button */}
          {song.previewUrl && (
            <button
              onClick={() => togglePlay(song.previewUrl!)}
              className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-green-500 hover:bg-green-400 transition-colors"
            >
              {currentTrack === song.previewUrl && isPlaying ? (
                <svg className="w-4 h-4 text-black" fill="currentColor" viewBox="0 0 24 24">
                  <rect x="6" y="4" width="4" height="16" />
                  <rect x="14" y="4" width="4" height="16" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-black ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                  <polygon points="5,3 19,12 5,21" />
                </svg>
              )}
            </button>
          )}

          {/* Spotify Link */}
          {song.spotifyUrl && (
            <a
              href={song.spotifyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 text-green-500 hover:text-green-400 transition-colors"
              title="Open in Spotify"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
              </svg>
            </a>
          )}
        </div>
      ))}
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add -A
git commit -m "feat: add AudioPreviewPlayer component with 30-sec Spotify previews"
```

---

## Task 12: Filter Bar Component

**Files:**
- Create: `src/components/FilterBar.tsx`

**Step 1: Build the filter bar**

Create `src/components/FilterBar.tsx`:
```tsx
"use client";

import { useState } from "react";

interface FilterBarProps {
  venues: string[];
  onFilterChange: (filters: FilterState) => void;
}

export interface FilterState {
  search: string;
  venue: string;
  dateFrom: string;
  dateTo: string;
  priceCategory: string;
}

export default function FilterBar({ venues, onFilterChange }: FilterBarProps) {
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    venue: "",
    dateFrom: "",
    dateTo: "",
    priceCategory: "",
  });

  function updateFilter(key: keyof FilterState, value: string) {
    const updated = { ...filters, [key]: value };
    setFilters(updated);
    onFilterChange(updated);
  }

  function clearFilters() {
    const cleared: FilterState = { search: "", venue: "", dateFrom: "", dateTo: "", priceCategory: "" };
    setFilters(cleared);
    onFilterChange(cleared);
  }

  const hasActiveFilters = Object.values(filters).some((v) => v !== "");

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          type="text"
          placeholder="Search artists, venues..."
          value={filters.search}
          onChange={(e) => updateFilter("search", e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
        />
      </div>

      {/* Filter Row */}
      <div className="flex flex-wrap gap-3">
        {/* Venue */}
        <select
          value={filters.venue}
          onChange={(e) => updateFilter("venue", e.target.value)}
          className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500"
        >
          <option value="">All Venues</option>
          {venues.map((v) => (
            <option key={v} value={v}>{v}</option>
          ))}
        </select>

        {/* Date From */}
        <input
          type="date"
          value={filters.dateFrom}
          onChange={(e) => updateFilter("dateFrom", e.target.value)}
          className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500"
        />

        {/* Date To */}
        <input
          type="date"
          value={filters.dateTo}
          onChange={(e) => updateFilter("dateTo", e.target.value)}
          className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500"
        />

        {/* Price Category */}
        <select
          value={filters.priceCategory}
          onChange={(e) => updateFilter("priceCategory", e.target.value)}
          className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500"
        >
          <option value="">All Prices</option>
          <option value="green">$ Budget</option>
          <option value="yellow">$$ Moderate</option>
          <option value="red">$$$ Premium</option>
        </select>

        {/* Clear */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="px-4 py-2 text-sm text-purple-400 hover:text-purple-300 transition-colors"
          >
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add -A
git commit -m "feat: add FilterBar component with search, venue, date, and price filters"
```

---

## Task 13: Home Page

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/app/layout.tsx`
- Modify: `src/app/globals.css`

**Step 1: Set up global styles and dark theme**

Replace `src/app/globals.css`:
```css
@import "tailwindcss";

:root {
  --background: #0a0a0f;
  --foreground: #e5e5e5;
}

body {
  background: var(--background);
  color: var(--foreground);
  font-family: system-ui, -apple-system, sans-serif;
}

/* Scrollbar styling */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: #1a1a2e;
}

::-webkit-scrollbar-thumb {
  background: #4a4a6a;
  border-radius: 4px;
}

/* Date input styling for dark theme */
input[type="date"]::-webkit-calendar-picker-indicator {
  filter: invert(1);
}
```

**Step 2: Update layout**

Replace `src/app/layout.tsx`:
```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Concerts Near Wilmington, NC",
  description: "Find upcoming concerts, shows, and live music in the Wilmington, NC area",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#0a0a0f]">
        {/* Navigation */}
        <nav className="sticky top-0 z-50 backdrop-blur-xl bg-[#0a0a0f]/80 border-b border-gray-800/50">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <a href="/" className="flex items-center gap-2">
              <span className="text-2xl">🎸</span>
              <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                ILM Concerts
              </span>
            </a>
            <span className="text-sm text-gray-500">Wilmington, NC</span>
          </div>
        </nav>

        <main>{children}</main>

        {/* Footer */}
        <footer className="border-t border-gray-800/50 mt-16 py-8 text-center text-sm text-gray-600">
          <p>Data from Ticketmaster, SeatGeek, and local venues</p>
          <p className="mt-1">Artist info and previews powered by Spotify</p>
        </footer>
      </body>
    </html>
  );
}
```

**Step 3: Build home page**

Replace `src/app/page.tsx`:
```tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import ConcertCard from "@/components/ConcertCard";
import FilterBar, { FilterState } from "@/components/FilterBar";
import { EventWithRelations } from "@/types";

export default function HomePage() {
  const [events, setEvents] = useState<EventWithRelations[]>([]);
  const [venues, setVenues] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    venue: "",
    dateFrom: "",
    dateTo: "",
    priceCategory: "",
  });

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.search) params.set("search", filters.search);
    if (filters.venue) params.set("venue", filters.venue);
    if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
    if (filters.dateTo) params.set("dateTo", filters.dateTo);
    if (filters.priceCategory) params.set("priceCategory", filters.priceCategory);

    try {
      const res = await fetch(`/api/events?${params.toString()}`);
      const data = await res.json();
      setEvents(data);

      // Extract unique venues
      const uniqueVenues = [...new Set(data.map((e: EventWithRelations) => e.venueName))] as string[];
      setVenues(uniqueVenues);
    } catch (error) {
      console.error("Failed to fetch events:", error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    const debounce = setTimeout(fetchEvents, 300);
    return () => clearTimeout(debounce);
  }, [fetchEvents]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Hero */}
      <div className="text-center mb-10">
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent mb-3">
          Live Music in Wilmington
        </h1>
        <p className="text-gray-400 text-lg">
          {loading ? "Loading..." : `${events.length} upcoming shows`}
        </p>
      </div>

      {/* Filters */}
      <div className="mb-8">
        <FilterBar venues={venues} onFilterChange={setFilters} />
      </div>

      {/* Event Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-[360px] rounded-xl bg-gray-900 animate-pulse" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-2xl text-gray-500 mb-2">No shows found</p>
          <p className="text-gray-600">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {events.map((event) => (
            <ConcertCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
}
```

**Step 4: Verify dev server builds**

Run: `npm run build`
Expected: Build succeeds (may have warnings about missing data, that's fine)

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: build home page with hero, filter bar, and concert card grid"
```

---

## Task 14: Event Detail Page

**Files:**
- Create: `src/app/event/[id]/page.tsx`

**Step 1: Build event detail page**

Create `src/app/event/[id]/page.tsx`:
```tsx
"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import AudioPreviewPlayer from "@/components/AudioPreviewPlayer";
import { EventWithRelations } from "@/types";
import { formatDate, formatTime, formatPrice, getPriceCategoryColor, getWeatherIconUrl } from "@/lib/utils";

export default function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [event, setEvent] = useState<EventWithRelations | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEvent() {
      try {
        const res = await fetch(`/api/events/${id}`);
        if (res.ok) {
          setEvent(await res.json());
        }
      } catch (error) {
        console.error("Failed to fetch event:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchEvent();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="h-80 rounded-2xl bg-gray-900 animate-pulse mb-8" />
        <div className="h-8 w-64 bg-gray-900 animate-pulse rounded mb-4" />
        <div className="h-4 w-48 bg-gray-900 animate-pulse rounded" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <p className="text-2xl text-gray-500 mb-4">Event not found</p>
        <Link href="/" className="text-purple-400 hover:text-purple-300">
          Back to all shows
        </Link>
      </div>
    );
  }

  const priceColor = getPriceCategoryColor(event.priceCategory);
  const weatherIcon = event.weather?.icon ? getWeatherIconUrl(event.weather.icon) : null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Back Link */}
      <Link href="/" className="inline-flex items-center text-sm text-gray-400 hover:text-purple-400 mb-6 transition-colors">
        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        All Shows
      </Link>

      {/* Hero Image */}
      <div className="relative h-80 md:h-96 rounded-2xl overflow-hidden mb-8">
        {event.artist?.imageUrl ? (
          <img
            src={event.artist.imageUrl}
            alt={event.artistName}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-purple-900 to-gray-900" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
        <div className="absolute bottom-6 left-6">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">{event.artistName}</h1>
          {event.artist?.genres && (
            <p className="text-purple-300 text-sm">{event.artist.genres}</p>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Main Info */}
        <div className="md:col-span-2 space-y-6">
          {/* Date & Venue */}
          <div className="bg-gray-900 rounded-xl p-6 space-y-4">
            <div className="flex items-start gap-4">
              <div className="bg-purple-600/20 p-3 rounded-lg">
                <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-lg font-semibold text-white">{formatDate(event.date)}</p>
                <p className="text-gray-400">{formatTime(event.time)}</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="bg-purple-600/20 p-3 rounded-lg">
                <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <p className="text-lg font-semibold text-white">{event.venueName}</p>
                {event.venue?.address && (
                  <p className="text-gray-400">{event.venue.address}</p>
                )}
                {event.isOutdoor && (
                  <span className="inline-block mt-1 text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded">
                    Outdoor Venue
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Weather (outdoor only) */}
          {event.isOutdoor && event.weather && (
            <div
              className={`rounded-xl p-6 ${
                event.weather.severity === "severe"
                  ? "bg-red-900/30 border border-red-800"
                  : event.weather.severity === "warning"
                  ? "bg-yellow-900/30 border border-yellow-800"
                  : "bg-gray-900"
              }`}
            >
              <h3 className="text-lg font-bold text-white mb-3">Weather Outlook</h3>
              <div className="flex items-center gap-4">
                {weatherIcon && <img src={weatherIcon} alt="" className="w-16 h-16" />}
                <div>
                  <p className="text-white capitalize">{event.weather.description}</p>
                  <p className="text-gray-400">
                    High: {event.weather.tempHigh ? `${Math.round(event.weather.tempHigh)}°F` : "N/A"} / Low:{" "}
                    {event.weather.tempLow ? `${Math.round(event.weather.tempLow)}°F` : "N/A"}
                  </p>
                  {event.weather.precipChance !== null && event.weather.precipChance > 0 && (
                    <p className="text-gray-400">
                      {event.weather.precipChance}% chance of precipitation
                    </p>
                  )}
                  {event.weather.windSpeed !== null && (
                    <p className="text-gray-400">Wind: {Math.round(event.weather.windSpeed)} mph</p>
                  )}
                </div>
              </div>
              {event.weather.severity === "severe" && (
                <p className="mt-3 text-red-400 font-semibold">Severe weather expected — check for updates before attending</p>
              )}
              {event.weather.severity === "warning" && (
                <p className="mt-3 text-yellow-400 font-semibold">Rain expected — consider bringing rain gear</p>
              )}
            </div>
          )}

          {/* Top Songs */}
          {event.artist?.topSongs && event.artist.topSongs.length > 0 && (
            <div className="bg-gray-900 rounded-xl p-6">
              <AudioPreviewPlayer songs={event.artist.topSongs} />
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Ticket Card */}
          <div className="bg-gray-900 rounded-xl p-6 space-y-4 sticky top-24">
            <h3 className="text-lg font-bold text-white">Tickets</h3>

            <div>
              <p className="text-2xl font-bold text-white">
                {formatPrice(event.priceMin, event.priceMax)}
              </p>
              <div className="mt-2 h-2 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    backgroundColor: priceColor,
                    width: event.priceCategory === "red" ? "100%" : event.priceCategory === "yellow" ? "66%" : "33%",
                  }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {event.priceCategory === "green"
                  ? "Below average for the area"
                  : event.priceCategory === "yellow"
                  ? "Average for the area"
                  : event.priceCategory === "red"
                  ? "Above average for the area"
                  : "Price info unavailable"}
              </p>
            </div>

            {event.ticketUrl && (
              <a
                href={event.ticketUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full py-3 bg-purple-600 hover:bg-purple-500 text-white text-center font-semibold rounded-lg transition-colors"
              >
                Buy Tickets
              </a>
            )}

            <p className="text-xs text-gray-600 text-center">
              via {event.source === "ticketmaster" ? "Ticketmaster" : event.source === "seatgeek" ? "SeatGeek" : "Venue"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add -A
git commit -m "feat: build event detail page with weather outlook, tickets, and top songs"
```

---

## Task 15: Seed Script for Development

**Files:**
- Create: `prisma/seed.ts`
- Modify: `package.json` (add seed script)

**Step 1: Create seed script with sample data**

Create `prisma/seed.ts`:
```typescript
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Clear existing data
  await prisma.weatherForecast.deleteMany();
  await prisma.topSong.deleteMany();
  await prisma.event.deleteMany();
  await prisma.artist.deleteMany();
  await prisma.venue.deleteMany();

  // Create venues
  const greenfield = await prisma.venue.create({
    data: {
      name: "Greenfield Lake Amphitheater",
      address: "1941 Amphitheatre Dr, Wilmington, NC",
      lat: 34.2104,
      lng: -77.9277,
      isOutdoor: true,
      website: "https://greenfieldlakeamphitheater.com",
    },
  });

  const brooklynArts = await prisma.venue.create({
    data: {
      name: "Brooklyn Arts Center",
      address: "516 N 4th St, Wilmington, NC",
      lat: 34.2428,
      lng: -77.9469,
      isOutdoor: false,
    },
  });

  const bourgie = await prisma.venue.create({
    data: {
      name: "Bourgie Nights",
      address: "127 Princess St, Wilmington, NC",
      lat: 34.2357,
      lng: -77.9486,
      isOutdoor: false,
    },
  });

  const reggies = await prisma.venue.create({
    data: {
      name: "Reggies 42nd Street Tavern",
      address: "118 S 42nd St, Wilmington, NC",
      lat: 34.2150,
      lng: -77.8890,
      isOutdoor: false,
    },
  });

  // Create artists with sample Spotify data
  const artist1 = await prisma.artist.create({
    data: {
      name: "Hozier",
      imageUrl: "https://i.scdn.co/image/ab6761610000e5eb45e7eae167399ab37e8d40b2",
      genres: "indie rock, folk",
      topSongs: {
        create: [
          { trackName: "Take Me to Church", albumName: "Hozier", rank: 1, albumArtUrl: "https://i.scdn.co/image/ab67616d0000b273a0adee3e383a7b420fa9e4fb", previewUrl: null, spotifyUrl: "https://open.spotify.com/track/1CS7Sd1u5tY4bvE17h1E0U" },
          { trackName: "Too Sweet", albumName: "Unreal Unearth", rank: 2, albumArtUrl: "https://i.scdn.co/image/ab67616d0000b273e35ba863e1c8f0e96e23dfb8", previewUrl: null, spotifyUrl: "https://open.spotify.com/track/3u52T7fOJ1pvKjXriCcrHv" },
          { trackName: "Cherry Wine", albumName: "Hozier", rank: 3, albumArtUrl: "https://i.scdn.co/image/ab67616d0000b273a0adee3e383a7b420fa9e4fb", previewUrl: null, spotifyUrl: "https://open.spotify.com/track/1RnLJlGE1rOGSmBv5YSfcE" },
        ],
      },
    },
  });

  const artist2 = await prisma.artist.create({
    data: {
      name: "Khruangbin",
      imageUrl: "https://i.scdn.co/image/ab6761610000e5eb6b6a07bd9cf7f37dab67b6d3",
      genres: "psychedelic rock, funk",
      topSongs: {
        create: [
          { trackName: "Time (You and I)", albumName: "Con Todo El Mundo", rank: 1, albumArtUrl: "https://i.scdn.co/image/ab67616d0000b273c5eb4ff16da74e5db4c4b982", previewUrl: null, spotifyUrl: "https://open.spotify.com/track/7MVIfkyzNMbSzJGIcDvmkP" },
          { trackName: "People Everywhere (Still Alive)", albumName: "The Universe Smiles Upon You", rank: 2, albumArtUrl: "https://i.scdn.co/image/ab67616d0000b2734f518c25690c40aeb06c7a64", previewUrl: null, spotifyUrl: "https://open.spotify.com/track/0gSBJqjK5bLKUwlBFrNY9y" },
        ],
      },
    },
  });

  const artist3 = await prisma.artist.create({
    data: {
      name: "Local Natives",
      imageUrl: "https://i.scdn.co/image/ab6761610000e5ebe7a709e88e0c6a1d7bca6b47",
      genres: "indie rock, indie pop",
      topSongs: {
        create: [
          { trackName: "When Am I Gonna Lose You", albumName: "Violet Street", rank: 1, previewUrl: null, spotifyUrl: "https://open.spotify.com/track/5lp1bHfwn8QNakDHedCiXN" },
          { trackName: "Airplanes", albumName: "Gorilla Manor", rank: 2, previewUrl: null, spotifyUrl: "https://open.spotify.com/track/6cpnzF0gfOIaThRPOw44Kb" },
        ],
      },
    },
  });

  const artist4 = await prisma.artist.create({
    data: {
      name: "Turnpike Troubadours",
      imageUrl: "https://i.scdn.co/image/ab6761610000e5eb1dec1a9d8e58d1583fa2fb81",
      genres: "red dirt, oklahoma country",
      topSongs: {
        create: [
          { trackName: "Diamonds & Gasoline", albumName: "Diamonds & Gasoline", rank: 1, previewUrl: null, spotifyUrl: "https://open.spotify.com/track/4a04S7mdHPQBCR4qYME2bT" },
          { trackName: "Good Lord Lorrie", albumName: "A Long Way from Your Heart", rank: 2, previewUrl: null, spotifyUrl: "https://open.spotify.com/track/2YMQ22cQMOB2D1s0RSrFf0" },
        ],
      },
    },
  });

  // Create events
  const now = new Date();

  await prisma.event.create({
    data: {
      title: "Hozier - Unreal Unearth Tour",
      artistName: "Hozier",
      artistId: artist1.id,
      venueId: greenfield.id,
      venueName: greenfield.name,
      date: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      time: "19:00:00",
      isOutdoor: true,
      ticketUrl: "https://ticketmaster.com/example",
      priceMin: 55,
      priceMax: 150,
      priceCategory: "red",
      source: "ticketmaster",
      sourceId: "tm-001",
    },
  });

  await prisma.event.create({
    data: {
      title: "Khruangbin Live",
      artistName: "Khruangbin",
      artistId: artist2.id,
      venueId: greenfield.id,
      venueName: greenfield.name,
      date: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
      time: "20:00:00",
      isOutdoor: true,
      ticketUrl: "https://ticketmaster.com/example2",
      priceMin: 45,
      priceMax: 120,
      priceCategory: "yellow",
      source: "ticketmaster",
      sourceId: "tm-002",
    },
  });

  await prisma.event.create({
    data: {
      title: "Local Natives",
      artistName: "Local Natives",
      artistId: artist3.id,
      venueId: brooklynArts.id,
      venueName: brooklynArts.name,
      date: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000),
      time: "21:00:00",
      isOutdoor: false,
      ticketUrl: "https://seatgeek.com/example",
      priceMin: 25,
      priceMax: 45,
      priceCategory: "green",
      source: "seatgeek",
      sourceId: "sg-001",
    },
  });

  await prisma.event.create({
    data: {
      title: "Turnpike Troubadours",
      artistName: "Turnpike Troubadours",
      artistId: artist4.id,
      venueId: bourgie.id,
      venueName: bourgie.name,
      date: new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000),
      time: "20:30:00",
      isOutdoor: false,
      ticketUrl: "https://ticketmaster.com/example3",
      priceMin: 35,
      priceMax: 65,
      priceCategory: "yellow",
      source: "ticketmaster",
      sourceId: "tm-003",
    },
  });

  // Add a weather warning for an outdoor event
  const outdoorEvent = await prisma.event.findFirst({
    where: { artistName: "Hozier" },
  });

  if (outdoorEvent) {
    await prisma.weatherForecast.create({
      data: {
        eventId: outdoorEvent.id,
        date: outdoorEvent.date,
        tempHigh: 78,
        tempLow: 62,
        icon: "10d",
        description: "light rain",
        precipChance: 65,
        windSpeed: 12,
        severity: "warning",
      },
    });
  }

  console.log("Seed data created successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

**Step 2: Add seed config to package.json**

Add to `package.json`:
```json
"prisma": {
  "seed": "npx tsx prisma/seed.ts"
}
```

Install tsx: `npm install --save-dev tsx`

**Step 3: Run seed**

Run:
```bash
npx prisma db seed
```
Expected: "Seed data created successfully!"

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: add seed script with sample Wilmington concert data"
```

---

## Task 16: Final Integration Test and Polish

**Step 1: Run dev server and verify**

Run: `npm run dev`

Verify:
- Home page loads with concert card grid
- Cards show artist images, venue names, dates, price bars
- Clicking a card navigates to detail page
- Detail page shows all sections (weather, songs, tickets)
- Filters work (search, venue dropdown, date range, price)
- "Buy Tickets" button opens external link
- Weather warning shows on outdoor event cards

**Step 2: Fix any build issues**

Run: `npm run build`
Expected: Build succeeds with no errors

**Step 3: Final commit**

```bash
git add -A
git commit -m "chore: final integration fixes and polish"
```
