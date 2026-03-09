import { ParsedEvent } from "./ticketmaster";

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
