import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { Course, PRESET_COURSE_COLORS } from '../../types/academic';
import { ThemeConfig } from '../../theme';

interface CourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (courseData: Omit<Course, 'id'>) => void;
  onUpdate?: (id: string, updates: Partial<Course>) => void;
  editingCourse?: Course | null;
  t: ThemeConfig;
}

export const CourseModal: React.FC<CourseModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onUpdate,
  editingCourse,
  t,
}) => {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [color, setColor] = useState(PRESET_COURSE_COLORS[0]);
  const [instructor, setInstructor] = useState('');
  const [room, setRoom] = useState('');
  const [customColorInput, setCustomColorInput] = useState('');

  useEffect(() => {
    if (editingCourse) {
      setCode(editingCourse.code);
      setName(editingCourse.name);
      setColor(editingCourse.color);
      setInstructor(editingCourse.instructor || '');
      setRoom(editingCourse.room || '');
      setCustomColorInput(editingCourse.color);
    } else {
      setCode('');
      setName('');
      setColor(PRESET_COURSE_COLORS[Math.floor(Math.random() * PRESET_COURSE_COLORS.length)]);
      setInstructor('');
      setRoom('');
      setCustomColorInput('');
    }
  }, [editingCourse, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    const courseData: Omit<Course, 'id'> = {
      code: code.trim(),
      name: name.trim() || code.trim(),
      color: customColorInput || color,
      instructor: instructor.trim() || undefined,
      room: room.trim() || undefined,
    };

    if (editingCourse && onUpdate) {
      onUpdate(editingCourse.id, courseData);
    } else {
      onSave(courseData);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div
        className={`w-full max-w-md rounded-2xl border p-6 shadow-xl transition-all ${t.cardBg} ${t.border}`}
      >
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-zinc-200/20">
          <div>
            <h3 className={`text-base font-bold tracking-tight ${t.primaryText}`}>
              {editingCourse ? 'Dersi Düzenle' : 'Yeni Ders Tanımla'}
            </h3>
            <p className={`text-xs ${t.secondaryText}`}>
              Haftalık program ve zamanlayıcıda kullanılacak ders detayları
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
          <div>
            <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${t.secondaryText}`}>
              Ders Kodu / Kısaltması <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Ders kodunu veya adını girin"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-medium outline-none transition-all ${t.inputBox} ${t.border} ${t.primaryText} focus:ring-1 focus:${t.accentBorder}`}
            />
          </div>

          <div>
            <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${t.secondaryText}`}>
              Tam Ders Adı
            </label>
            <input
              type="text"
              placeholder="Dersin tam adını girin (opsiyonel)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-medium outline-none transition-all ${t.inputBox} ${t.border} ${t.primaryText} focus:ring-1 focus:${t.accentBorder}`}
            />
          </div>

          {/* Color Picker */}
          <div>
            <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${t.secondaryText}`}>
              Özel Ders Rengi
            </label>
            <div className="flex flex-wrap items-center gap-2 mb-2.5">
              {PRESET_COURSE_COLORS.map((presetColor) => (
                <button
                  key={presetColor}
                  type="button"
                  onClick={() => {
                    setColor(presetColor);
                    setCustomColorInput(presetColor);
                  }}
                  className="w-7 h-7 rounded-full transition-transform flex items-center justify-center relative hover:scale-110 shadow-xs"
                  style={{ backgroundColor: presetColor }}
                  aria-label={`Select color ${presetColor}`}
                >
                  {(customColorInput || color).toLowerCase() === presetColor.toLowerCase() && (
                    <Check className="w-4 h-4 text-white drop-shadow-md stroke-[3]" />
                  )}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={customColorInput || color}
                onChange={(e) => {
                  setColor(e.target.value);
                  setCustomColorInput(e.target.value);
                }}
                className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0 bg-transparent"
                title="Renk Paletinden Seç"
              />
              <input
                type="text"
                placeholder="#3B82F6"
                value={customColorInput || color}
                onChange={(e) => {
                  setCustomColorInput(e.target.value);
                  setColor(e.target.value);
                }}
                className={`flex-1 px-3 py-1.5 rounded-lg border font-mono text-xs uppercase ${t.inputBox} ${t.border} ${t.primaryText}`}
              />
              <div
                className="w-6 h-6 rounded-md shadow-xs border border-black/10 shrink-0"
                style={{ backgroundColor: customColorInput || color }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${t.secondaryText}`}>
                Öğretim Üyesi (Opsiyonel)
              </label>
              <input
                type="text"
                placeholder="Öğretim görevlisi adı (opsiyonel)"
                value={instructor}
                onChange={(e) => setInstructor(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl border text-xs outline-none transition-all ${t.inputBox} ${t.border} ${t.primaryText}`}
              />
            </div>
            <div>
              <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${t.secondaryText}`}>
                Derslik / Salon (Opsiyonel)
              </label>
              <input
                type="text"
                placeholder="Derslik veya salon bilgisi (opsiyonel)"
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl border text-xs outline-none transition-all ${t.inputBox} ${t.border} ${t.primaryText}`}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-zinc-200/20">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 text-xs font-semibold rounded-xl border transition-all ${t.border} ${t.secondaryHover} ${t.primaryText}`}
            >
              İptal
            </button>
            <button
              type="submit"
              className={`px-5 py-2 text-xs font-semibold rounded-xl shadow-xs transition-all ${t.accentTargetBg} ${t.accentTargetText} hover:opacity-90`}
            >
              {editingCourse ? 'Kaydet' : 'Dersi Oluştur'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
