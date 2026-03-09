"use client";

import Link from "next/link";
import { EventWithRelations } from "@/types";
import { formatDate, formatTime, formatPrice, getPriceCategoryColor, getWeatherIconUrl } from "@/lib/utils";

interface ConcertCardProps {
  event: EventWithRelations;
}

export default function ConcertCard({ event }: ConcertCardProps) {
  const priceColor = getPriceCategoryColor(event.priceCategory);
  const weatherIcon = event.weather?.icon ? getWeatherIconUrl(event.weather.icon) : null;
  const showWeatherWarning = event.isOutdoor && event.weather && event.weather.severity !== "none";

  return (
    <Link href={`/event/${event.id}`}>
      <div className="group relative overflow-hidden rounded-xl bg-gray-900 border border-gray-800 hover:border-purple-500/50 transition-all duration-300 cursor-pointer h-[360px]">
        {/* Artist Cover Photo */}
        <div className="absolute inset-0">
          {event.artist?.imageUrl ? (
            <img
              src={event.artist.imageUrl}
              alt={event.artistName}
              className="w-full h-full object-cover opacity-60 group-hover:opacity-75 group-hover:scale-105 transition-all duration-500"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-purple-900/50 to-gray-900" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
        </div>

        {/* Weather Warning Badge */}
        {showWeatherWarning && (
          <div
            className={`absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${
              event.weather!.severity === "severe"
                ? "bg-red-600/90 text-white"
                : "bg-yellow-500/90 text-black"
            }`}
          >
            {weatherIcon && (
              <img src={weatherIcon} alt="" className="w-5 h-5" />
            )}
            {event.weather!.severity === "severe" ? "Severe Weather" : "Rain Expected"}
          </div>
        )}

        {/* Outdoor Weather Info (non-warning) */}
        {event.isOutdoor && event.weather && event.weather.severity === "none" && (
          <div className="absolute top-3 right-3 flex items-center gap-1 text-xs text-gray-300 bg-black/50 rounded-full px-2 py-1">
            {weatherIcon && <img src={weatherIcon} alt="" className="w-5 h-5" />}
            <span>{event.weather.tempHigh ? `${Math.round(event.weather.tempHigh)}°` : ""}</span>
          </div>
        )}

        {/* Content */}
        <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2">
          <h3 className="text-xl font-bold text-white truncate">{event.artistName}</h3>
          <p className="text-sm text-gray-300">{event.venueName}</p>
          <div className="flex items-center justify-between">
            <span className="text-sm text-purple-300">
              {formatDate(event.date)} &middot; {formatTime(event.time)}
            </span>
          </div>

          {/* Price Bar */}
          <div className="space-y-1">
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-400">{formatPrice(event.priceMin, event.priceMax)}</span>
            </div>
            <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  backgroundColor: priceColor,
                  width: event.priceCategory === "red" ? "100%" : event.priceCategory === "yellow" ? "66%" : "33%",
                }}
              />
            </div>
          </div>

          {/* Buy Tickets Button */}
          {event.ticketUrl && (
            <button
              onClick={(e) => {
                e.preventDefault();
                window.open(event.ticketUrl!, "_blank");
              }}
              className="w-full mt-2 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              Buy Tickets
            </button>
          )}
        </div>
      </div>
    </Link>
  );
}
