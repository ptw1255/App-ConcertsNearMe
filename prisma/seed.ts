import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({ url: "file:./dev.db" });
const prisma = new PrismaClient({ adapter });

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

  await prisma.venue.create({
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
          { trackName: "Take Me to Church", albumName: "Hozier", rank: 1, albumArtUrl: "https://i.scdn.co/image/ab67616d0000b273a0adee3e383a7b420fa9e4fb", spotifyUrl: "https://open.spotify.com/track/1CS7Sd1u5tY4bvE17h1E0U" },
          { trackName: "Too Sweet", albumName: "Unreal Unearth", rank: 2, albumArtUrl: "https://i.scdn.co/image/ab67616d0000b273e35ba863e1c8f0e96e23dfb8", spotifyUrl: "https://open.spotify.com/track/3u52T7fOJ1pvKjXriCcrHv" },
          { trackName: "Cherry Wine", albumName: "Hozier", rank: 3, albumArtUrl: "https://i.scdn.co/image/ab67616d0000b273a0adee3e383a7b420fa9e4fb", spotifyUrl: "https://open.spotify.com/track/1RnLJlGE1rOGSmBv5YSfcE" },
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
          { trackName: "Time (You and I)", albumName: "Con Todo El Mundo", rank: 1, albumArtUrl: "https://i.scdn.co/image/ab67616d0000b273c5eb4ff16da74e5db4c4b982", spotifyUrl: "https://open.spotify.com/track/7MVIfkyzNMbSzJGIcDvmkP" },
          { trackName: "People Everywhere (Still Alive)", albumName: "The Universe Smiles Upon You", rank: 2, albumArtUrl: "https://i.scdn.co/image/ab67616d0000b2734f518c25690c40aeb06c7a64", spotifyUrl: "https://open.spotify.com/track/0gSBJqjK5bLKUwlBFrNY9y" },
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
          { trackName: "When Am I Gonna Lose You", albumName: "Violet Street", rank: 1, spotifyUrl: "https://open.spotify.com/track/5lp1bHfwn8QNakDHedCiXN" },
          { trackName: "Airplanes", albumName: "Gorilla Manor", rank: 2, spotifyUrl: "https://open.spotify.com/track/6cpnzF0gfOIaThRPOw44Kb" },
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
          { trackName: "Diamonds & Gasoline", albumName: "Diamonds & Gasoline", rank: 1, spotifyUrl: "https://open.spotify.com/track/4a04S7mdHPQBCR4qYME2bT" },
          { trackName: "Good Lord Lorrie", albumName: "A Long Way from Your Heart", rank: 2, spotifyUrl: "https://open.spotify.com/track/2YMQ22cQMOB2D1s0RSrFf0" },
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

  // Add clear weather for Khruangbin outdoor event
  const khruangbinEvent = await prisma.event.findFirst({
    where: { artistName: "Khruangbin" },
  });

  if (khruangbinEvent) {
    await prisma.weatherForecast.create({
      data: {
        eventId: khruangbinEvent.id,
        date: khruangbinEvent.date,
        tempHigh: 82,
        tempLow: 68,
        icon: "01d",
        description: "clear sky",
        precipChance: 5,
        windSpeed: 6,
        severity: "none",
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
