"use client";

import { useState, useEffect, useCallback } from "react";
import ConcertCard from "@/components/ConcertCard";
import FilterBar, { FilterState } from "@/components/FilterBar";
import { EventWithRelations } from "@/types";

export default function HomePage() {
  const [events, setEvents] = useState<EventWithRelations[]>([]);
  const [venues, setVenues] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    venue: "",
    dateFrom: "",
    dateTo: "",
    priceCategory: "",
  });

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.search) params.set("search", filters.search);
    if (filters.venue) params.set("venue", filters.venue);
    if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
    if (filters.dateTo) params.set("dateTo", filters.dateTo);
    if (filters.priceCategory) params.set("priceCategory", filters.priceCategory);

    try {
      const res = await fetch(`/api/events?${params.toString()}`);
      const data = await res.json();
      setEvents(data);

      // Extract unique venues for filter dropdown
      const uniqueVenues = [...new Set(data.map((e: EventWithRelations) => e.venueName))] as string[];
      setVenues(uniqueVenues);
    } catch (error) {
      console.error("Failed to fetch events:", error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    const debounce = setTimeout(fetchEvents, 300);
    return () => clearTimeout(debounce);
  }, [fetchEvents]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Hero */}
      <div className="text-center mb-10">
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent mb-3">
          Live Music in Wilmington
        </h1>
        <p className="text-gray-400 text-lg">
          {loading ? "Loading..." : `${events.length} upcoming shows`}
        </p>
      </div>

      {/* Filters */}
      <div className="mb-8">
        <FilterBar venues={venues} onFilterChange={setFilters} />
      </div>

      {/* Event Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-[360px] rounded-xl bg-gray-900 animate-pulse" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-2xl text-gray-500 mb-2">No shows found</p>
          <p className="text-gray-600">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {events.map((event) => (
            <ConcertCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
}
