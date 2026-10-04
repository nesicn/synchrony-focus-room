import React, { useState } from 'react';
import { 
  Check, 
  Plus, 
  X, 
  Play, 
  Target, 
  LayoutGrid, 
  ListFilter, 
  AlertCircle, 
  Tag, 
  Clock, 
  CheckCircle2, 
  Flame,
  ChevronDown
} from 'lucide-react';
import { TaskItem, EisenhowerQuadrant, EISENHOWER_CONFIG, Course } from '../../types/academic';
import { ThemeConfig } from '../../theme';

interface EisenhowerChecklistProps {
  tasks: TaskItem[];
  onAddTask: (text: string, quadrant: EisenhowerQuadrant, courseId?: string) => void;
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onFocusTask: (task: TaskItem) => void;
  activeFocusTaskId: string | null;
  courses: Course[];
  t: ThemeConfig;
}

export const EisenhowerChecklist: React.FC<EisenhowerChecklistProps> = ({
  tasks,
  onAddTask,
  onToggleTask,
  onDeleteTask,
  onFocusTask,
  activeFocusTaskId,
  courses,
  t,
}) => {
  const [viewMode, setViewMode] = useState<'list' | 'matrix'>('list');
  const [filterQuadrant, setFilterQuadrant] = useState<EisenhowerQuadrant | 'all'>('all');
  const [filterCourseId, setFilterCourseId] = useState<string | 'all'>('all');
  
  // New Task form state
  const [isAdding, setIsAdding] = useState(false);
  const [newTaskText, setNewTaskText] = useState('');
  const [selectedQuadrant, setSelectedQuadrant] = useState<EisenhowerQuadrant>('q1');
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');

  const completedCount = tasks.filter((t) => t.completed).length;
  const progressPercent = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;
    onAddTask(newTaskText.trim(), selectedQuadrant, selectedCourseId || undefined);
    setNewTaskText('');
    setIsAdding(false);
  };

  const filteredTasks = tasks.filter((task) => {
    if (filterQuadrant !== 'all' && task.quadrant !== filterQuadrant) return false;
    if (filterCourseId !== 'all' && task.courseId !== filterCourseId) return false;
    return true;
  });

  const getCourse = (id?: string) => courses.find((c) => c.id === id);

  return (
    <div
      className={`rounded-3xl p-6 md:p-8 flex flex-col transition-colors duration-500 border ${t.cardBg} ${t.border} ${t.shadow} w-full`}
    >
      {/* Top Header & View Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-zinc-200/20">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Target className={`w-4 h-4 ${t.primaryText}`} />
            <h3 className={`text-xs font-bold uppercase tracking-wider ${t.primaryText}`}>
              Focus Checklist & Eisenhower Matrisi
            </h3>
          </div>
          <span className={`text-[11px] font-mono font-semibold ${t.secondaryText}`}>
            {completedCount}/{tasks.length} ({progressPercent}%)
          </span>
        </div>

        {/* View Switcher & Add Button */}
        <div className="flex items-center gap-2">
          {/* List vs 2x2 Matrix view toggle */}
          <div className={`flex items-center p-0.5 rounded-xl border ${t.border} ${t.inputBox}`}>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'list'
                  ? `${t.cardBg} ${t.primaryText} shadow-xs`
                  : `${t.secondaryText} hover:${t.primaryText}`
              }`}
              title="Liste Görünümü"
            >
              <ListFilter className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('matrix')}
              className={`p-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'matrix'
                  ? `${t.cardBg} ${t.primaryText} shadow-xs`
                  : `${t.secondaryText} hover:${t.primaryText}`
              }`}
              title="2x2 Eisenhower Matrisi Görünümü"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={() => setIsAdding(!isAdding)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all ${t.accentTargetBg} ${t.accentTargetText} hover:opacity-90`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Yeni Görev</span>
          </button>
        </div>
      </div>

      {/* Checklist Progress Bar */}
      <div className="w-full h-1.5 rounded-full overflow-hidden mb-4 bg-zinc-200/30">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${t.accentTargetBg}`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* New Task Inline Expansion Form */}
      {isAdding && (
        <form
          onSubmit={handleSubmit}
          className={`p-4 rounded-2xl border mb-4 space-y-3 transition-all ${t.inputBox} ${t.border}`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold uppercase tracking-wider ${t.primaryText}`}>
              Yeni Görev Tanımla
            </span>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className={`text-xs opacity-60 hover:opacity-100 ${t.primaryText}`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <input
            type="text"
            required
            autoFocus
            placeholder="Ne üzerinde çalışacaksın? Yeni bir görev ekle..."
            value={newTaskText}
            onChange={(e) => setNewTaskText(e.target.value)}
            className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-medium outline-none transition-all ${t.cardBg} ${t.border} ${t.primaryText}`}
          />

          {/* Quadrant Selector */}
          <div>
            <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${t.secondaryText}`}>
              Eisenhower Önceliklendirme Çeyreği
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(['q1', 'q2', 'q3', 'q4'] as EisenhowerQuadrant[]).map((q) => {
                const config = EISENHOWER_CONFIG[q];
                const isSelected = selectedQuadrant === q;
                return (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setSelectedQuadrant(q)}
                    className={`p-2 rounded-xl text-left border text-xs transition-all ${
                      isSelected
                        ? `${config.borderColor} ${config.bgColor} font-bold shadow-xs`
                        : `border-transparent bg-black/5 opacity-70 hover:opacity-100 ${t.primaryText}`
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: config.color }}
                      />
                      <span className="font-mono text-[11px] font-black" style={{ color: config.color }}>
                        {config.code}
                      </span>
                    </div>
                    <div className="text-[10px] font-semibold truncate leading-tight">
                      {config.title}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Optional Course Association */}
          {courses.length > 0 && (
            <div>
              <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${t.secondaryText}`}>
                İlişkili Ders (Opsiyonel)
              </label>
              <div className="flex flex-wrap items-center gap-1.5 max-h-24 overflow-y-auto">
                <button
                  type="button"
                  onClick={() => setSelectedCourseId('')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                    !selectedCourseId
                      ? `${t.accentTargetBg} ${t.accentTargetText} border-transparent shadow-xs`
                      : `border-transparent bg-black/5 opacity-70 ${t.primaryText}`
                  }`}
                >
                  Ders Yok
                </button>
                {courses.map((course) => (
                  <button
                    key={course.id}
                    type="button"
                    onClick={() => setSelectedCourseId(course.id)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                      selectedCourseId === course.id
                        ? 'shadow-xs font-bold'
                        : 'border-transparent bg-black/5 opacity-70 hover:opacity-100'
                    }`}
                    style={
                      selectedCourseId === course.id
                        ? {
                            backgroundColor: `${course.color}20`,
                            borderColor: course.color,
                            color: course.color,
                          }
                        : undefined
                    }
                  >
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: course.color }}
                    />
                    <span className={selectedCourseId === course.id ? '' : t.primaryText}>
                      {course.code}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl border ${t.border} ${t.primaryText}`}
            >
              İptal
            </button>
            <button
              type="submit"
              className={`px-4 py-1.5 text-xs font-semibold rounded-xl shadow-xs ${t.accentTargetBg} ${t.accentTargetText} hover:opacity-90`}
            >
              Listeye Ekle
            </button>
          </div>
        </form>
      )}

      {/* Filter Tabs for List View */}
      {viewMode === 'list' && tasks.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 mb-3 pb-2 border-b border-zinc-200/10 text-xs">
          <button
            onClick={() => setFilterQuadrant('all')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
              filterQuadrant === 'all'
                ? `${t.accentTargetBg} ${t.accentTargetText} shadow-xs`
                : `${t.secondaryText} hover:${t.primaryText}`
            }`}
          >
            Tümü ({tasks.length})
          </button>
          {(['q1', 'q2', 'q3', 'q4'] as EisenhowerQuadrant[]).map((q) => {
            const count = tasks.filter((t) => t.quadrant === q).length;
            const config = EISENHOWER_CONFIG[q];
            return (
              <button
                key={q}
                onClick={() => setFilterQuadrant(q)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-semibold transition-all ${
                  filterQuadrant === q
                    ? `${config.bgColor} font-bold`
                    : `${t.secondaryText} hover:${t.primaryText}`
                }`}
                style={filterQuadrant === q ? { color: config.color } : undefined}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: config.color }}
                />
                <span>{config.code}</span>
                <span className="text-[10px] opacity-70">({count})</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Content: List Mode or 2x2 Matrix Mode */}
      {viewMode === 'list' ? (
        <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1 custom-scrollbar">
          {filteredTasks.length > 0 ? (
            filteredTasks.map((task) => {
              const qConfig = EISENHOWER_CONFIG[task.quadrant];
              const course = getCourse(task.courseId);
              const isActiveFocus = activeFocusTaskId === task.id;

              return (
                <div
                  key={task.id}
                  className={`group relative flex items-center justify-between p-3 rounded-2xl border transition-all ${
                    isActiveFocus
                      ? 'ring-2 ring-emerald-500 bg-emerald-500/5'
                      : `${t.border} hover:bg-black/[0.02]`
                  }`}
                  style={{
                    borderLeftColor: qConfig.color,
                    borderLeftWidth: '4px',
                  }}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0 pr-2">
                    {/* Checkbox */}
                    <div
                      onClick={() => onToggleTask(task.id)}
                      className={`w-5 h-5 rounded-lg shrink-0 transition-all border cursor-pointer flex items-center justify-center shadow-xs ${
                        task.completed
                          ? 'bg-emerald-500 border-emerald-500 text-white'
                          : `${t.border} bg-transparent hover:border-emerald-500`
                      }`}
                    >
                      {task.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>

                    {/* Task Title & Metadata */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-sm leading-snug break-words transition-colors ${
                            task.completed
                              ? `line-through opacity-40 ${t.secondaryText}`
                              : `font-medium ${t.primaryText}`
                          }`}
                        >
                          {task.text}
                        </span>

                        {isActiveFocus && (
                          <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-emerald-500 text-white tracking-wider animate-pulse">
                            Hedef
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 mt-1 text-[10px] font-semibold opacity-80">
                        {/* Eisenhower Quadrant Pill */}
                        <span
                          className="px-1.5 py-0.5 rounded font-mono font-bold"
                          style={{
                            backgroundColor: `${qConfig.color}15`,
                            color: qConfig.color,
                          }}
                        >
                          {qConfig.code}: {qConfig.tag}
                        </span>

                        {/* Associated Course */}
                        {course && (
                          <span
                            className="flex items-center gap-1 px-1.5 py-0.5 rounded"
                            style={{
                              backgroundColor: `${course.color}15`,
                              color: course.color,
                            }}
                          >
                            <span
                              className="w-1.5 h-1.5 rounded-full"
                              style={{ backgroundColor: course.color }}
                            />
                            <span>{course.code}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions: "Görevden Sayaca Odaklan" & Delete */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => onFocusTask(task)}
                      className={`px-2.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                        isActiveFocus
                          ? 'bg-emerald-500 text-white border-emerald-500 shadow-xs'
                          : `${t.border} hover:bg-emerald-500/10 text-emerald-600`
                      }`}
                      title="Bu görevi sayaca bağla ve hemen odaklan"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span className="text-[11px] font-bold hidden sm:inline">Odaklan</span>
                    </button>

                    <button
                      onClick={() => onDeleteTask(task.id)}
                      className={`p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity ${t.secondaryText} hover:text-red-500 hover:bg-red-500/10`}
                      title="Görevi Sil"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className={`py-10 text-center text-xs ${t.secondaryText}`}>
              Bu filtreye uygun görev bulunmuyor. Yeni bir görev ekleyin!
            </div>
          )}
        </div>
      ) : (
        /* 2x2 Matrix View */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[460px] overflow-y-auto pr-1 custom-scrollbar">
          {(['q1', 'q2', 'q3', 'q4'] as EisenhowerQuadrant[]).map((q) => {
            const config = EISENHOWER_CONFIG[q];
            const qTasks = tasks.filter((t) => t.quadrant === q);

            return (
              <div
                key={q}
                className={`p-4 rounded-2xl border flex flex-col justify-between transition-all ${t.cardBg} ${t.border}`}
                style={{
                  borderTopColor: config.color,
                  borderTopWidth: '4px',
                }}
              >
                <div>
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-200/15">
                    <div className="flex items-center gap-2">
                      <span
                        className="px-1.5 py-0.5 rounded font-mono font-bold text-xs"
                        style={{
                          backgroundColor: `${config.color}20`,
                          color: config.color,
                        }}
                      >
                        {config.code}
                      </span>
                      <span className={`text-xs font-bold ${t.primaryText}`}>{config.title}</span>
                    </div>
                    <span className={`text-[10px] font-semibold ${t.secondaryText}`}>
                      {qTasks.length} görev
                    </span>
                  </div>
                  <p className={`text-[10px] mb-3 ${t.secondaryText}`}>{config.subtitle}</p>

                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1 custom-scrollbar">
                    {qTasks.map((task) => (
                      <div
                        key={task.id}
                        className={`flex items-center justify-between p-2 rounded-xl text-xs border transition-all ${
                          task.completed ? 'opacity-50 line-through' : ''
                        } ${t.border} bg-black/[0.01]`}
                      >
                        <div
                          className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer"
                          onClick={() => onToggleTask(task.id)}
                        >
                          <div
                            className={`w-3.5 h-3.5 rounded shrink-0 border flex items-center justify-center ${
                              task.completed ? 'bg-emerald-500 border-emerald-500 text-white' : t.border
                            }`}
                          >
                            {task.completed && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                          </div>
                          <span className={`truncate ${t.primaryText}`}>{task.text}</span>
                        </div>

                        <button
                          onClick={() => onFocusTask(task)}
                          className="p-1 rounded-lg text-emerald-600 hover:bg-emerald-500/10 ml-2"
                          title="Sayaca bağla"
                        >
                          <Play className="w-3 h-3 fill-current" />
                        </button>
                      </div>
                    ))}
                    {qTasks.length === 0 && (
                      <span className={`text-[11px] italic block text-center py-2 ${t.secondaryText}`}>
                        Bu çeyrekte görev yok
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
