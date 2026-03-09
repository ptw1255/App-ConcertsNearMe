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
