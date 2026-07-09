/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { useKult } from "../providers";
import { ChevronDown, BarChart3, TrendingUp, Inbox, CheckSquare, Activity } from "lucide-react";

export const StatisticsPage: React.FC = () => {
  const { items, types } = useKult();

  // Filter States
  const [selectedTypeId, setSelectedTypeId] = useState<string>("all");
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());

  // Get completed items
  const completedItems = useMemo(() => {
    return items.filter((item) => item.status === "completed");
  }, [items]);

  // Extract all completed years for dropdown selection
  const yearsList = useMemo(() => {
    const yearsSet = new Set<string>();
    // Always include current year
    yearsSet.add(new Date().getFullYear().toString());
    completedItems.forEach((item) => {
      if (item.completedDate) {
        const yr = item.completedDate.split("-")[0];
        if (yr && !isNaN(Number(yr))) {
          yearsSet.add(yr);
        }
      }
    });
    return Array.from(yearsSet).sort((a, b) => b.localeCompare(a));
  }, [completedItems]);

  // General counts
  const totalCompletedAllTime = completedItems.length;
  
  const totalCompletedInSelectedYear = useMemo(() => {
    return completedItems.filter((item) => {
      if (!item.completedDate) return false;
      const yr = item.completedDate.split("-")[0];
      return yr === selectedYear || selectedYear === "all";
    }).length;
  }, [completedItems, selectedYear]);

  const totalCompletedInCurrentYear = useMemo(() => {
    const curYear = new Date().getFullYear().toString();
    return completedItems.filter((item) => {
      if (!item.completedDate) return false;
      return item.completedDate.startsWith(curYear);
    }).length;
  }, [completedItems]);

  // Backlog and ongoing counts
  const backlogCount = useMemo(() => {
    return items.filter((i) => i.status === "to_complete").length;
  }, [items]);

  const ongoingCount = useMemo(() => {
    return items.filter((i) => i.status === "ongoing").length;
  }, [items]);

  // 1. Completed per category chart data (filtered by year)
  const categoryChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    // Pre-populate with all types
    types.forEach((t) => {
      counts[t.label] = 0;
    });

    completedItems.forEach((item) => {
      const itemYear = item.completedDate?.split("-")[0];
      if (selectedYear === "all" || itemYear === selectedYear) {
        counts[item.typeLabel] = (counts[item.typeLabel] || 0) + 1;
      }
    });

    return Object.entries(counts).map(([label, value]) => ({
      label,
      value,
    }));
  }, [completedItems, types, selectedYear]);

  // 2. Average completed per month calculation (respecting rules)
  const averageCompletedPerMonth = useMemo(() => {
    // Filter completed items of selected type
    const matchingCompleted = completedItems.filter((item) => {
      return selectedTypeId === "all" || item.typeId === selectedTypeId;
    });

    if (matchingCompleted.length === 0) return 0;

    // Parse dates
    const dates = matchingCompleted
      .map((item) => (item.completedDate ? new Date(item.completedDate) : null))
      .filter((d): d is Date => d !== null && !isNaN(d.getTime()))
      .sort((a, b) => a.getTime() - b.getTime());

    if (dates.length === 0) return 0;

    const firstCompletedDate = dates[0];
    const today = new Date();

    let startYear = firstCompletedDate.getFullYear();
    let startMonth = firstCompletedDate.getMonth();
    let endYear = today.getFullYear();
    let endMonth = today.getMonth();

    // Adjust boundaries based on year selection
    if (selectedYear !== "all") {
      const selYrNum = Number(selectedYear);
      
      // If first completion was AFTER the selected year, no data
      if (startYear > selYrNum) {
        return 0;
      }
      
      // If first completion was in the selected year, start at that completion month
      if (startYear === selYrNum) {
        // start stays same
      } else {
        // Start of selected year
        startYear = selYrNum;
        startMonth = 0;
      }

      // If selected year is in the future, return 0
      if (selYrNum > today.getFullYear()) {
        return 0;
      }

      // If selected year is the current year, end at current month.
      // Otherwise end at December of selected year.
      if (selYrNum === today.getFullYear()) {
        endYear = today.getFullYear();
        endMonth = today.getMonth();
      } else {
        endYear = selYrNum;
        endMonth = 11;
      }
    }

    // Number of active months in this range
    const activeMonths = (endYear - startYear) * 12 + (endMonth - startMonth) + 1;
    if (activeMonths <= 0) return 0;

    // Count completions of selected type in this active range
    const completionsInPeriod = matchingCompleted.filter((item) => {
      if (!item.completedDate) return false;
      const date = new Date(item.completedDate);
      const year = date.getFullYear();
      const month = date.getMonth();

      const itemPeriodCode = year * 12 + month;
      const startPeriodCode = startYear * 12 + startMonth;
      const endPeriodCode = endYear * 12 + endMonth;

      return itemPeriodCode >= startPeriodCode && itemPeriodCode <= endPeriodCode;
    }).length;

    const avg = completionsInPeriod / activeMonths;
    return isNaN(avg) || !isFinite(avg) ? 0 : avg;
  }, [completedItems, selectedTypeId, selectedYear]);

  // 3. Monthly Completions Chart for selected year
  const monthlyChartData = useMemo(() => {
    const monthNames = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];

    const currentYearNum = new Date().getFullYear();
    const currentMonthNum = new Date().getMonth();
    const isCurYear = selectedYear === new Date().getFullYear().toString();

    // Initializing structure
    const monthsData = monthNames.map((name, idx) => {
      // Determine if this month is in the future for current year
      const isFuture = isCurYear && idx > currentMonthNum;
      return {
        label: name,
        value: 0,
        isFuture,
      };
    });

    completedItems.forEach((item) => {
      if (!item.completedDate) return;
      
      const parts = item.completedDate.split("-");
      const itemYear = parts[0];
      const itemMonthIdx = Number(parts[1]) - 1;

      if (itemYear === selectedYear && itemMonthIdx >= 0 && itemMonthIdx < 12) {
        // Also check category filter for the monthly chart
        if (selectedTypeId === "all" || item.typeId === selectedTypeId) {
          monthsData[itemMonthIdx].value += 1;
        }
      }
    });

    return monthsData;
  }, [completedItems, selectedYear, selectedTypeId]);

  // Custom SVG Bar Chart - Category Completions
  const maxCategoryValue = Math.max(...categoryChartData.map((d) => d.value), 1);
  // Custom SVG Bar Chart - Monthly Completions
  const maxMonthlyValue = Math.max(...monthlyChartData.map((d) => d.value), 1);

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50" id="stats-title">
          Statistics
        </h1>
      </div>

      {/* Interactive Filter Box */}
      <div className="bg-black/5 dark:bg-white/5 p-6 rounded-[32px] space-y-4 transition-colors duration-200">
        <span className="text-[10px] uppercase font-black tracking-widest text-zinc-400 dark:text-zinc-500">
          Analytics Filter
        </span>
        <div className="grid grid-cols-2 gap-4">
          {/* Category Dropdown */}
          <div className="relative">
            <select
              value={selectedTypeId}
              onChange={(e) => setSelectedTypeId(e.target.value)}
              className="w-full pl-4 pr-10 py-3.5 rounded-2xl bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 text-zinc-950 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white appearance-none text-sm font-bold shadow-sm"
              id="stats-category-filter"
            >
              <option value="all">All Categories</option>
              {types.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
            <span className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400">
              <ChevronDown className="w-4 h-4" />
            </span>
          </div>

          {/* Year Dropdown */}
          <div className="relative">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full pl-4 pr-10 py-3.5 rounded-2xl bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 text-zinc-950 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white appearance-none text-sm font-bold shadow-sm"
              id="stats-year-filter"
            >
              <option value="all">All Time</option>
              {yearsList.map((yr) => (
                <option key={yr} value={yr}>
                  Year {yr}
                </option>
              ))}
            </select>
            <span className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400">
              <ChevronDown className="w-4 h-4" />
            </span>
          </div>
        </div>
      </div>

      {/* Bento Grid Stats Cards */}
      <div className="grid grid-cols-2 gap-3" id="stats-bento-grid">
        <div className="bg-black/5 dark:bg-white/5 p-4 rounded-2xl flex flex-col justify-between space-y-3">
          <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <CheckSquare className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[9px] uppercase font-black tracking-widest text-zinc-400 dark:text-zinc-500 block">
              Completions
            </span>
            <span className="text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-50 block mt-1">
              {totalCompletedInSelectedYear}
            </span>
            <span className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 mt-1 block">
              {selectedYear === "all" ? "All-time total" : `In ${selectedYear}`}
            </span>
          </div>
        </div>

        <div className="bg-black/5 dark:bg-white/5 p-4 rounded-2xl flex flex-col justify-between space-y-3">
          <div className="w-8 h-8 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[9px] uppercase font-black tracking-widest text-zinc-400 dark:text-zinc-500 block">
              Monthly Avg
            </span>
            <span className="text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-50 block mt-1">
              {averageCompletedPerMonth.toFixed(1)}
            </span>
            <span className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 mt-1 block">
              Items / month
            </span>
          </div>
        </div>

        <div className="bg-black/5 dark:bg-white/5 p-4 rounded-2xl flex flex-col justify-between space-y-3">
          <div className="w-8 h-8 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <Inbox className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[9px] uppercase font-black tracking-widest text-zinc-400 dark:text-zinc-500 block">
              In Backlog
            </span>
            <span className="text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-50 block mt-1">
              {backlogCount}
            </span>
            <span className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 mt-1 block">
              Waiting items
            </span>
          </div>
        </div>

        <div className="bg-black/5 dark:bg-white/5 p-4 rounded-2xl flex flex-col justify-between space-y-3">
          <div className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[9px] uppercase font-black tracking-widest text-zinc-400 dark:text-zinc-500 block">
              Ongoing
            </span>
            <span className="text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-50 block mt-1">
              {ongoingCount}
            </span>
            <span className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 mt-1 block">
              Currently active
            </span>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 gap-6">
        
        {/* 1. Monthly Completion Chart */}
        <div className="bg-black/5 dark:bg-white/5 p-6 sm:p-8 rounded-[32px] transition-colors duration-200 space-y-6">
          <div>
            <span className="text-[10px] uppercase font-black tracking-widest text-zinc-400 dark:text-zinc-500">
              Completed Per Month
            </span>
            <h3 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mt-1">
              {selectedYear === "all" ? "Monthly completions (All time)" : `Completions in ${selectedYear}`}
            </h3>
          </div>

          {/* SVG Custom Responsive Bar Chart */}
          <div className="w-full h-48 bg-white dark:bg-black/20 rounded-2xl p-4 flex flex-col justify-between border border-zinc-100 dark:border-zinc-900 shadow-sm">
            <div className="flex-1 flex items-end justify-between gap-1.5 h-32 pt-2">
              {monthlyChartData.map((d, idx) => {
                const pct = (d.value / maxMonthlyValue) * 100;
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center group h-full justify-end relative">
                    {/* Tooltip on Hover */}
                    <div className="absolute bottom-full mb-1.5 opacity-0 group-hover:opacity-100 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold text-[10px] px-2 py-1 rounded shadow-md pointer-events-none transition-opacity duration-150 z-20 whitespace-nowrap">
                      {d.value} completed
                    </div>
                    
                    {/* Bar */}
                    <div 
                      className={`w-full rounded-t-lg transition-all duration-500 ${
                        d.isFuture 
                          ? "bg-zinc-100 dark:bg-zinc-800"
                          : d.value > 0 
                            ? "bg-black dark:bg-white" 
                            : "bg-zinc-50 dark:bg-zinc-900"
                      }`}
                      style={{ height: `${Math.max(4, pct)}%` }}
                    />
                  </div>
                );
              })}
            </div>

            {/* X Axis Labels */}
            <div className="flex justify-between text-[9px] font-bold text-zinc-400 dark:text-zinc-500 mt-2 border-t border-zinc-100 dark:border-zinc-900 pt-2">
              {monthlyChartData.map((d, idx) => (
                <span key={idx} className="flex-1 text-center">
                  {d.label}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* 2. Completed Per Category Chart */}
        <div className="bg-black/5 dark:bg-white/5 p-6 sm:p-8 rounded-[32px] transition-colors duration-200 space-y-6">
          <div>
            <span className="text-[10px] uppercase font-black tracking-widest text-zinc-400 dark:text-zinc-500">
              Completed Per Category
            </span>
            <h3 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mt-1">
              Distribution of completions
            </h3>
          </div>

          <div className="bg-white dark:bg-black/20 rounded-2xl p-6 border border-zinc-100 dark:border-zinc-900 shadow-sm space-y-4">
            {categoryChartData.map((d, idx) => {
              const pct = (d.value / maxCategoryValue) * 100;
              return (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-zinc-700 dark:text-zinc-300">{d.label}</span>
                    <span className="text-zinc-500 dark:text-zinc-400">{d.value}</span>
                  </div>
                  <div className="h-3 w-full bg-zinc-100 dark:bg-zinc-900 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-black dark:bg-white rounded-full transition-all duration-500"
                      style={{ width: `${d.value > 0 ? Math.max(4, pct) : 0}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
};
