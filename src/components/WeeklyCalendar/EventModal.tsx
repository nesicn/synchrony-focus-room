import React, { useState, useEffect } from 'react';
import { X, GraduationCap, FlaskConical, FileText, Target, Trash2 } from 'lucide-react';
import { CalendarEvent, CalendarEventType, Course, DAYS_OF_WEEK, EVENT_TYPE_CONFIG } from '../../types/academic';
import { ThemeConfig } from '../../theme';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (eventData: Omit<CalendarEvent, 'id'>) => void;
  onUpdate?: (id: string, updates: Partial<CalendarEvent>) => void;
  onDelete?: (id: string) => void;
  editingEvent?: CalendarEvent | null;
  initialDay?: number;
  initialStartTime?: string;
  courses: Course[];
  onOpenNewCourseModal: () => void;
  t: ThemeConfig;
}

export const EventModal: React.FC<EventModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onUpdate,
  onDelete,
  editingEvent,
  initialDay = 0,
  initialStartTime = '09:00',
  courses,
  onOpenNewCourseModal,
  t,
}) => {
  const [title, setTitle] = useState('');
  const [courseId, setCourseId] = useState('');
  const [type, setType] = useState<CalendarEventType>('lecture');
  const [dayOfWeek, setDayOfWeek] = useState<number>(initialDay);
  const [startTime, setStartTime] = useState<string>(initialStartTime);
  const [endTime, setEndTime] = useState<string>('10:30');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState('');

  useEffect(() => {
    if (editingEvent) {
      setTitle(editingEvent.title);
      setCourseId(editingEvent.courseId);
      setType(editingEvent.type);
      setDayOfWeek(editingEvent.dayOfWeek);
      setStartTime(editingEvent.startTime);
      setEndTime(editingEvent.endTime);
      setLocation(editingEvent.location || '');
      setNotes(editingEvent.notes || '');
      setDate(editingEvent.date || '');
    } else {
      setTitle('');
      setCourseId(courses.length > 0 ? courses[0].id : '');
      setType('lecture');
      setDayOfWeek(initialDay);
      setStartTime(initialStartTime);
      
      // Calculate default end time: start time + 1 hour 30 mins
      const [sh, sm] = initialStartTime.split(':').map(Number);
      const endHourNum = (sh + 1) % 24;
      const endMinuteStr = (sm === 0 ? '30' : sm === 30 ? '00' : '00');
      const adjustedHour = sm === 30 ? (endHourNum + 1) % 24 : endHourNum;
      setEndTime(`${adjustedHour.toString().padStart(2, '0')}:${endMinuteStr}`);
      
      setLocation('');
      setNotes('');
      setDate('');
    }
  }, [editingEvent, isOpen, initialDay, initialStartTime, courses]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() && !courseId) return;

    const selectedCourse = courses.find(c => c.id === courseId);
    const finalTitle = title.trim() || (selectedCourse ? `${selectedCourse.code} ${EVENT_TYPE_CONFIG[type].shortLabel}` : 'Akademik Etkinlik');

    const eventData: Omit<CalendarEvent, 'id'> = {
      title: finalTitle,
      courseId,
      type,
      dayOfWeek,
      startTime,
      endTime,
      location: location.trim() || undefined,
      notes: notes.trim() || undefined,
      date: date || undefined,
    };

    if (editingEvent && onUpdate) {
      onUpdate(editingEvent.id, eventData);
    } else {
      onSave(eventData);
    }
    onClose();
  };

  const handleDelete = () => {
    if (editingEvent && onDelete) {
      onDelete(editingEvent.id);
      onClose();
    }
  };

  const selectedCourse = courses.find(c => c.id === courseId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div
        className={`w-full max-w-lg rounded-2xl border p-6 shadow-xl transition-all ${t.cardBg} ${t.border}`}
      >
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-zinc-200/20">
          <div>
            <h3 className={`text-base font-bold tracking-tight ${t.primaryText}`}>
              {editingEvent ? 'Etkinliği / Dersi Düzenle' : 'Yeni Ders veya Etkinlik Ekle'}
            </h3>
            <p className={`text-xs ${t.secondaryText}`}>
              Haftalık programa ders saati, laboratuvar, ödev teslimi veya sınav ekleyin
            </p>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg opacity-70 hover:opacity-100 transition-opacity ${t.secondaryHover} ${t.primaryText}`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Event Type Selector */}
          <div>
            <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${t.secondaryText}`}>
              Kayıt Türü
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setType('lecture')}
                className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-semibold border transition-all ${
                  type === 'lecture'
                    ? 'bg-blue-500/15 border-blue-500 text-blue-500 shadow-xs'
                    : `border-transparent ${t.inputBox} opacity-70 hover:opacity-100 ${t.primaryText}`
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5" />
                <span>Ders Saati</span>
              </button>

              <button
                type="button"
                onClick={() => setType('lab')}
                className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-semibold border transition-all ${
                  type === 'lab'
                    ? 'bg-emerald-500/15 border-emerald-500 text-emerald-500 shadow-xs'
                    : `border-transparent ${t.inputBox} opacity-70 hover:opacity-100 ${t.primaryText}`
                }`}
              >
                <FlaskConical className="w-3.5 h-3.5" />
                <span>Laboratuvar</span>
              </button>

              <button
                type="button"
                onClick={() => setType('deadline')}
                className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-semibold border transition-all ${
                  type === 'deadline'
                    ? 'bg-amber-500/15 border-amber-500 text-amber-500 shadow-xs'
                    : `border-transparent ${t.inputBox} opacity-70 hover:opacity-100 ${t.primaryText}`
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Ödev Teslimi</span>
              </button>

              <button
                type="button"
                onClick={() => setType('exam')}
                className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-semibold border transition-all ${
                  type === 'exam'
                    ? 'bg-red-500/15 border-red-500 text-red-500 shadow-xs'
                    : `border-transparent ${t.inputBox} opacity-70 hover:opacity-100 ${t.primaryText}`
                }`}
              >
                <Target className="w-3.5 h-3.5" />
                <span>Sınav Tarihi</span>
              </button>
            </div>
          </div>

          {/* Course Selection */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className={`text-xs font-semibold uppercase tracking-wider ${t.secondaryText}`}>
                İlişkili Ders <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={onOpenNewCourseModal}
                className="text-xs font-semibold text-blue-500 hover:underline"
              >
                + Yeni Ders Oluştur
              </button>
            </div>

            {courses.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-32 overflow-y-auto pr-1">
                {courses.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCourseId(c.id)}
                    className={`flex items-center gap-2 p-2 rounded-xl text-left border transition-all ${
                      courseId === c.id
                        ? `${t.border} shadow-xs font-bold`
                        : `border-transparent ${t.inputBox} opacity-70 hover:opacity-100`
                    }`}
                  >
                    <span
                      className="w-3 h-3 rounded-full shrink-0 shadow-xs"
                      style={{ backgroundColor: c.color }}
                    />
                    <span className={`text-xs truncate ${t.primaryText}`}>{c.code}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div
                onClick={onOpenNewCourseModal}
                className={`p-3 rounded-xl border border-dashed text-center cursor-pointer ${t.border} ${t.secondaryText} text-xs hover:border-blue-500`}
              >
                Henüz ders tanımlanmamış. Buraya tıklayarak ilk dersinizi ekleyin.
              </div>
            )}
          </div>

          {/* Title */}
          <div>
            <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${t.secondaryText}`}>
              Başlık / Konu
            </label>
            <input
              type="text"
              placeholder={selectedCourse ? `${selectedCourse.code} Dersi / Çalışması` : "Ders veya çalışma konusu girin"}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-medium outline-none transition-all ${t.inputBox} ${t.border} ${t.primaryText} focus:ring-1 focus:${t.accentBorder}`}
            />
          </div>

          {/* Day & Time Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${t.secondaryText}`}>
                Haftanın Günü
              </label>
              <select
                value={dayOfWeek}
                onChange={(e) => setDayOfWeek(Number(e.target.value))}
                className={`w-full px-3 py-2 rounded-xl border text-xs font-semibold outline-none transition-all ${t.inputBox} ${t.border} ${t.primaryText}`}
              >
                {DAYS_OF_WEEK.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${t.secondaryText}`}>
                Başlangıç Saati
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl border text-xs font-mono font-semibold outline-none transition-all ${t.inputBox} ${t.border} ${t.primaryText}`}
              />
            </div>

            <div>
              <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${t.secondaryText}`}>
                Bitiş Saati
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl border text-xs font-mono font-semibold outline-none transition-all ${t.inputBox} ${t.border} ${t.primaryText}`}
              />
            </div>
          </div>

          {/* Location & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${t.secondaryText}`}>
                Derslik / Konum (Opsiyonel)
              </label>
              <input
                type="text"
                placeholder={selectedCourse?.room || "Derslik, salon veya bağlantı"}
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl border text-xs outline-none transition-all ${t.inputBox} ${t.border} ${t.primaryText}`}
              />
            </div>

            <div>
              <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${t.secondaryText}`}>
                Özel Tarih (Sınav/Teslim için)
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl border text-xs font-mono outline-none transition-all ${t.inputBox} ${t.border} ${t.primaryText}`}
              />
            </div>
          </div>

          <div>
            <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${t.secondaryText}`}>
              Notlar / Açıklama (Opsiyonel)
            </label>
            <input
              type="text"
              placeholder="Ders veya etkinlik notları..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className={`w-full px-3 py-2 rounded-xl border text-xs outline-none transition-all ${t.inputBox} ${t.border} ${t.primaryText}`}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-zinc-200/20">
            {editingEvent ? (
              <button
                type="button"
                onClick={handleDelete}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Sil</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className={`px-4 py-2 text-xs font-semibold rounded-xl border transition-all ${t.border} ${t.secondaryHover} ${t.primaryText}`}
              >
                İptal
              </button>
              <button
                type="submit"
                disabled={!courseId}
                className={`px-5 py-2 text-xs font-semibold rounded-xl shadow-xs transition-all disabled:opacity-50 ${t.accentTargetBg} ${t.accentTargetText} hover:opacity-90`}
              >
                {editingEvent ? 'Güncelle' : 'Programa Ekle'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
