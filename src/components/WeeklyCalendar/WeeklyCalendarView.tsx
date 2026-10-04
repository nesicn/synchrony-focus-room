import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Calendar as CalendarIcon, 
  Clock, 
  BookOpen, 
  GraduationCap, 
  FlaskConical, 
  FileText, 
  Target, 
  Edit3, 
  Trash2, 
  Play, 
  Filter, 
  Settings2, 
  ChevronLeft, 
  ChevronRight,
  MapPin,
  AlertCircle
} from 'lucide-react';
import { useAcademic } from '../../context/AcademicContext';
import { CalendarEvent, Course, DAYS_OF_WEEK, EVENT_TYPE_CONFIG } from '../../types/academic';
import { CourseModal } from './CourseModal';
import { EventModal } from './EventModal';
import { ThemeConfig } from '../../theme';

interface WeeklyCalendarViewProps {
  t: ThemeConfig;
}

export const WeeklyCalendarView: React.FC<WeeklyCalendarViewProps> = ({ t }) => {
  const {
    courses,
    events,
    addCourse,
    updateCourse,
    deleteCourse,
    getCourseById,
    addEvent,
    updateEvent,
    deleteEvent,
    moveEvent,
    weekViewDays,
    setWeekViewDays,
    startHour,
    setStartHour,
    endHour,
    setEndHour,
    filterCourseId,
    setFilterCourseId,
    startTimerForCourse,
  } = useAcademic();

  // Modals state
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);

  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<{ day: number; time: string }>({
    day: 0,
    time: '09:00',
  });

  // Drag and Drop state
  const [draggedEventId, setDraggedEventId] = useState<string | null>(null);
  const [dragOverSlot, setDragOverSlot] = useState<{ day: number; hour: number } | null>(null);

  // Settings toggle
  const [showSettings, setShowSettings] = useState(false);

  // Filtered days list (5 days: Mon-Fri vs 7 days: Mon-Sun)
  const displayedDays = useMemo(() => {
    return DAYS_OF_WEEK.slice(0, weekViewDays);
  }, [weekViewDays]);

  // Generate hourly slots
  const hours = useMemo(() => {
    const list: number[] = [];
    for (let h = startHour; h < endHour; h++) {
      list.push(h);
    }
    return list;
  }, [startHour, endHour]);

  // Filtered events
  const filteredEvents = useMemo(() => {
    if (!filterCourseId) return events;
    return events.filter(e => e.courseId === filterCourseId);
  }, [events, filterCourseId]);

  // Upcoming deadlines or exams
  const upcomingSpecialEvents = useMemo(() => {
    return events
      .filter(e => e.type === 'deadline' || e.type === 'exam')
      .slice(0, 4);
  }, [events]);

  // Click on empty cell
  const handleCellClick = (dayId: number, hour: number) => {
    const timeStr = `${hour.toString().padStart(2, '0')}:00`;
    setSelectedSlot({ day: dayId, time: timeStr });
    setEditingEvent(null);
    setIsEventModalOpen(true);
  };

  // Drag & drop handlers
  const handleDragStart = (e: React.DragEvent, eventId: string) => {
    e.dataTransfer.setData('text/plain', eventId);
    setDraggedEventId(eventId);
  };

  const handleDragOver = (e: React.DragEvent, dayId: number, hour: number) => {
    e.preventDefault();
    setDragOverSlot({ day: dayId, hour });
  };

  const handleDragLeave = () => {
    setDragOverSlot(null);
  };

  const handleDrop = (e: React.DragEvent, dayId: number, targetHour: number) => {
    e.preventDefault();
    setDragOverSlot(null);
    const eventId = e.dataTransfer.getData('text/plain') || draggedEventId;
    if (!eventId) return;

    const event = events.find(ev => ev.id === eventId);
    if (!event) return;

    // Calculate duration to preserve length
    const [startH, startM] = event.startTime.split(':').map(Number);
    const [endH, endM] = event.endTime.split(':').map(Number);
    const durationMinutes = (endH * 60 + endM) - (startH * 60 + startM);

    const newStartHour = targetHour;
    const newStartMin = startM || 0;
    const newEndTotalMins = newStartHour * 60 + newStartMin + (durationMinutes > 0 ? durationMinutes : 60);

    const newEndHour = Math.min(23, Math.floor(newEndTotalMins / 60));
    const newEndMin = newEndTotalMins % 60;

    const newStartTimeStr = `${newStartHour.toString().padStart(2, '0')}:${newStartMin.toString().padStart(2, '0')}`;
    const newEndTimeStr = `${newEndHour.toString().padStart(2, '0')}:${newEndMin.toString().padStart(2, '0')}`;

    moveEvent(eventId, dayId, newStartTimeStr, newEndTimeStr);
    setDraggedEventId(null);
  };

  const openEditEvent = (event: CalendarEvent, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingEvent(event);
    setIsEventModalOpen(true);
  };

  const openNewCourse = () => {
    setEditingCourse(null);
    setIsCourseModalOpen(true);
  };

  const openEditCourse = (course: Course, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingCourse(course);
    setIsCourseModalOpen(true);
  };

  // Helper icon renderer
  const renderEventTypeIcon = (type: CalendarEvent['type']) => {
    switch (type) {
      case 'lecture':
        return <GraduationCap className="w-3.5 h-3.5 shrink-0" />;
      case 'lab':
        return <FlaskConical className="w-3.5 h-3.5 shrink-0" />;
      case 'deadline':
        return <FileText className="w-3.5 h-3.5 shrink-0" />;
      case 'exam':
        return <Target className="w-3.5 h-3.5 shrink-0" />;
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-[1500px] mx-auto">
      {/* Top Action & View Toolbar */}
      <div
        className={`p-4 md:p-6 rounded-3xl border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors duration-500 ${t.cardBg} ${t.border} ${t.shadow}`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-white transition-colors shadow-xs ${t.iconBg} ${t.iconText}`}
          >
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className={`text-base font-bold tracking-tight ${t.primaryText}`}>
              Haftalık Ders Programı & Etkinlik Çizelgesi
            </h2>
            <p className={`text-xs ${t.secondaryText}`}>
              Google Calendar tarzı interaktif program: Saatlere tıklayın, sürükleyip bırakın veya derslerinize odaklanın
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Week View Toggle (5 days vs 7 days) */}
          <div className={`flex items-center p-1 rounded-xl border ${t.border} ${t.inputBox}`}>
            <button
              onClick={() => setWeekViewDays(5)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                weekViewDays === 5
                  ? `${t.cardBg} ${t.primaryText} shadow-xs`
                  : `${t.secondaryText} hover:${t.primaryText}`
              }`}
            >
              5 Gün (Hafta İçi)
            </button>
            <button
              onClick={() => setWeekViewDays(7)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                weekViewDays === 7
                  ? `${t.cardBg} ${t.primaryText} shadow-xs`
                  : `${t.secondaryText} hover:${t.primaryText}`
              }`}
            >
              7 Gün (Tüm Hafta)
            </button>
          </div>

          {/* Time Span Configuration Toggle */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2 rounded-xl border text-xs font-semibold transition-all flex items-center gap-1.5 ${
              showSettings ? `${t.accentTargetBg} ${t.accentTargetText}` : `${t.border} ${t.secondaryHover} ${t.primaryText}`
            }`}
            title="Çizelge Saat Aralığını Ayarla"
          >
            <Settings2 className="w-4 h-4" />
            <span className="hidden sm:inline">Saatler</span>
          </button>

          {/* New Event Button */}
          <button
            onClick={() => {
              setEditingEvent(null);
              setSelectedSlot({ day: 0, time: '09:00' });
              setIsEventModalOpen(true);
            }}
            className={`px-4 py-2 text-xs font-semibold rounded-xl flex items-center gap-2 shadow-xs transition-all ${t.accentTargetBg} ${t.accentTargetText} hover:opacity-90`}
          >
            <Plus className="w-4 h-4" />
            <span>Etkinlik / Ders Ekle</span>
          </button>
        </div>
      </div>

      {/* Expandable Hour Span Settings (Dynamic Rows / Hours Configuration) */}
      {showSettings && (
        <div
          className={`p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-4 transition-all ${t.cardBg} ${t.border} ${t.shadow}`}
        >
          <div className="flex items-center gap-2">
            <Clock className={`w-4 h-4 ${t.secondaryText}`} />
            <span className={`text-xs font-bold uppercase tracking-wider ${t.primaryText}`}>
              Çizelge Saat Aralığı (Satır Ayarı):
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className={`text-xs ${t.secondaryText}`}>Başlangıç Saati:</span>
              <select
                value={startHour}
                onChange={(e) => setStartHour(Math.min(Number(e.target.value), endHour - 2))}
                className={`px-2.5 py-1 text-xs font-mono font-semibold rounded-lg border outline-none ${t.inputBox} ${t.border} ${t.primaryText}`}
              >
                {[6, 7, 8, 9, 10].map((h) => (
                  <option key={h} value={h}>
                    {h.toString().padStart(2, '0')}:00
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className={`text-xs ${t.secondaryText}`}>Bitiş Saati:</span>
              <select
                value={endHour}
                onChange={(e) => setEndHour(Math.max(Number(e.target.value), startHour + 2))}
                className={`px-2.5 py-1 text-xs font-mono font-semibold rounded-lg border outline-none ${t.inputBox} ${t.border} ${t.primaryText}`}
              >
                {[18, 19, 20, 21, 22, 23, 24].map((h) => (
                  <option key={h} value={h}>
                    {h.toString().padStart(2, '0')}:00
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: Left Panel (Ders Listesi & Legend) + Right Area (Calendar Matrix) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Sidebar: Sol Üstte Her Dersi Gösteren Liste & Yönetim Paneli */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          
          {/* Courses List Card */}
          <div
            className={`p-5 rounded-3xl border flex flex-col transition-colors duration-500 ${t.cardBg} ${t.border} ${t.shadow}`}
          >
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-200/20">
              <div className="flex items-center gap-2">
                <BookOpen className={`w-4 h-4 ${t.primaryText}`} />
                <h3 className={`text-xs font-bold uppercase tracking-wider ${t.primaryText}`}>
                  Derslerim ({courses.length})
                </h3>
              </div>
              <button
                onClick={openNewCourse}
                className={`p-1.5 rounded-lg border text-xs font-semibold transition-all flex items-center gap-1 ${t.border} ${t.secondaryHover} ${t.primaryText}`}
                title="Yeni Ders Tanımla"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Ders Ekle</span>
              </button>
            </div>

            {/* Filter Reset if active */}
            {filterCourseId && (
              <div className="mb-3 flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/20">
                <span className="text-[11px] font-semibold text-blue-500">Filtre Aktif</span>
                <button
                  onClick={() => setFilterCourseId(null)}
                  className="text-[10px] font-bold underline text-blue-500 hover:text-blue-600"
                >
                  Tümünü Göster
                </button>
              </div>
            )}

            {/* Courses Items */}
            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1 custom-scrollbar">
              {courses.map((course) => {
                const courseEvents = events.filter((e) => e.courseId === course.id);
                const isFiltered = filterCourseId === course.id;

                return (
                  <div
                    key={course.id}
                    className={`group relative flex items-center justify-between p-3 rounded-2xl border transition-all ${
                      isFiltered
                        ? 'ring-2 ring-blue-500 bg-blue-500/5'
                        : `${t.border} hover:bg-black/5`
                    }`}
                  >
                    <div
                      className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer"
                      onClick={() => setFilterCourseId(isFiltered ? null : course.id)}
                      title="Bu dersin etkinliklerini filtrele"
                    >
                      {/* Color indicator dot */}
                      <div
                        className="w-3.5 h-3.5 rounded-full shrink-0 shadow-xs"
                        style={{ backgroundColor: course.color }}
                      />
                      <div className="truncate flex-1">
                        <div className={`text-xs font-bold truncate ${t.primaryText}`}>
                          {course.code}
                        </div>
                        <div className={`text-[10px] truncate ${t.secondaryText}`}>
                          {course.name} • {courseEvents.length} kayıt
                        </div>
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      {/* Quick Start Focus for this course */}
                      <button
                        onClick={() => startTimerForCourse(course.id)}
                        className={`p-1.5 rounded-lg border text-xs transition-colors ${t.border} hover:bg-emerald-500/10 text-emerald-600`}
                        title={`${course.code} için Odaklanma Başlat`}
                        aria-label="Start Focus Session"
                      >
                        <Play className="w-3 h-3 fill-current" />
                      </button>

                      {/* Edit Course */}
                      <button
                        onClick={(e) => openEditCourse(course, e)}
                        className={`p-1.5 rounded-lg border text-xs transition-colors ${t.border} ${t.secondaryHover} ${t.secondaryText} hover:${t.primaryText}`}
                        title="Dersi Düzenle"
                        aria-label="Edit Course"
                      >
                        <Edit3 className="w-3 h-3" />
                      </button>

                      {/* Delete Course */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteCourse(course.id);
                        }}
                        className={`p-1.5 rounded-lg border text-xs transition-colors ${t.border} hover:bg-red-500/10 text-red-500`}
                        title="Dersi Sil"
                        aria-label="Delete Course"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}

              {courses.length === 0 && (
                <div className={`text-center py-8 px-3 rounded-2xl border border-dashed ${t.border}`}>
                  <BookOpen className={`w-8 h-8 mx-auto mb-2 opacity-40 ${t.primaryText}`} />
                  <p className={`text-xs font-semibold ${t.primaryText} mb-1`}>Henüz ders tanımlanmadı</p>
                  <p className={`text-[11px] ${t.secondaryText} mb-3`}>
                    Derslerinizi ve özel renklerinizi ekleyerek programınızı özelleştirin.
                  </p>
                  <button
                    onClick={openNewCourse}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold shadow-xs transition-all ${t.accentTargetBg} ${t.accentTargetText} hover:opacity-90`}
                  >
                    + İlk Dersini Ekle
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Event Types Legend Card */}
          <div
            className={`p-5 rounded-3xl border flex flex-col transition-colors duration-500 ${t.cardBg} ${t.border} ${t.shadow}`}
          >
            <h3 className={`text-xs font-bold uppercase tracking-wider mb-3 ${t.primaryText}`}>
              Kayıt Türleri
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-xl bg-blue-500/10 text-blue-600 font-medium">
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4" />
                  <span>Ders Saati (Lecture)</span>
                </div>
                <span className="text-[11px] font-bold">
                  {events.filter((e) => e.type === 'lecture').length}
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-500/10 text-emerald-600 font-medium">
                <div className="flex items-center gap-2">
                  <FlaskConical className="w-4 h-4" />
                  <span>Laboratuvar (Lab)</span>
                </div>
                <span className="text-[11px] font-bold">
                  {events.filter((e) => e.type === 'lab').length}
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-amber-500/10 text-amber-600 font-medium">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  <span>Ödev Teslimi (Deadline)</span>
                </div>
                <span className="text-[11px] font-bold">
                  {events.filter((e) => e.type === 'deadline').length}
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-red-500/10 text-red-600 font-medium">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  <span>Sınav Tarihi (Exam)</span>
                </div>
                <span className="text-[11px] font-bold">
                  {events.filter((e) => e.type === 'exam').length}
                </span>
              </div>
            </div>
          </div>

          {/* Upcoming Deadlines & Exams Card */}
          {upcomingSpecialEvents.length > 0 && (
            <div
              className={`p-5 rounded-3xl border flex flex-col transition-colors duration-500 ${t.cardBg} ${t.border} ${t.shadow}`}
            >
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                <h3 className={`text-xs font-bold uppercase tracking-wider ${t.primaryText}`}>
                  Yaklaşan Teslim ve Sınavlar
                </h3>
              </div>
              <div className="space-y-2.5">
                {upcomingSpecialEvents.map((evt) => {
                  const course = getCourseById(evt.courseId);
                  const dayName = DAYS_OF_WEEK[evt.dayOfWeek]?.name;
                  return (
                    <div
                      key={evt.id}
                      onClick={() => {
                        setEditingEvent(evt);
                        setIsEventModalOpen(true);
                      }}
                      className={`p-2.5 rounded-xl border text-xs cursor-pointer hover:shadow-xs transition-all ${
                        evt.type === 'exam'
                          ? 'border-red-500/30 bg-red-500/5'
                          : 'border-amber-500/30 bg-amber-500/5'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={`font-bold ${t.primaryText}`}>{evt.title}</span>
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                            evt.type === 'exam'
                              ? 'bg-red-500 text-white'
                              : 'bg-amber-500 text-white'
                          }`}
                        >
                          {evt.type === 'exam' ? 'Sınav' : 'Deadline'}
                        </span>
                      </div>
                      <div className={`text-[10px] flex items-center justify-between ${t.secondaryText}`}>
                        <span>{course?.code}</span>
                        <span>
                          {dayName} {evt.startTime}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Area: Interactive Google Calendar Timetable Grid */}
        <div className="lg:col-span-9 flex flex-col">
          {events.length === 0 && (
            <div className="mb-3 px-4 py-2.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-between text-xs">
              <span className="text-blue-500 font-medium">
                💡 <strong>İpucu:</strong> Çizelgedeki herhangi bir saat kutusuna tıklayarak haftalık ders saatlerinizi, laboratuvarlarınızı, sınav veya ödev teslimlerinizi ekleyebilirsiniz.
              </span>
              <button
                onClick={() => {
                  setEditingEvent(null);
                  setSelectedSlot({ day: 0, time: '09:00' });
                  setIsEventModalOpen(true);
                }}
                className="px-2.5 py-1 rounded-lg bg-blue-500 text-white font-bold text-[11px] shrink-0 hover:bg-blue-600 transition-colors ml-3"
              >
                + İlk Dersi Çizelgeye Ekle
              </button>
            </div>
          )}

          <div
            className={`rounded-3xl border overflow-hidden flex flex-col transition-colors duration-500 ${t.cardBg} ${t.border} ${t.shadow}`}
          >
            {/* Calendar Table Header (Days of week) */}
            <div
              className={`grid border-b transition-colors duration-500 ${t.border}`}
              style={{
                gridTemplateColumns: `64px repeat(${displayedDays.length}, minmax(130px, 1fr))`,
              }}
            >
              {/* Top-left empty corner */}
              <div
                className={`p-3 text-[10px] font-bold uppercase tracking-wider text-center border-r transition-colors ${t.border} ${t.secondaryText}`}
              >
                Saat
              </div>

              {/* Day Headers */}
              {displayedDays.map((day) => {
                // Today check (Monday is 1 in JS Date, so 0 in our 0-indexed Monday array)
                const currentDayIndex = (new Date().getDay() + 6) % 7;
                const isToday = day.id === currentDayIndex;

                return (
                  <div
                    key={day.id}
                    className={`p-3 text-center border-r last:border-r-0 transition-colors ${
                      t.border
                    } ${isToday ? 'bg-blue-500/5' : ''}`}
                  >
                    <div
                      className={`text-xs font-bold uppercase tracking-wider ${
                        isToday ? 'text-blue-500 font-black' : t.primaryText
                      }`}
                    >
                      {day.name}
                    </div>
                    {isToday && (
                      <span className="inline-block mt-0.5 text-[9px] font-bold uppercase tracking-wider text-blue-500">
                        Bugün
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Calendar Time Grid Body */}
            <div className="overflow-x-auto max-h-[750px] overflow-y-auto custom-scrollbar relative">
              <div
                className="grid relative"
                style={{
                  gridTemplateColumns: `64px repeat(${displayedDays.length}, minmax(130px, 1fr))`,
                }}
              >
                {/* Rows for each hour */}
                {hours.map((hour) => (
                  <React.Fragment key={hour}>
                    {/* Time Label Column */}
                    <div
                      className={`h-24 p-2 text-right border-r border-b text-[11px] font-mono font-medium select-none transition-colors ${t.border} ${t.secondaryText}`}
                    >
                      {hour.toString().padStart(2, '0')}:00
                    </div>

                    {/* Columns for each displayed day */}
                    {displayedDays.map((day) => {
                      const isDragOver =
                        dragOverSlot?.day === day.id && dragOverSlot?.hour === hour;

                      // Events starting in this hour slot for this day
                      const slotEvents = filteredEvents.filter((e) => {
                        if (e.dayOfWeek !== day.id) return false;
                        const [eh] = e.startTime.split(':').map(Number);
                        return eh === hour;
                      });

                      return (
                        <div
                          key={`${day.id}-${hour}`}
                          onClick={() => handleCellClick(day.id, hour)}
                          onDragOver={(e) => handleDragOver(e, day.id, hour)}
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => handleDrop(e, day.id, hour)}
                          className={`h-24 border-r border-b last:border-r-0 relative p-1 transition-all cursor-pointer group ${
                            t.border
                          } ${
                            isDragOver
                              ? 'bg-blue-500/20 ring-2 ring-blue-500 inset-0'
                              : 'hover:bg-black/[0.02]'
                          }`}
                        >
                          {/* Subtle plus icon on hover for fast addition */}
                          <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-40 transition-opacity p-0.5">
                            <Plus className="w-3.5 h-3.5" />
                          </div>

                          {/* Render Events */}
                          <div className="flex flex-col gap-1 w-full h-full overflow-hidden">
                            {slotEvents.map((evt) => {
                              const course = getCourseById(evt.courseId);
                              const courseColor = course?.color || '#3B82F6';

                              return (
                                <div
                                  key={evt.id}
                                  draggable
                                  onDragStart={(e) => handleDragStart(e, evt.id)}
                                  onClick={(e) => openEditEvent(evt, e)}
                                  className="w-full text-left p-1.5 rounded-xl border shadow-xs transition-transform hover:scale-[1.02] cursor-grab active:cursor-grabbing flex flex-col justify-between overflow-hidden"
                                  style={{
                                    backgroundColor: `${courseColor}18`,
                                    borderLeftColor: courseColor,
                                    borderLeftWidth: '4px',
                                    borderTopColor: `${courseColor}30`,
                                    borderRightColor: `${courseColor}30`,
                                    borderBottomColor: `${courseColor}30`,
                                  }}
                                >
                                  {/* Top header: Course code + Type Icon */}
                                  <div className="flex items-center justify-between gap-1">
                                    <span
                                      className="text-[11px] font-black tracking-tight truncate"
                                      style={{ color: courseColor }}
                                    >
                                      {course?.code || evt.title}
                                    </span>
                                    <span
                                      className="opacity-80"
                                      style={{ color: courseColor }}
                                      title={EVENT_TYPE_CONFIG[evt.type].label}
                                    >
                                      {renderEventTypeIcon(evt.type)}
                                    </span>
                                  </div>

                                  {/* Event Title if different from course code */}
                                  <div className={`text-[10px] font-semibold leading-tight truncate ${t.primaryText}`}>
                                    {evt.title}
                                  </div>

                                  {/* Bottom: Time & Room */}
                                  <div className={`text-[9px] flex items-center justify-between gap-1 opacity-70 ${t.primaryText}`}>
                                    <span className="font-mono">
                                      {evt.startTime}-{evt.endTime}
                                    </span>
                                    {evt.location && (
                                      <span className="truncate max-w-[50px] flex items-center gap-0.5">
                                        <MapPin className="w-2.5 h-2.5" />
                                        {evt.location}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Course Modal */}
      <CourseModal
        isOpen={isCourseModalOpen}
        onClose={() => {
          setIsCourseModalOpen(false);
          setEditingCourse(null);
        }}
        onSave={addCourse}
        onUpdate={updateCourse}
        editingCourse={editingCourse}
        t={t}
      />

      {/* Event Modal */}
      <EventModal
        isOpen={isEventModalOpen}
        onClose={() => {
          setIsEventModalOpen(false);
          setEditingEvent(null);
        }}
        onSave={addEvent}
        onUpdate={updateEvent}
        onDelete={deleteEvent}
        editingEvent={editingEvent}
        initialDay={selectedSlot.day}
        initialStartTime={selectedSlot.time}
        courses={courses}
        onOpenNewCourseModal={openNewCourse}
        t={t}
      />
    </div>
  );
};
