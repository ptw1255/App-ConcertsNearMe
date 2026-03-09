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
