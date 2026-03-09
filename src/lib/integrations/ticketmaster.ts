export interface ParsedEvent {
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
