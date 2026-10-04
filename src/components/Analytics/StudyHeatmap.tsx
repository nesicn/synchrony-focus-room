import React, { useMemo, useState } from 'react';
import { AcademicSessionItem } from '../../types/academic';
import { ThemeConfig } from '../../theme';
import { Flame, Calendar, Award } from 'lucide-react';

interface StudyHeatmapProps {
  sessionsHistory: AcademicSessionItem[];
  weeksCount?: number;
  showStats?: boolean;
  t: ThemeConfig;
}

export const StudyHeatmap: React.FC<StudyHeatmapProps> = ({
  sessionsHistory,
  weeksCount = 52,
  showStats = true,
  t,
}) => {
  const [hoveredDay, setHoveredDay] = useState<{
    dateStr: string;
    formattedDate: string;
    minutes: number;
    sessions: number;
    x: number;
    y: number;
  } | null>(null);

  // Group durations by YYYY-MM-DD
  const dailyFocusMap = useMemo(() => {
    const map: Record<string, { duration: number; count: number }> = {};
    sessionsHistory.forEach((session) => {
      try {
        const d = new Date(session.date);
        const key = d.toISOString().slice(0, 10);
        if (!map[key]) {
          map[key] = { duration: 0, count: 0 };
        }
        map[key].duration += session.duration;
        map[key].count += 1;
      } catch (e) {
        // ignore invalid dates
      }
    });
    return map;
  }, [sessionsHistory]);

  // Generate grid matrix for the last `weeksCount` weeks
  const { weeks, monthLabels, totalActiveDays, currentStreak, maxStreak } = useMemo(() => {
    const today = new Date();
    // End on the coming Sunday of this week so the grid aligns with days of week
    const currentDayOfWeek = (today.getDay() + 6) % 7; // 0: Mon, 6: Sun
    const endDate = new Date(today);
    endDate.setDate(today.getDate() + (6 - currentDayOfWeek));

    const totalDays = weeksCount * 7;
    const startDate = new Date(endDate);
    startDate.setDate(endDate.getDate() - totalDays + 1);

    const generatedWeeks: Array<
      Array<{
        date: Date;
        dateStr: string;
        formattedDate: string;
        minutes: number;
        sessionsCount: number;
        intensity: 0 | 1 | 2 | 3 | 4;
        isToday: boolean;
      }>
    > = [];

    const months: Array<{ label: string; weekIndex: number }> = [];
    let lastMonth = -1;
    let activeDaysCount = 0;

    let curDate = new Date(startDate);
    const todayStr = today.toISOString().slice(0, 10);

    for (let w = 0; w < weeksCount; w++) {
      const currentWeekDays = [];
      for (let d = 0; d < 7; d++) {
        const dateStr = curDate.toISOString().slice(0, 10);
        const dayMonth = curDate.getMonth();

        // Only register month label on the first day of the week that lands in a new month
        if (d === 0 && dayMonth !== lastMonth) {
          months.push({
            label: curDate.toLocaleDateString('tr-TR', { month: 'short' }),
            weekIndex: w,
          });
          lastMonth = dayMonth;
        }

        const data = dailyFocusMap[dateStr] || { duration: 0, count: 0 };
        const minutes = Math.round(data.duration / 60);

        if (minutes > 0) {
          activeDaysCount++;
        }

        let intensity: 0 | 1 | 2 | 3 | 4 = 0;
        if (minutes > 0 && minutes < 25) intensity = 1;
        else if (minutes >= 25 && minutes < 50) intensity = 2;
        else if (minutes >= 50 && minutes < 100) intensity = 3;
        else if (minutes >= 100) intensity = 4;

        currentWeekDays.push({
          date: new Date(curDate),
          dateStr,
          formattedDate: curDate.toLocaleDateString('tr-TR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            weekday: 'long',
          }),
          minutes,
          sessionsCount: data.count,
          intensity,
          isToday: dateStr === todayStr,
        });

        curDate.setDate(curDate.getDate() + 1);
      }
      generatedWeeks.push(currentWeekDays);
    }

    // Calculate streaks
    let curStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    // Check from today backwards
    let checkDate = new Date(today);
    while (true) {
      const dStr = checkDate.toISOString().slice(0, 10);
      if (dailyFocusMap[dStr] && dailyFocusMap[dStr].duration > 0) {
        curStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        // If today has no study yet, check yesterday
        if (checkDate.toISOString().slice(0, 10) === todayStr) {
          checkDate.setDate(checkDate.getDate() - 1);
          continue;
        }
        break;
      }
    }

    // Longest streak in generated range
    let scanDate = new Date(startDate);
    while (scanDate <= endDate) {
      const dStr = scanDate.toISOString().slice(0, 10);
      if (dailyFocusMap[dStr] && dailyFocusMap[dStr].duration > 0) {
        tempStreak++;
        if (tempStreak > longestStreak) longestStreak = tempStreak;
      } else {
        tempStreak = 0;
      }
      scanDate.setDate(scanDate.getDate() + 1);
    }

    return {
      weeks: generatedWeeks,
      monthLabels: months,
      totalActiveDays: activeDaysCount,
      currentStreak: curStreak,
      maxStreak: longestStreak,
    };
  }, [dailyFocusMap, weeksCount]);

  const getCellColor = (intensity: number, isToday: boolean) => {
    switch (intensity) {
      case 1:
        return 'bg-emerald-500/35 border-emerald-500/40 hover:ring-1 hover:ring-emerald-400';
      case 2:
        return 'bg-emerald-500/60 border-emerald-500/70 hover:ring-1 hover:ring-emerald-400';
      case 3:
        return 'bg-emerald-500/85 border-emerald-600 hover:ring-1 hover:ring-emerald-400';
      case 4:
        return 'bg-emerald-600 border-emerald-700 shadow-xs hover:ring-1 hover:ring-emerald-300';
      default:
        return isToday
          ? 'bg-zinc-200/60 dark:bg-zinc-800/60 border-blue-500/60 ring-1 ring-blue-500/40'
          : 'bg-zinc-200/35 dark:bg-zinc-800/35 border-zinc-200/20 dark:border-zinc-800/20';
    }
  };

  const dayLabels = [
    { label: 'Pzt', index: 0 },
    { label: '', index: 1 },
    { label: 'Çar', index: 2 },
    { label: '', index: 3 },
    { label: 'Cum', index: 4 },
    { label: '', index: 5 },
    { label: 'Paz', index: 6 },
  ];

  return (
    <div className="flex flex-col gap-3 w-full relative">
      {/* Top Header & Streak Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-zinc-200/15">
        <div>
          <div className="flex items-center gap-2">
            <Calendar className={`w-4 h-4 ${t.primaryText}`} />
            <h3 className={`text-xs font-bold uppercase tracking-wider ${t.primaryText}`}>
              Çalışma Isı Haritası (Study Heatmap)
            </h3>
          </div>
          <p className={`text-[11px] ${t.secondaryText}`}>
            GitHub katkı grafiği mantığında {weeksCount} haftalık (365 gün) derin çalışma yoğunluğu
          </p>
        </div>

        {/* Heatmap Legend & Stats */}
        <div className="flex flex-wrap items-center gap-4 text-xs">
          {showStats && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5" title="Son 1 yılda odaklanılan toplam gün sayısı">
                <span className={`text-[10px] font-bold uppercase ${t.secondaryText}`}>Aktif Gün:</span>
                <span className={`font-mono font-bold ${t.primaryText}`}>{totalActiveDays} gün</span>
              </div>
              <div className="flex items-center gap-1.5 text-amber-500 font-bold" title="Kesintisiz günlük çalışma serisi">
                <Flame className="w-3.5 h-3.5 fill-current" />
                <span className="font-mono text-xs">{currentStreak} Gün Seri</span>
              </div>
            </div>
          )}

          {/* Color Scale Legend */}
          <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 select-none">
            <span>Az</span>
            <div className="w-2.5 h-2.5 rounded-xs bg-zinc-200/35 dark:bg-zinc-800/35 border border-zinc-300/20" />
            <div className="w-2.5 h-2.5 rounded-xs bg-emerald-500/35" />
            <div className="w-2.5 h-2.5 rounded-xs bg-emerald-500/60" />
            <div className="w-2.5 h-2.5 rounded-xs bg-emerald-500/85" />
            <div className="w-2.5 h-2.5 rounded-xs bg-emerald-600" />
            <span>Çok</span>
          </div>
        </div>
      </div>

      {/* Responsive Full-Width Grid Wrapper */}
      <div className="w-full overflow-x-auto pb-2 custom-scrollbar">
        <div className="min-w-[700px] w-full flex flex-col">
          {/* Main Heatmap Matrix: Day Labels + Week Columns spreading 100% width */}
          <div className="flex items-start w-full gap-2">
            {/* Day of Week Labels (Fixed Left) */}
            <div className="w-6 shrink-0 flex flex-col justify-between pt-5 pb-0.5 text-[8px] font-mono text-zinc-400 select-none" style={{ height: 'calc(7 * 14px + 6 * 3px + 20px)' }}>
              {dayLabels.map((day, idx) => (
                <div key={idx} className="h-[14px] flex items-center justify-end pr-1 leading-none">
                  {day.label}
                </div>
              ))}
            </div>

            {/* 52 Week Columns Container taking 100% remaining width */}
            <div className="flex-1 w-full flex flex-col min-w-0">
              {/* Month Labels Bar (Positioned proportionally over the 52 weeks) */}
              <div className="relative h-4 w-full mb-1 text-[9px] font-semibold text-zinc-400 select-none">
                {monthLabels.map((m, idx) => {
                  const leftPercent = (m.weekIndex / weeksCount) * 100;
                  return (
                    <span
                      key={idx}
                      style={{ left: `${leftPercent}%` }}
                      className="absolute transform -translate-x-0.5"
                    >
                      {m.label}
                    </span>
                  );
                })}
              </div>

              {/* 52 Week Columns distributed evenly across 100% width using CSS Grid */}
              <div
                className="grid grid-flow-col grid-rows-7 gap-[2.5px] sm:gap-[3px] w-full"
                style={{
                  gridTemplateColumns: `repeat(${weeksCount}, minmax(0, 1fr))`,
                  gridTemplateRows: `repeat(7, 14px)`,
                }}
              >
                {weeks.flatMap((week) =>
                  week.map((day) => (
                    <div
                      key={day.dateStr}
                      onMouseEnter={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setHoveredDay({
                          dateStr: day.dateStr,
                          formattedDate: day.formattedDate,
                          minutes: day.minutes,
                          sessions: day.sessionsCount,
                          x: rect.left + rect.width / 2,
                          y: rect.top,
                        });
                      }}
                      onMouseLeave={() => setHoveredDay(null)}
                      className={`w-full h-[14px] rounded-xs border transition-transform hover:scale-125 hover:z-20 cursor-pointer ${getCellColor(
                        day.intensity,
                        day.isToday
                      )}`}
                    />
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Hover Tooltip */}
      {hoveredDay && (
        <div
          className="fixed z-50 pointer-events-none -translate-x-1/2 -translate-y-full px-3 py-2 rounded-xl bg-zinc-950 text-white text-xs font-medium shadow-2xl border border-zinc-700/80 whitespace-nowrap animate-in fade-in zoom-in-95 duration-150"
          style={{
            left: `${hoveredDay.x}px`,
            top: `${hoveredDay.y - 10}px`,
          }}
        >
          <div className="font-bold text-emerald-400 text-[11px] mb-0.5">
            {hoveredDay.formattedDate}
          </div>
          <div className="text-[10px] text-zinc-300">
            {hoveredDay.minutes > 0 ? (
              <>
                <span className="font-mono font-bold text-white">{hoveredDay.minutes} dakika</span>{' '}
                odaklanma • <span className="font-bold text-zinc-100">{hoveredDay.sessions} oturum</span>
              </>
            ) : (
              'Bu günde kayıtlı çalışma yok'
            )}
          </div>
        </div>
      )}
    </div>
  );
};
