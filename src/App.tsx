import React, { useState, useEffect, useCallback } from 'react';
import { PomodoroTimer } from './components/PomodoroTimer';
import { SessionHistoryPanel, SessionItem } from './components/SessionHistoryPanel';
import { WeeklyCalendarView } from './components/WeeklyCalendar/WeeklyCalendarView';
import { StudyAnalyticsView } from './components/StudyAnalytics/StudyAnalyticsView';
import { FlashcardsView } from './components/Flashcards/FlashcardsView';
import { AcademicProvider, useAcademic } from './context/AcademicContext';
import { ActiveNavTab } from './types/academic';
import { THEMES, ThemeType } from './theme';
import { Timer, Calendar, BarChart2, Layers, Sparkles } from 'lucide-react';

// Safe LocalStorage writing utility to prevent QuotaExceededError and permission exceptions
const safeLocalStorageSetItem = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    console.warn(`[Storage Warning] Failed to write key "${key}" to LocalStorage:`, e);
  }
};

// Fallback UUID generator in case crypto.randomUUID is not supported in the hosting context or secure frame
export const generateUUID = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'uid-' + Math.random().toString(36).substring(2, 15) + '-' + Date.now().toString(36);
};

function MainAppShell() {
  const { activeTab, setActiveTab } = useAcademic();
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  const [theme, setTheme] = useState<ThemeType>(() => {
    try {
      const saved = localStorage.getItem('focus_theme');
      return (saved as ThemeType) || 'light';
    } catch (e) {
      console.error('Failed to load focus theme from storage:', e);
      return 'light';
    }
  });

  const [sessionsHistory, setSessionsHistory] = useState<SessionItem[]>(() => {
    try {
      const saved = localStorage.getItem('focus_sessions_history');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error('Failed to parse focus session history from storage:', e);
      return [];
    }
  });

  useEffect(() => {
    safeLocalStorageSetItem('focus_theme', theme);
  }, [theme]);

  useEffect(() => {
    safeLocalStorageSetItem('focus_sessions_history', JSON.stringify(sessionsHistory));
  }, [sessionsHistory]);

  const t = THEMES[theme];

  const handleTimerStart = useCallback((goal: string) => {
    // Hook called when user starts countdown
  }, []);

  const handleTimerComplete = useCallback(
    (
      task: string,
      durationSeconds: number,
      courseId?: string,
      courseName?: string,
      courseColor?: string
    ) => {
      const newSession: SessionItem = {
        id: generateUUID(),
        date: new Date().toISOString(),
        task: task || 'General Focus',
        duration: durationSeconds,
        courseId,
        courseName,
        courseColor,
      };

      setSessionsHistory((prev) => {
        const updated = [newSession, ...prev];
        // Cap at 150 historical records to protect LocalStorage capacity limit
        return updated.slice(0, 150);
      });
    },
    []
  );

  const handleClearHistory = useCallback(() => {
    setSessionsHistory([]);
  }, []);

  const handleDeleteSession = useCallback((id: string) => {
    setSessionsHistory((prev) => prev.filter((session) => session.id !== id));
  }, []);

  return (
    <div
      className={`flex flex-col w-full min-h-screen font-sans overflow-y-auto transition-colors duration-500 relative ${t.mainBg}`}
    >
      {/* Header / Top Navigation Bar */}
      <header
        className={`h-16 border-b flex items-center justify-between px-4 md:px-8 shrink-0 relative z-30 transition-colors duration-500 ${t.cardBg} ${t.borderMuted}`}
      >
        {/* Brand Zone */}
        <div className="flex items-center gap-3">
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold transition-colors shadow-xs ${t.iconBg} ${t.iconText}`}
          >
            S
          </div>
          <span className={`font-semibold tracking-tight hidden sm:block ${t.primaryText}`}>
            SYNCHRONY{' '}
            <span className={`font-normal underline underline-offset-4 ml-1 ${t.secondaryText}`}>
              Academic Focus Suite
            </span>
          </span>
        </div>

        {/* Navigation Tabs (Top Bar Contract: Single-line controls) */}
        <nav className="flex items-center p-1 rounded-2xl border transition-all" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
          <button
            onClick={() => setActiveTab('focus')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-all ${
              activeTab === 'focus'
                ? `${t.accentTargetBg} ${t.accentTargetText} shadow-xs`
                : `${t.secondaryText} hover:${t.primaryText}`
            }`}
          >
            <Timer className="w-3.5 h-3.5" />
            <span>Focus Room</span>
          </button>

          <button
            onClick={() => setActiveTab('schedule')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-all ${
              activeTab === 'schedule'
                ? `${t.accentTargetBg} ${t.accentTargetText} shadow-xs`
                : `${t.secondaryText} hover:${t.primaryText}`
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Haftalık Program</span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-all ${
              activeTab === 'analytics'
                ? `${t.accentTargetBg} ${t.accentTargetText} shadow-xs`
                : `${t.secondaryText} hover:${t.primaryText}`
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>Çalışma Analitiği</span>
          </button>

          <button
            onClick={() => setActiveTab('flashcards')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-all ${
              activeTab === 'flashcards'
                ? `${t.accentTargetBg} ${t.accentTargetText} shadow-xs`
                : `${t.secondaryText} hover:${t.primaryText}`
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Bilgi Kartları (Flashcards)</span>
          </button>
        </nav>

        {/* Actions Zone: Active Status Indicator & Theme Palette */}
        <div className="flex items-center gap-3">
          {isTimerRunning && (
            <button
              onClick={() => setActiveTab('focus')}
              className={`flex items-center gap-2 px-3 py-1 rounded-full border transition-all cursor-pointer ${t.inputBox} ${t.border} hover:scale-105`}
              title="Aktif oturumu görüntülemek için tıklayın"
            >
              <div className={`w-2 h-2 rounded-full animate-pulse ${t.accentTargetBg}`} />
              <span className={`text-xs font-medium uppercase tracking-wider hidden md:inline-block ${t.primaryText}`}>
                Aktif Oturum
              </span>
              <span className={`text-xs font-medium uppercase tracking-wider md:hidden ${t.primaryText}`}>
                Aktif
              </span>
            </button>
          )}

          {/* Theme Palette Selectors */}
          <div className="flex items-center gap-2 pl-2 border-l border-zinc-200/20">
            <button
              onClick={() => setTheme('light')}
              className={`w-5 h-5 rounded-full bg-zinc-200 border border-zinc-400/30 focus:outline-none transition-all ${
                theme === 'light'
                  ? 'ring-2 ring-offset-2 ring-zinc-800 ring-offset-white/20 scale-110'
                  : 'hover:scale-110'
              }`}
              title="Light Minimal Theme"
              aria-label="Light Theme"
            />
            <button
              onClick={() => setTheme('rose')}
              className={`w-5 h-5 rounded-full bg-[#AB8882] shadow-inner focus:outline-none transition-all ${
                theme === 'rose'
                  ? 'ring-2 ring-offset-2 ring-[#AB8882] ring-offset-white/20 scale-110'
                  : 'hover:scale-110'
              }`}
              title="Cozy Rose Earth Theme"
              aria-label="Cozy Rose Earth Theme"
            />
            <button
              onClick={() => setTheme('midnight')}
              className={`w-5 h-5 rounded-full bg-[#13121C] shadow-inner focus:outline-none transition-all ${
                theme === 'midnight'
                  ? 'ring-2 ring-offset-2 ring-[#13121C] ring-offset-white/20 scale-110'
                  : 'hover:scale-110'
              }`}
              title="Midnight Hydrangea Theme"
              aria-label="Midnight Hydrangea Theme"
            />
            <button
              onClick={() => setTheme('sage')}
              className={`w-5 h-5 rounded-full bg-[#2D3A34] shadow-inner focus:outline-none transition-all ${
                theme === 'sage'
                  ? 'ring-2 ring-offset-2 ring-[#2D3A34] ring-offset-white/20 scale-110'
                  : 'hover:scale-110'
              }`}
              title="Sage Sanctuary Theme"
              aria-label="Sage Sanctuary Theme"
            />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-8 min-h-0 relative z-10 w-full flex flex-col items-center">
        {activeTab === 'focus' && (
          <div className="flex-1 flex flex-col md:flex-row gap-6 max-w-[1300px] w-full items-stretch justify-center">
            {/* Left Side: Focus Timer (Bento Grid Style) */}
            <div className="w-full md:w-[60%] lg:w-[65%] flex flex-col gap-6 shrink-0 md:shrink">
              <PomodoroTimer
                onTimerStart={handleTimerStart}
                onTimerComplete={handleTimerComplete}
                isTimerRunning={isTimerRunning}
                setIsTimerRunning={setIsTimerRunning}
                t={t}
              />
            </div>

            {/* Right Side: Session History Panel */}
            <div
              className={`w-full md:w-[40%] lg:w-[35%] rounded-3xl shrink-0 md:shrink border flex flex-col overflow-hidden h-[540px] md:h-auto transition-colors duration-500 ${t.cardBg} ${t.border} ${t.shadow}`}
            >
              <SessionHistoryPanel
                sessionsHistory={sessionsHistory}
                onClearHistory={handleClearHistory}
                onDeleteSession={handleDeleteSession}
                t={t}
              />
            </div>
          </div>
        )}

        {activeTab === 'schedule' && <WeeklyCalendarView t={t} />}

        {activeTab === 'analytics' && <StudyAnalyticsView sessionsHistory={sessionsHistory} t={t} />}

        {activeTab === 'flashcards' && <FlashcardsView t={t} />}
      </main>

      {/* Footer */}
      <footer
        className={`hidden md:flex h-12 border-t items-center justify-center px-8 text-[10px] font-medium tracking-widest uppercase shrink-0 transition-colors duration-500 ${t.cardBg} ${t.borderMuted} ${t.secondaryText}`}
      >
        Synchrony Academic Assistant • Hafta İçi & Hafta Sonu Ders & Sınav Çizelgesi • Deep Focus v2.0
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AcademicProvider>
      <MainAppShell />
    </AcademicProvider>
  );
}
