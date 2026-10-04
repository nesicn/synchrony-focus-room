import React, { useMemo } from 'react';
import { BarChart3, Clock, Flame, BookOpen, Target, Calendar, Award, ArrowUpRight, Zap } from 'lucide-react';
import { useAcademic } from '../../context/AcademicContext';
import { AcademicSessionItem } from '../../types/academic';
import { ThemeConfig } from '../../theme';
import { StudyHeatmap } from '../Analytics/StudyHeatmap';

interface StudyAnalyticsViewProps {
  sessionsHistory: AcademicSessionItem[];
  t: ThemeConfig;
}

export const StudyAnalyticsView: React.FC<StudyAnalyticsViewProps> = ({ sessionsHistory, t }) => {
  const { courses, startTimerForCourse } = useAcademic();

  // Total Focus Time in seconds
  const totalFocusSeconds = useMemo(() => {
    return sessionsHistory.reduce((sum, s) => sum + s.duration, 0);
  }, [sessionsHistory]);

  const formatHoursMinutes = (seconds: number) => {
    const totalMinutes = Math.floor(seconds / 60);
    const hrs = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    if (hrs === 0) return `${mins} dk`;
    return `${hrs} sa ${mins} dk`;
  };

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

  // Group sessions by Course
  const courseAnalytics = useMemo(() => {
    const map: Record<
      string,
      {
        courseId: string;
        courseName: string;
        courseCode: string;
        courseColor: string;
        totalDuration: number;
        sessionCount: number;
      }
    > = {};

    // Initialize with all existing courses so even 0-hour courses appear
    courses.forEach((c) => {
      map[c.id] = {
        courseId: c.id,
        courseCode: c.code,
        courseName: c.name,
        courseColor: c.color,
        totalDuration: 0,
        sessionCount: 0,
      };
    });

    // Unassigned / General Focus bucket
    const generalId = 'general-focus';
    map[generalId] = {
      courseId: generalId,
      courseCode: 'Genel Odaklanma',
      courseName: 'Ders Dışı Serbest Çalışma',
      courseColor: '#6B7280',
      totalDuration: 0,
      sessionCount: 0,
    };

    sessionsHistory.forEach((session) => {
      const key = session.courseId && map[session.courseId] ? session.courseId : generalId;
      map[key].totalDuration += session.duration;
      map[key].sessionCount += 1;
    });

    return Object.values(map)
      .filter((item) => item.courseId !== generalId || item.totalDuration > 0)
      .sort((a, b) => b.totalDuration - a.totalDuration);
  }, [courses, sessionsHistory]);

  return (
    <div className="flex flex-col gap-6 w-full max-w-[1300px] mx-auto">
      {/* Top Header */}
      <div
        className={`p-6 rounded-3xl border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors duration-500 ${t.cardBg} ${t.border} ${t.shadow}`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-white transition-colors shadow-xs ${t.iconBg} ${t.iconText}`}
          >
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h2 className={`text-base font-bold tracking-tight ${t.primaryText}`}>
              Akademik Çalışma & Odaklanma Analitiği
            </h2>
            <p className={`text-xs ${t.secondaryText}`}>
              Derslerinizin renk gruplarına göre çalışma süreleri, oturum sayıları ve odaklanma dağılımı
            </p>
          </div>
        </div>

        {/* Global Summary Figures */}
        <div className="flex items-center gap-6">
          <div className="flex flex-col items-end">
            <span className={`text-[10px] uppercase font-bold tracking-wider ${t.secondaryText}`}>
              Toplam Odaklanma
            </span>
            <span className={`text-lg font-mono font-bold ${t.primaryText}`}>
              {formatHoursMinutes(totalFocusSeconds)}
            </span>
          </div>
          <div className="flex flex-col items-end">
            <span className={`text-[10px] uppercase font-bold tracking-wider ${t.secondaryText}`}>
              Tamamlanan Oturum
            </span>
            <span className={`text-lg font-mono font-bold ${t.primaryText}`}>
              {sessionsHistory.length}
            </span>
          </div>
        </div>
      </div>

      {/* 3 Efficiency Correlation & Summary Reports Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Metric 1: Best Productivity Hours */}
        <div className={`p-5 rounded-2xl border transition-all ${t.cardBg} ${t.border} ${t.shadow}`}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <span className={`text-[10px] font-bold uppercase tracking-wider ${t.secondaryText}`}>
                Verimlilik Saati
              </span>
              <div className={`text-sm font-bold font-mono ${t.primaryText}`}>
                {efficiencyMetrics.bestHour || 'Henüz Yeterli Veri Yok'}
              </div>
            </div>
          </div>
          <p className={`text-[11px] ${t.secondaryText}`}>
            {efficiencyMetrics.bestHour
              ? 'En verimli olduğun saat aralığı bu aralık olarak tespit edildi.'
              : 'Oturum tamamladıkça gün içi en verimli saatlerin burada listelenecektir.'}
          </p>
        </div>

        {/* Metric 2: Top Course of Week */}
        <div className={`p-5 rounded-2xl border transition-all ${t.cardBg} ${t.border} ${t.shadow}`}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <span className={`text-[10px] font-bold uppercase tracking-wider ${t.secondaryText}`}>
                Haftanın Lider Dersi
              </span>
              <div className={`text-sm font-bold truncate max-w-[200px] ${t.primaryText}`}>
                {efficiencyMetrics.topWeekCourse
                  ? efficiencyMetrics.topWeekCourse.name
                  : 'Henüz Yeterli Veri Yok'}
              </div>
            </div>
          </div>
          <p className={`text-[11px] ${t.secondaryText}`}>
            {efficiencyMetrics.topWeekCourse
              ? `Bu hafta en çok odaklanılan ders: ${efficiencyMetrics.topWeekCourse.name} (${formatHoursMinutes(
                  efficiencyMetrics.topWeekCourse.duration
                )})`
              : 'Bu hafta için henüz bir ders odaklanması kaydedilmedi.'}
          </p>
        </div>

        {/* Metric 3: Weekly Total Deep Work */}
        <div className={`p-5 rounded-2xl border transition-all ${t.cardBg} ${t.border} ${t.shadow}`}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <Flame className="w-4 h-4" />
            </div>
            <div>
              <span className={`text-[10px] font-bold uppercase tracking-wider ${t.secondaryText}`}>
                Haftalık Derin Çalışma
              </span>
              <div className={`text-sm font-bold font-mono ${t.primaryText}`}>
                {efficiencyMetrics.weeklySeconds > 0
                  ? formatHoursMinutes(efficiencyMetrics.weeklySeconds)
                  : 'Henüz Yeterli Veri Yok'}
              </div>
            </div>
          </div>
          <p className={`text-[11px] ${t.secondaryText}`}>
            {efficiencyMetrics.weeklySeconds > 0
              ? 'Son 7 gün içerisindeki net derin çalışma süresi toplamı.'
              : 'Bu hafta için henüz kaydedilmiş oturum süresi bulunmuyor.'}
          </p>
        </div>
      </div>

      {/* GitHub-style Study Heatmap Card (Full 52 Weeks / 365 Days) */}
      <div className={`p-6 rounded-3xl border transition-all ${t.cardBg} ${t.border} ${t.shadow} w-full`}>
        <StudyHeatmap sessionsHistory={sessionsHistory} weeksCount={52} t={t} />
      </div>

      {/* Main Grid: Visual Course Distribution Bar & Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Visual Proportional Bar & Subject Breakdown */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* Visual Distribution Horizontal Bar */}
          <div
            className={`p-6 rounded-3xl border flex flex-col transition-colors duration-500 ${t.cardBg} ${t.border} ${t.shadow}`}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-xs font-bold uppercase tracking-wider ${t.primaryText}`}>
                Ders Bazlı Odaklanma Dağılımı (Oransal Çizelge)
              </h3>
              <span className={`text-xs font-mono font-semibold ${t.secondaryText}`}>
                {sessionsHistory.length} Toplam Oturum
              </span>
            </div>

            {totalFocusSeconds > 0 ? (
              <>
                {/* Proportional Colored Bar */}
                <div className="w-full h-4 rounded-xl overflow-hidden flex bg-zinc-200/20 mb-4 shadow-inner">
                  {courseAnalytics.map((item) => {
                    if (item.totalDuration === 0) return null;
                    const percentage = (item.totalDuration / totalFocusSeconds) * 100;
                    return (
                      <div
                        key={item.courseId}
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: item.courseColor,
                        }}
                        className="h-full transition-all duration-500 hover:opacity-90 relative group"
                        title={`${item.courseCode}: ${formatHoursMinutes(item.totalDuration)} (%${Math.round(percentage)})`}
                      />
                    );
                  })}
                </div>

                {/* Legend Chips below bar */}
                <div className="flex flex-wrap items-center gap-3">
                  {courseAnalytics.map((item) => {
                    if (item.totalDuration === 0) return null;
                    const percentage = Math.round((item.totalDuration / totalFocusSeconds) * 100);
                    return (
                      <div
                        key={item.courseId}
                        className="flex items-center gap-1.5 text-xs font-medium"
                      >
                        <div
                          className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs"
                          style={{ backgroundColor: item.courseColor }}
                        />
                        <span className={`font-semibold ${t.primaryText}`}>{item.courseCode}</span>
                        <span className={`text-[11px] ${t.secondaryText}`}>%{percentage}</span>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className={`py-8 text-center text-xs ${t.secondaryText}`}>
                Henüz tamamlanmış odaklanma oturumu bulunmuyor. Zamanlayıcı ile çalışarak buradaki grafikleri renklendirin!
              </div>
            )}
          </div>

          {/* Detailed Course Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {courseAnalytics.map((item) => {
              const percentage =
                totalFocusSeconds > 0 ? Math.round((item.totalDuration / totalFocusSeconds) * 100) : 0;

              return (
                <div
                  key={item.courseId}
                  className={`p-5 rounded-2xl border transition-all hover:shadow-md flex flex-col justify-between ${t.cardBg} ${t.border}`}
                  style={{
                    borderLeftColor: item.courseColor,
                    borderLeftWidth: '5px',
                  }}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full shrink-0 shadow-xs"
                          style={{ backgroundColor: item.courseColor }}
                        />
                        <span className={`text-sm font-bold tracking-tight ${t.primaryText}`}>
                          {item.courseCode}
                        </span>
                      </div>

                      {item.courseId !== 'general-focus' && (
                        <button
                          onClick={() => startTimerForCourse(item.courseId)}
                          className={`p-1.5 rounded-lg border text-xs transition-colors ${t.border} ${t.secondaryHover} flex items-center gap-1 text-emerald-600 hover:bg-emerald-500/10`}
                          title="Bu ders için zamanlayıcıyı başlat"
                        >
                          <Clock className="w-3 h-3" />
                          <span className="text-[10px] font-bold">Odaklan</span>
                        </button>
                      )}
                    </div>

                    <div className={`text-xs ${t.secondaryText} mb-4 truncate`}>
                      {item.courseName}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-end justify-between mb-2">
                      <span className={`text-xl font-bold font-mono ${t.primaryText}`}>
                        {formatHoursMinutes(item.totalDuration)}
                      </span>
                      <span className={`text-xs font-semibold ${t.secondaryText}`}>
                        {item.sessionCount} Oturum (%{percentage})
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-1.5 rounded-full overflow-hidden bg-zinc-200/20">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${Math.min(100, percentage)}%`,
                          backgroundColor: item.courseColor,
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Recent Sessions History Log with colored tags */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div
            className={`p-6 rounded-3xl border flex flex-col transition-colors duration-500 ${t.cardBg} ${t.border} ${t.shadow}`}
          >
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-200/20">
              <h3 className={`text-xs font-bold uppercase tracking-wider ${t.primaryText}`}>
                Son Çalışma Kayıtları
              </h3>
              <span className={`text-xs font-mono font-semibold ${t.secondaryText}`}>
                {sessionsHistory.slice(0, 10).length} Kayıt
              </span>
            </div>

            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1 custom-scrollbar">
              {sessionsHistory.length > 0 ? (
                sessionsHistory.slice(0, 15).map((session) => {
                  const courseColor = session.courseColor || '#6B7280';
                  return (
                    <div
                      key={session.id}
                      className={`p-3 rounded-xl border text-xs transition-all ${t.border} bg-black/[0.01] hover:bg-black/[0.03]`}
                      style={{
                        borderLeftColor: courseColor,
                        borderLeftWidth: '3px',
                      }}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5 truncate">
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: courseColor }}
                          />
                          <span className={`font-bold truncate ${t.primaryText}`}>
                            {session.courseName || session.task}
                          </span>
                        </div>
                        <span className={`font-mono font-bold text-[11px] ${t.primaryText}`}>
                          {formatHoursMinutes(session.duration)}
                        </span>
                      </div>

                      <div className={`text-[10px] flex items-center justify-between ${t.secondaryText}`}>
                        <span className="truncate max-w-[140px]">{session.task}</span>
                        <span>{new Date(session.date).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className={`py-12 text-center text-xs ${t.secondaryText}`}>
                  Henüz kaydedilmiş çalışma kaydı yok.
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
