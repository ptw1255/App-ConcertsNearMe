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
