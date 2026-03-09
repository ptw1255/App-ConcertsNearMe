"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import AudioPreviewPlayer from "@/components/AudioPreviewPlayer";
import { EventWithRelations } from "@/types";
import { formatDate, formatTime, formatPrice, getPriceCategoryColor, getWeatherIconUrl } from "@/lib/utils";

export default function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [event, setEvent] = useState<EventWithRelations | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEvent() {
      try {
        const res = await fetch(`/api/events/${id}`);
        if (res.ok) {
          setEvent(await res.json());
        }
      } catch (error) {
        console.error("Failed to fetch event:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchEvent();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="h-80 rounded-2xl bg-gray-900 animate-pulse mb-8" />
        <div className="h-8 w-64 bg-gray-900 animate-pulse rounded mb-4" />
        <div className="h-4 w-48 bg-gray-900 animate-pulse rounded" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <p className="text-2xl text-gray-500 mb-4">Event not found</p>
        <Link href="/" className="text-purple-400 hover:text-purple-300">
          Back to all shows
        </Link>
      </div>
    );
  }

  const priceColor = getPriceCategoryColor(event.priceCategory);
  const weatherIcon = event.weather?.icon ? getWeatherIconUrl(event.weather.icon) : null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Back Link */}
      <Link href="/" className="inline-flex items-center text-sm text-gray-400 hover:text-purple-400 mb-6 transition-colors">
        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        All Shows
      </Link>

      {/* Hero Image */}
      <div className="relative h-80 md:h-96 rounded-2xl overflow-hidden mb-8">
        {event.artist?.imageUrl ? (
          <img
            src={event.artist.imageUrl}
            alt={event.artistName}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-purple-900 to-gray-900" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
        <div className="absolute bottom-6 left-6">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">{event.artistName}</h1>
          {event.artist?.genres && (
            <p className="text-purple-300 text-sm">{event.artist.genres}</p>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Main Info */}
        <div className="md:col-span-2 space-y-6">
          {/* Date & Venue */}
          <div className="bg-gray-900 rounded-xl p-6 space-y-4">
            <div className="flex items-start gap-4">
              <div className="bg-purple-600/20 p-3 rounded-lg">
                <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-lg font-semibold text-white">{formatDate(event.date)}</p>
                <p className="text-gray-400">{formatTime(event.time)}</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="bg-purple-600/20 p-3 rounded-lg">
                <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <p className="text-lg font-semibold text-white">{event.venueName}</p>
                {event.venue?.address && (
                  <p className="text-gray-400">{event.venue.address}</p>
                )}
                {event.isOutdoor && (
                  <span className="inline-block mt-1 text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded">
                    Outdoor Venue
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Weather (outdoor only) */}
          {event.isOutdoor && event.weather && (
            <div
              className={`rounded-xl p-6 ${
                event.weather.severity === "severe"
                  ? "bg-red-900/30 border border-red-800"
                  : event.weather.severity === "warning"
                  ? "bg-yellow-900/30 border border-yellow-800"
                  : "bg-gray-900"
              }`}
            >
              <h3 className="text-lg font-bold text-white mb-3">Weather Outlook</h3>
              <div className="flex items-center gap-4">
                {weatherIcon && <img src={weatherIcon} alt="" className="w-16 h-16" />}
                <div>
                  <p className="text-white capitalize">{event.weather.description}</p>
                  <p className="text-gray-400">
                    High: {event.weather.tempHigh ? `${Math.round(event.weather.tempHigh)}°F` : "N/A"} / Low:{" "}
                    {event.weather.tempLow ? `${Math.round(event.weather.tempLow)}°F` : "N/A"}
                  </p>
                  {event.weather.precipChance !== null && event.weather.precipChance > 0 && (
                    <p className="text-gray-400">
                      {event.weather.precipChance}% chance of precipitation
                    </p>
                  )}
                  {event.weather.windSpeed !== null && (
                    <p className="text-gray-400">Wind: {Math.round(event.weather.windSpeed)} mph</p>
                  )}
                </div>
              </div>
              {event.weather.severity === "severe" && (
                <p className="mt-3 text-red-400 font-semibold">Severe weather expected — check for updates before attending</p>
              )}
              {event.weather.severity === "warning" && (
                <p className="mt-3 text-yellow-400 font-semibold">Rain expected — consider bringing rain gear</p>
              )}
            </div>
          )}

          {/* Top Songs */}
          {event.artist?.topSongs && event.artist.topSongs.length > 0 && (
            <div className="bg-gray-900 rounded-xl p-6">
              <AudioPreviewPlayer songs={event.artist.topSongs} />
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Ticket Card */}
          <div className="bg-gray-900 rounded-xl p-6 space-y-4 sticky top-24">
            <h3 className="text-lg font-bold text-white">Tickets</h3>

            <div>
              <p className="text-2xl font-bold text-white">
                {formatPrice(event.priceMin, event.priceMax)}
              </p>
              <div className="mt-2 h-2 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    backgroundColor: priceColor,
                    width: event.priceCategory === "red" ? "100%" : event.priceCategory === "yellow" ? "66%" : "33%",
                  }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {event.priceCategory === "green"
                  ? "Below average for the area"
                  : event.priceCategory === "yellow"
                  ? "Average for the area"
                  : event.priceCategory === "red"
                  ? "Above average for the area"
                  : "Price info unavailable"}
              </p>
            </div>

            {event.ticketUrl && (
              <a
                href={event.ticketUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full py-3 bg-purple-600 hover:bg-purple-500 text-white text-center font-semibold rounded-lg transition-colors"
              >
                Buy Tickets
              </a>
            )}

            <p className="text-xs text-gray-600 text-center">
              via {event.source === "ticketmaster" ? "Ticketmaster" : event.source === "seatgeek" ? "SeatGeek" : "Venue"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
