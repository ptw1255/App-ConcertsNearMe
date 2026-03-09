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
