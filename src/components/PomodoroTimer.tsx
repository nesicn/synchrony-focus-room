import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw, X, Volume2, VolumeX } from 'lucide-react';
import { ThemeConfig } from '../theme';

// Local storage write protector
const safeLocalStorageSetItem = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    console.warn(`[Storage Warning] Failed to write key "${key}" to LocalStorage:`, e);
  }
};

// Local fallback UUID generator to handle sandboxed iframe restrictions
const generateUUID = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'task-' + Math.random().toString(36).substring(2, 15) + '-' + Date.now().toString(36);
};

interface PomodoroTimerProps {
  onTimerComplete: (task: string, durationSeconds: number) => void;
  onTimerStart: (goal: string) => void;
  isTimerRunning: boolean;
  setIsTimerRunning: (isRunning: boolean) => void;
  t: ThemeConfig;
}

export function PomodoroTimer({ 
  onTimerComplete, 
  onTimerStart, 
  isTimerRunning, 
  setIsTimerRunning,
  t
}: PomodoroTimerProps) {
  const [defaultTime, setDefaultTime] = useState(25 * 60);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [tasks, setTasks] = useState<{id: string, text: string, completed: boolean}[]>(() => {
    try {
      const saved = localStorage.getItem('focus_tasks');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error('Failed to parse focus tasks from storage:', e);
      return [];
    }
  });
  const [sessions, setSessions] = useState(() => {
    try {
      const saved = localStorage.getItem('focus_sessions');
      const parsed = saved ? parseInt(saved, 10) : 1;
      return parsed > 0 ? parsed : 1;
    } catch (e) {
      console.error('Failed to parse focus sessions from storage:', e);
      return 1;
    }
  });
  const [newTask, setNewTask] = useState('');
  const [hasStarted, setHasStarted] = useState(false);
  const [currentSessionTask, setCurrentSessionTask] = useState(() => {
    try {
      return localStorage.getItem('focus_current_session_task') || '';
    } catch (e) {
      return '';
    }
  });
  const [soundEnabled, setSoundEnabled] = useState(() => {
    try {
      const saved = localStorage.getItem('focus_sound_enabled');
      return saved !== null ? saved === 'true' : true;
    } catch (e) {
      return true;
    }
  });

  // Precise wall-clock target timestamp ref to eliminate background tab timer drift
  const endTimeRef = useRef<number | null>(null);
  const currentSessionTaskRef = useRef(currentSessionTask);
  const defaultTimeRef = useRef(defaultTime);

  useEffect(() => {
    currentSessionTaskRef.current = currentSessionTask;
  }, [currentSessionTask]);

  useEffect(() => {
    defaultTimeRef.current = defaultTime;
  }, [defaultTime]);

  useEffect(() => {
    safeLocalStorageSetItem('focus_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    safeLocalStorageSetItem('focus_sessions', sessions.toString());
  }, [sessions]);

  useEffect(() => {
    safeLocalStorageSetItem('focus_current_session_task', currentSessionTask);
  }, [currentSessionTask]);

  useEffect(() => {
    safeLocalStorageSetItem('focus_sound_enabled', soundEnabled.toString());
  }, [soundEnabled]);

  const handleAddTask = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newTask.trim()) {
      setTasks(prevTasks => [...prevTasks, { id: generateUUID(), text: newTask.trim(), completed: false }]);
      setNewTask('');
    }
  };

  const toggleTask = (id: string) => {
    setTasks(prevTasks => prevTasks.map(task => {
      if (task.id === id) {
        return { ...task, completed: !task.completed };
      }
      return task;
    }));
  };

  const deleteTask = (id: string) => {
    setTasks(prevTasks => prevTasks.filter(t => t.id !== id));
  };

  const playNotificationSound = useCallback(() => {
    if (!soundEnabled) return;
    
    try {
      // Primary: Web Audio API synthesis (100% offline-first, highly secure, zero latency chime)
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        const ctx = new AudioContextClass();
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        // Pure harmonic tone
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(880, ctx.currentTime); // High clear A5 note
        
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(1318.51, ctx.currentTime); // E6 fifth note for brilliant chime resonance
        
        gainNode.gain.setValueAtTime(0, ctx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.25, ctx.currentTime + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
        
        osc1.connect(gainNode);
        osc2.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        osc1.start(ctx.currentTime);
        osc2.start(ctx.currentTime);
        
        osc1.stop(ctx.currentTime + 1.2);
        osc2.stop(ctx.currentTime + 1.2);
        return;
      }
    } catch (e) {
      console.warn('[Audio Warning] Native synthesis failed. Attempting fallback media source:', e);
    }

    try {
      const fallbackUrl = 'https://raw.githubusercontent.com/summsum1203/pomodoro-timer/main/sound/ding.mp3';
      const audio = new Audio(fallbackUrl);
      audio.volume = 0.5;
      audio.play().catch(e => console.error('[Audio Error] Fallback audio playback blocked or failed:', e));
    } catch (e) {
      console.error('[Audio Error] All audio alerts failed:', e);
    }
  }, [soundEnabled]);

  // High precision synchronization based on wall-clock time to prevent background tab drift
  const syncTimer = useCallback(() => {
    if (endTimeRef.current === null) return;
    const now = Date.now();
    const diffMs = endTimeRef.current - now;
    const remaining = Math.max(0, Math.ceil(diffMs / 1000));

    if (remaining <= 0) {
      endTimeRef.current = null;
      setTimeLeft(0);
      setIsTimerRunning(false);
      setHasStarted(false);
      setSessions(s => s + 1);
      playNotificationSound();
      onTimerComplete(currentSessionTaskRef.current || 'General Focus', defaultTimeRef.current);
      setCurrentSessionTask('');
    } else {
      setTimeLeft(remaining);
    }
  }, [setIsTimerRunning, playNotificationSound, onTimerComplete]);

  // Main countdown engine using Web Worker + interval + visibilitychange
  useEffect(() => {
    if (!isTimerRunning) {
      return;
    }

    if (endTimeRef.current === null) {
      endTimeRef.current = Date.now() + timeLeft * 1000;
    }

    let worker: Worker | null = null;
    let fallbackInterval: ReturnType<typeof setInterval> | null = null;

    // Web Worker intervals are not throttled by browsers when the tab is placed in the background
    try {
      const workerBlob = new Blob([
        `let timer = null;
        self.onmessage = function(e) {
          if (e.data === 'start') {
            if (!timer) {
              timer = setInterval(function() {
                self.postMessage('tick');
              }, 500);
            }
          } else if (e.data === 'stop') {
            if (timer) {
              clearInterval(timer);
              timer = null;
            }
          }
        };`
      ], { type: 'application/javascript' });
      const workerUrl = URL.createObjectURL(workerBlob);
      worker = new Worker(workerUrl);
      worker.onmessage = () => {
        syncTimer();
      };
      worker.postMessage('start');
    } catch (e) {
      console.warn('[Timer] Web Worker background tick unavailable, falling back to window interval:', e);
    }

    // Secondary window interval fallback
    fallbackInterval = setInterval(() => {
      syncTimer();
    }, 500);

    // Instantly catch up to the exact real-world second as soon as the user switches back to this tab
    const handleVisibilityOrFocus = () => {
      syncTimer();
    };

    document.addEventListener('visibilitychange', handleVisibilityOrFocus);
    window.addEventListener('focus', handleVisibilityOrFocus);

    return () => {
      if (worker) {
        worker.postMessage('stop');
        worker.terminate();
      }
      if (fallbackInterval) {
        clearInterval(fallbackInterval);
      }
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      window.removeEventListener('focus', handleVisibilityOrFocus);
    };
  }, [isTimerRunning, syncTimer]);

  // Keep browser tab title updated in real time so the user can observe progress from other tabs
  useEffect(() => {
    if (isTimerRunning && timeLeft > 0) {
      const mins = Math.floor(timeLeft / 60);
      const secs = timeLeft % 60;
      document.title = `(${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}) SYNCHRONY Focus Room`;
    } else {
      document.title = 'SYNCHRONY Focus Room';
    }
    return () => {
      document.title = 'SYNCHRONY Focus Room';
    };
  }, [isTimerRunning, timeLeft]);

  const presetTimer = (minutes: number) => {
    const sec = minutes * 60;
    setDefaultTime(sec);
    setTimeLeft(sec);
    setIsTimerRunning(false);
    endTimeRef.current = null;
    setHasStarted(false);
    setCurrentSessionTask('');
  };

  const handleStart = () => {
    const activeTasks = tasks.filter(t => !t.completed).map(t => t.text).join(', ');
    const taskName = activeTasks || 'General Focus';
    if (!hasStarted) {
      onTimerStart(taskName);
      setCurrentSessionTask(taskName);
      setHasStarted(true);
    }
    endTimeRef.current = Date.now() + timeLeft * 1000;
    setIsTimerRunning(true);
  };

  const handlePause = () => {
    setIsTimerRunning(false);
    if (endTimeRef.current !== null) {
      const remaining = Math.max(0, Math.ceil((endTimeRef.current - Date.now()) / 1000));
      setTimeLeft(remaining);
      endTimeRef.current = null;
    }
  };

  const handleReset = () => {
    setIsTimerRunning(false);
    endTimeRef.current = null;
    setTimeLeft(defaultTime);
    setHasStarted(false);
    setCurrentSessionTask('');
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  
  // Calculate progress for the circular ring or linear bar
  const progress = ((defaultTime - timeLeft) / defaultTime) * 100;
  
  // Calculate checklist progress
  const checklistProgress = tasks.length > 0 ? (tasks.filter(t => t.completed).length / tasks.length) * 100 : 0;

  return (
    <div className="flex flex-col gap-6 h-full w-full">
      {/* Timer Card */}
      <div className={`flex-1 rounded-3xl p-6 md:p-10 flex flex-col items-center justify-center relative overflow-hidden min-h-[300px] transition-colors duration-500 border ${t.cardBg} ${t.border} ${t.shadow}`}>
        
        {/* Sound Toggle */}
        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className={`absolute top-6 right-6 p-2 rounded-xl transition-all border bg-transparent opacity-60 hover:opacity-100 ${t.border} ${t.primaryText} hover:bg-opacity-10`}
          aria-label={soundEnabled ? "Mute notification sound" : "Enable notification sound"}
        >
          {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
        </button>

        <div className={`text-[80px] sm:text-[100px] lg:text-[144px] font-light font-mono tracking-tighter leading-none transition-colors duration-500 ${t.primaryText}`}>
          {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
        </div>
        
        {/* Session Progress Bar */}
        <div className="w-full max-w-sm mt-8 md:mt-10 flex flex-col gap-2">
          <div className="flex justify-between items-center text-xs font-semibold uppercase tracking-widest opacity-70">
            <span>Session Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className={`w-full h-2 md:h-2.5 rounded-full overflow-hidden transition-colors ${t.ringBg}`}>
            <div 
              className={`h-full transition-all duration-1000 ease-linear rounded-full ${t.accentTargetBg}`} 
              style={{ width: `${progress}%` }} 
            />
          </div>
        </div>
        
        <div className="flex flex-wrap items-center justify-center gap-4 mt-8 md:mt-10">
          {!isTimerRunning ? (
            <button
              onClick={handleStart}
              className={`px-8 md:px-10 py-3 md:py-4 rounded-2xl font-semibold transition-all flex items-center gap-2 ${t.accentTargetBg} ${t.accentTargetText} hover:opacity-90`}
            >
              <Play className="w-5 h-5 fill-current" />
              Start Timer
            </button>
          ) : (
            <button
              onClick={handlePause}
              className={`px-8 md:px-10 py-3 md:py-4 rounded-2xl font-semibold transition-all flex items-center gap-2 bg-transparent border ${t.border} ${t.primaryText} ${t.buttonHover}`}
            >
              <Pause className="w-5 h-5 fill-current" />
              Pause
            </button>
          )}
          <button
            onClick={handleReset}
            className={`p-3 md:p-4 rounded-2xl transition-all border bg-transparent ${t.border} ${t.primaryText} ${t.buttonHover}`}
          >
            <RotateCcw className="w-5 md:w-6 h-5 md:h-6" />
          </button>
        </div>

        {/* Presets Row */}
        <div className={`flex flex-wrap items-center justify-center gap-2 md:gap-3 mt-8 pt-6 border-t w-full max-w-2xl transition-colors duration-500 ${t.borderMuted}`}>
          <button
            onClick={() => presetTimer(15)}
            className={`px-3 py-2 text-xs font-semibold rounded-xl border transition-all ${
              defaultTime === 15 * 60 ? `${t.accentTargetBg} border-transparent ${t.accentTargetText}` : `${t.presetBg} ${t.border} ${t.presetText}`
            }`}
          >
            15 min (Micro-Sprint)
          </button>
          <button
            onClick={() => presetTimer(25)}
            className={`px-3 py-2 text-xs font-semibold rounded-xl border transition-all ${
              defaultTime === 25 * 60 ? `${t.accentTargetBg} border-transparent ${t.accentTargetText}` : `${t.presetBg} ${t.border} ${t.presetText}`
            }`}
          >
            25 min (Standard)
          </button>
          <button
            onClick={() => presetTimer(50)}
            className={`px-3 py-2 text-xs font-semibold rounded-xl border transition-all ${
              defaultTime === 50 * 60 ? `${t.accentTargetBg} border-transparent ${t.accentTargetText}` : `${t.presetBg} ${t.border} ${t.presetText}`
            }`}
          >
            50 min (Deep Work)
          </button>
        </div>
      </div>

      {/* Stats & Task Info */}
      <div className="h-auto md:h-48 flex flex-col md:flex-row gap-6 shrink-0 mt-2">
        <div className={`flex-[2] rounded-3xl p-8 flex flex-col min-h-[160px] max-h-72 overflow-hidden transition-colors duration-500 border ${t.cardBg} ${t.border} ${t.shadow}`}>
          <div className="flex items-center justify-between mb-4">
            <span className={`text-xs font-bold uppercase tracking-widest transition-colors ${t.secondaryText}`}>Focus Checklist</span>
            {tasks.length > 0 && <span className={`text-[10px] font-bold transition-colors ${t.secondaryText}`}>{tasks.filter(task => task.completed).length}/{tasks.length}</span>}
          </div>
          <div className="flex-1 overflow-y-auto mb-4 space-y-3 pr-2 custom-scrollbar">
            {tasks.map(task => (
              <div key={task.id} className="flex items-start gap-3 group">
                <div 
                  onClick={() => toggleTask(task.id)}
                  className={`mt-0.5 w-5 h-5 rounded shrink-0 transition-colors border cursor-pointer flex items-center justify-center shadow-sm ${t.accentBorder} ${task.completed ? t.accentTargetBg : 'bg-transparent'}`}
                >
                  {task.completed && <svg className={`w-3.5 h-3.5 ${t.accentTargetText}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                </div>
                <span className={`text-[15px] flex-1 transition-colors leading-snug ${
                  task.completed 
                    ? `line-through ${t.secondaryText} opacity-50`
                    : `${t.primaryText} font-medium`
                }`}>
                  {task.text}
                </span>
                <button
                  onClick={() => deleteTask(task.id)}
                  className={`opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100 ${t.secondaryText} hover:opacity-80 p-1`}
                  aria-label="Delete task"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            {tasks.length === 0 && <span className={`text-[15px] italic mt-2 block transition-colors ${t.secondaryText}`}>No tasks yet. Type below.</span>}
          </div>
          <input
            type="text"
            placeholder="Type a focus task and hit Enter..."
            disabled={hasStarted}
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            onKeyDown={handleAddTask}
            className={`text-[15px] font-medium outline-none bg-transparent w-full disabled:opacity-75 focus:outline-none mb-4 transition-colors ${t.primaryText} placeholder:opacity-50`}
          />
          <div className={`w-full h-1.5 rounded-full overflow-hidden shrink-0 transition-colors ${t.ringBg}`}>
            <div 
              className={`h-full transition-all duration-500 ease-in-out ${t.accentTargetBg}`} 
              style={{ width: `${checklistProgress}%` }} 
            />
          </div>
        </div>
        <div className={`w-full md:w-48 rounded-3xl p-8 flex flex-col items-center justify-center shrink-0 min-h-[140px] md:min-h-0 transition-all duration-500 border ${t.cardBg} ${t.border} ${t.shadow}`}>
          <span className={`text-xs font-bold uppercase tracking-widest transition-colors ${t.secondaryText}`}>Sessions</span>
          <div className={`text-5xl font-semibold mt-4 tracking-tight ${t.primaryText}`}>{sessions.toString().padStart(2, '0')}</div>
        </div>
      </div>
    </div>
  );
}
