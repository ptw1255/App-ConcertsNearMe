import { prisma } from "@/lib/prisma";
import { fetchTicketmasterEvents, ParsedEvent } from "@/lib/integrations/ticketmaster";
import { fetchSeatGeekEvents } from "@/lib/integrations/seatgeek";
import { searchArtist, getTopTracks } from "@/lib/integrations/spotify";
import { fetchWeatherForecast } from "@/lib/integrations/weather";
import { calculatePriceCategories } from "./price-calculator";

function normalizeArtistName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
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

  const [tmEvents, sgEvents] = await Promise.allSettled([
    fetchTicketmasterEvents(),
    fetchSeatGeekEvents(),
  ]);

  const allEvents: ParsedEvent[] = [
    ...(tmEvents.status === "fulfilled" ? tmEvents.value : []),
    ...(sgEvents.status === "fulfilled" ? sgEvents.value : []),
  ];

  const deduplicated = deduplicateEvents(allEvents);
  const priceCategories = calculatePriceCategories(deduplicated);

  for (let i = 0; i < deduplicated.length; i++) {
    const event = deduplicated[i];
    const priceCategory = priceCategories.get(i) ?? "green";

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
