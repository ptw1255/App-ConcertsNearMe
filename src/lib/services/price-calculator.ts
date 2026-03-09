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
