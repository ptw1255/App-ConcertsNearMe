"use client";

import { useState } from "react";

interface FilterBarProps {
  venues: string[];
  onFilterChange: (filters: FilterState) => void;
}

export interface FilterState {
  search: string;
  venue: string;
  dateFrom: string;
  dateTo: string;
  priceCategory: string;
}

export default function FilterBar({ venues, onFilterChange }: FilterBarProps) {
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    venue: "",
    dateFrom: "",
    dateTo: "",
    priceCategory: "",
  });

  function updateFilter(key: keyof FilterState, value: string) {
    const updated = { ...filters, [key]: value };
    setFilters(updated);
    onFilterChange(updated);
  }

  function clearFilters() {
    const cleared: FilterState = { search: "", venue: "", dateFrom: "", dateTo: "", priceCategory: "" };
    setFilters(cleared);
    onFilterChange(cleared);
  }

  const hasActiveFilters = Object.values(filters).some((v) => v !== "");

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          type="text"
          placeholder="Search artists, venues..."
          value={filters.search}
          onChange={(e) => updateFilter("search", e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
        />
      </div>

      {/* Filter Row */}
      <div className="flex flex-wrap gap-3">
        {/* Venue */}
        <select
          value={filters.venue}
          onChange={(e) => updateFilter("venue", e.target.value)}
          className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500"
        >
          <option value="">All Venues</option>
          {venues.map((v) => (
            <option key={v} value={v}>{v}</option>
          ))}
        </select>

        {/* Date From */}
        <input
          type="date"
          value={filters.dateFrom}
          onChange={(e) => updateFilter("dateFrom", e.target.value)}
          className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500"
        />

        {/* Date To */}
        <input
          type="date"
          value={filters.dateTo}
          onChange={(e) => updateFilter("dateTo", e.target.value)}
          className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500"
        />

        {/* Price Category */}
        <select
          value={filters.priceCategory}
          onChange={(e) => updateFilter("priceCategory", e.target.value)}
          className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500"
        >
          <option value="">All Prices</option>
          <option value="green">$ Budget</option>
          <option value="yellow">$$ Moderate</option>
          <option value="red">$$$ Premium</option>
        </select>

        {/* Clear */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="px-4 py-2 text-sm text-purple-400 hover:text-purple-300 transition-colors"
          >
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
}
