import React, { useState, useMemo } from 'react';
import { History, Trash2, Calendar, Clock, X, BarChart3, Tag, Zap, Award, Flame, ChevronRight } from 'lucide-react';
import { ThemeConfig } from '../theme';
import { StudyHeatmap } from './Analytics/StudyHeatmap';

export interface SessionItem {
  id: string;
  date: string;
  task: string;
  duration: number;
  courseId?: string;
  courseName?: string;
  courseColor?: string;
}

interface SessionHistoryPanelProps {
  sessionsHistory: SessionItem[];
  onClearHistory: () => void;
  onDeleteSession: (id: string) => void;
  t: ThemeConfig;
}

export function SessionHistoryPanel({
  sessionsHistory,
  onClearHistory,
  onDeleteSession,
  t
}: SessionHistoryPanelProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState<'sessions' | 'insights'>('sessions');

  const formatSessionDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      
      const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      // Check if it's today
      if (date.toDateString() === now.toDateString()) {
        return `Today at ${timeStr}`;
      }
      
      // Check if it's yesterday
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      if (date.toDateString() === yesterday.toDateString()) {
        return `Yesterday at ${timeStr}`;
      }

      // Check if it's within the same year
      if (date.getFullYear() === now.getFullYear()) {
        const dateStr = date.toLocaleDateString([], { month: 'short', day: 'numeric' });
        return `${dateStr} at ${timeStr}`;
      }

      // Otherwise show full date
      const dateStr = date.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
      return `${dateStr} at ${timeStr}`;
    } catch (e) {
      return 'Completed Session';
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (secs === 0) {
      return `${mins}m`;
    }
    return `${mins}m ${secs}s`;
  };

  const totalFocusSeconds = sessionsHistory.reduce((sum, item) => sum + item.duration, 0);
  
  const formatTotalTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    if (mins < 60) {
      return `${mins}m`;
    }
    const hrs = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    if (remainingMins === 0) {
      return `${hrs}h`;
    }
    return `${hrs}h ${remainingMins}m`;
  };

  // Group durations by course color for the graphic chart
  const courseGroupStats = useMemo(() => {
    const map: Record<string, { name: string; color: string; duration: number; count: number }> = {};
    sessionsHistory.forEach(s => {
      const key = s.courseName || 'Genel';
      const color = s.courseColor || '#71717A';
      if (!map[key]) {
        map[key] = { name: key, color, duration: 0, count: 0 };
      }
      map[key].duration += s.duration;
      map[key].count += 1;
    });
    return Object.values(map).sort((a, b) => b.duration - a.duration);
  }, [sessionsHistory]);

  // Efficiency Correlation & Summary Reports
  const efficiencyMetrics = useMemo(() => {
    if (sessionsHistory.length === 0) {
      return {
        weeklySeconds: 0,
        topWeekCourse: null,
        bestHour: null,
      };
    }

    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const thisWeekSessions = sessionsHistory.filter((s) => {
      try {
        return new Date(s.date) >= oneWeekAgo;
      } catch {
        return false;
      }
    });

    const weeklySeconds = thisWeekSessions.reduce((sum, s) => sum + s.duration, 0);

    // Top course this week
    const weekCourseMap: Record<string, { name: string; color: string; duration: number }> = {};
    thisWeekSessions.forEach((s) => {
      const name = s.courseName || 'Genel Odaklanma';
      const color = s.courseColor || '#3B82F6';
      if (!weekCourseMap[name]) weekCourseMap[name] = { name, color, duration: 0 };
      weekCourseMap[name].duration += s.duration;
    });

    // Best productivity hours in 2-hour buckets across 24 hours
    const hourBuckets: Record<string, number> = {
      '00:00 - 02:00': 0,
      '02:00 - 04:00': 0,
      '04:00 - 06:00': 0,
      '06:00 - 08:00': 0,
      '08:00 - 10:00': 0,
      '10:00 - 12:00': 0,
      '12:00 - 14:00': 0,
      '14:00 - 16:00': 0,
      '16:00 - 18:00': 0,
      '18:00 - 20:00': 0,
      '20:00 - 22:00': 0,
      '22:00 - 24:00': 0,
    };

    sessionsHistory.forEach((s) => {
      try {
        const h = new Date(s.date).getHours();
        const bucketStart = Math.floor(h / 2) * 2;
        const bucketEnd = bucketStart + 2;
        const key = `${bucketStart.toString().padStart(2, '0')}:00 - ${bucketEnd.toString().padStart(2, '0')}:00`;
        if (hourBuckets[key] !== undefined) {
          hourBuckets[key] += s.duration;
        }
      } catch {}
    });

    let bestHour: string | null = null;
    let maxHourSec = 0;
    Object.entries(hourBuckets).forEach(([bucket, sec]) => {
      if (sec > maxHourSec && sec > 0) {
        maxHourSec = sec;
        bestHour = bucket;
      }
    });

    const topWeekCourse =
      thisWeekSessions.length > 0 && weeklySeconds > 0
        ? Object.values(weekCourseMap).sort((a, b) => b.duration - a.duration)[0] || null
        : null;

    return {
      weeklySeconds,
      topWeekCourse,
      bestHour,
    };
  }, [sessionsHistory]);

  const handleClearAll = () => {
    if (showConfirm) {
      onClearHistory();
      setShowConfirm(false);
    } else {
      setShowConfirm(true);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className={`p-4 md:p-6 border-b shrink-0 flex items-center justify-between transition-colors duration-500 ${t.border}`}>
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border transition-colors ${t.borderMuted} ${t.primaryText}`}>
            <History className="w-4 h-4" />
          </div>
          <div>
            <div className={`text-xs font-bold uppercase tracking-wide transition-colors ${t.primaryText}`}>Focus History</div>
            <div className={`text-[10px] flex items-center gap-1 transition-colors ${t.secondaryText}`}>
              Geçmiş Oturumlar & Verimlilik
            </div>
          </div>
        </div>

        {sessionsHistory.length > 0 && (
          <div className="flex items-center gap-2">
            {showConfirm ? (
              <div className="flex items-center gap-1">
                <button
                  onClick={handleClearAll}
                  className="px-2 py-1 text-[10px] font-bold uppercase rounded bg-red-500 text-white hover:bg-red-600 transition-colors"
                >
                  Confirm Clear
                </button>
                <button
                  onClick={() => setShowConfirm(false)}
                  className={`px-2 py-1 text-[10px] font-bold uppercase rounded border transition-colors ${t.border} ${t.primaryText} hover:bg-black/5`}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowConfirm(true)}
                className={`p-2 rounded-xl transition-all border bg-transparent opacity-60 hover:opacity-100 ${t.border} ${t.primaryText} hover:bg-opacity-10`}
                title="Clear all sessions"
                aria-label="Clear all focus history"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Sub-Tabs: Oturumlar vs Verimlilik Raporları */}
      <div className={`px-4 py-2 border-b flex items-center gap-1 bg-black/[0.01] ${t.border}`}>
        <button
          onClick={() => setActiveTab('sessions')}
          className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
            activeTab === 'sessions'
              ? `${t.cardBg} ${t.primaryText} shadow-xs font-bold`
              : `${t.secondaryText} hover:${t.primaryText}`
          }`}
        >
          Oturum Listesi
        </button>
        <button
          onClick={() => setActiveTab('insights')}
          className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
            activeTab === 'insights'
              ? `${t.cardBg} ${t.primaryText} shadow-xs font-bold`
              : `${t.secondaryText} hover:${t.primaryText}`
          }`}
        >
          Verimlilik & Isı Haritası
        </button>
      </div>

      {activeTab === 'insights' ? (
        <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar flex flex-col gap-4">
          {/* Study Heatmap */}
          <div className={`p-4 rounded-2xl border ${t.border} bg-black/[0.01]`}>
            <StudyHeatmap sessionsHistory={sessionsHistory} weeksCount={14} t={t} />
          </div>

          {/* Efficiency Correlation Summary Cards */}
          <div className="space-y-2.5">
            {/* Best Productivity Hours */}
            <div className={`p-3.5 rounded-xl border flex items-center justify-between ${t.border} bg-black/[0.01]`}>
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <div className={`text-[10px] font-bold uppercase tracking-wider ${t.secondaryText}`}>
                    En Verimli Saat Aralığı
                  </div>
                  <div className={`text-xs font-bold font-mono ${t.primaryText}`}>
                    {efficiencyMetrics.bestHour || 'Henüz Yeterli Veri Yok'}
                  </div>
                </div>
              </div>
            </div>

            {/* Top Course of Week */}
            <div className={`p-3.5 rounded-xl border flex items-center justify-between ${t.border} bg-black/[0.01]`}>
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <div className={`text-[10px] font-bold uppercase tracking-wider ${t.secondaryText}`}>
                    Bu Hafta En Çok Odaklanılan Ders
                  </div>
                  <div className={`text-xs font-bold truncate max-w-[160px] ${t.primaryText}`}>
                    {efficiencyMetrics.topWeekCourse
                      ? `${efficiencyMetrics.topWeekCourse.name} (${formatTotalTime(
                          efficiencyMetrics.topWeekCourse.duration
                        )})`
                      : 'Henüz Yeterli Veri Yok'}
                  </div>
                </div>
              </div>
            </div>

            {/* Weekly Total Focus */}
            <div className={`p-3.5 rounded-xl border flex items-center justify-between ${t.border} bg-black/[0.01]`}>
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                  <Flame className="w-4 h-4" />
                </div>
                <div>
                  <div className={`text-[10px] font-bold uppercase tracking-wider ${t.secondaryText}`}>
                    Haftalık Toplam Derin Çalışma
                  </div>
                  <div className={`text-xs font-bold font-mono ${t.primaryText}`}>
                    {efficiencyMetrics.weeklySeconds > 0
                      ? formatTotalTime(efficiencyMetrics.weeklySeconds)
                      : 'Henüz Yeterli Veri Yok'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Stats Summary Panel */}
          {sessionsHistory.length > 0 && (
            <div className={`px-4 py-3 border-b flex flex-col gap-2.5 transition-colors duration-500 bg-black/5 ${t.border}`}>
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <BarChart3 className={`w-3.5 h-3.5 ${t.accentText}`} />
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${t.secondaryText}`}>Ders Dağılımı</span>
                </div>
                <div className="flex items-center gap-4 text-[11px] font-semibold">
                  <div className="flex items-center gap-1.5">
                    <span className={t.secondaryText}>Total:</span>
                    <span className={t.primaryText}>{formatTotalTime(totalFocusSeconds)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={t.secondaryText}>Sessions:</span>
                    <span className={t.primaryText}>{sessionsHistory.length}</span>
                  </div>
                </div>
              </div>

              {/* Color-Coded Distribution Bar */}
              {totalFocusSeconds > 0 && (
                <div className="flex flex-col gap-1.5">
                  <div className="w-full h-2 rounded-full overflow-hidden flex bg-zinc-200/30">
                    {courseGroupStats.map((group) => {
                      const pct = (group.duration / totalFocusSeconds) * 100;
                      return (
                        <div
                          key={group.name}
                          style={{ width: `${pct}%`, backgroundColor: group.color }}
                          className="h-full transition-all duration-300 hover:opacity-80"
                          title={`${group.name}: ${formatTotalTime(group.duration)} (%${Math.round(pct)})`}
                        />
                      );
                    })}
                  </div>

                  {/* Legend dots */}
                  <div className="flex flex-wrap items-center gap-2 pt-0.5">
                    {courseGroupStats.map((group) => (
                      <div key={group.name} className="flex items-center gap-1 text-[10px]">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: group.color }} />
                        <span className={`font-semibold ${t.primaryText}`}>{group.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Sessions Scrollable List */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar flex flex-col gap-3">
            {sessionsHistory.length > 0 ? (
              sessionsHistory.map((session) => {
                const courseColor = session.courseColor || '#71717A';

                return (
                  <div
                    key={session.id}
                    className={`group relative flex flex-col gap-2 p-4 rounded-xl border transition-all ${t.border} hover:shadow-xs bg-black/[0.01]`}
                    style={{
                      borderLeftColor: courseColor,
                      borderLeftWidth: '4px',
                    }}
                  >
                    {/* Delete Button */}
                    <button
                      onClick={() => onDeleteSession(session.id)}
                      className={`absolute top-3 right-3 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity p-1 rounded-md ${t.secondaryText} hover:text-red-500 hover:bg-black/5`}
                      title="Delete this session record"
                      aria-label="Delete session"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>

                    {/* Course Badge & Date Info */}
                    <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold opacity-80">
                      {session.courseName && (
                        <span
                          className="text-[10px] font-bold px-1.5 py-0.5 rounded shadow-xs text-white"
                          style={{ backgroundColor: courseColor }}
                        >
                          {session.courseName}
                        </span>
                      )}
                      <div className={`flex items-center gap-1 ${t.primaryText}`}>
                        <Calendar className="w-3 h-3 opacity-60" />
                        <span>{formatSessionDate(session.date)}</span>
                      </div>
                      <span className="opacity-40">•</span>
                      <div className={`flex items-center gap-1 ${t.accentText}`}>
                        <Clock className="w-3 h-3" />
                        <span>{formatDuration(session.duration)}</span>
                      </div>
                    </div>

                    {/* Focused Task Description */}
                    <p className={`text-sm font-medium leading-relaxed pr-6 ${t.primaryText} break-words`}>
                      {session.task}
                    </p>
                  </div>
                );
              })
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-12 px-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center border border-dashed mb-4 opacity-40 animate-pulse ${t.border} ${t.primaryText}`}>
                  <Clock className="w-6 h-6" />
                </div>
                <h3 className={`text-sm font-bold uppercase tracking-wider mb-1 ${t.primaryText}`}>No sessions logged</h3>
                <p className={`text-xs max-w-[200px] leading-relaxed ${t.secondaryText}`}>
                  Complete a deep focus interval to see your completed tasks logged here.
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
