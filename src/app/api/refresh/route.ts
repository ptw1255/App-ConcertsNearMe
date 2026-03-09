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
