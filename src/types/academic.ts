export type CalendarEventType = 'lecture' | 'lab' | 'deadline' | 'exam';

export type EisenhowerQuadrant = 'q1' | 'q2' | 'q3' | 'q4';

export interface TaskItem {
  id: string;
  text: string;
  completed: boolean;
  quadrant: EisenhowerQuadrant;
  courseId?: string;
  estimatedPomodoros?: number;
  completedPomodoros?: number;
  createdAt: string;
}

export const EISENHOWER_CONFIG: Record<
  EisenhowerQuadrant,
  {
    code: string;
    title: string;
    subtitle: string;
    color: string;
    bgColor: string;
    borderColor: string;
    badgeBg: string;
    badgeText: string;
    tag: string;
  }
> = {
  q1: {
    code: 'Q1',
    title: 'Acil & Önemli',
    subtitle: 'Hemen Yap (Kritik Teslimler)',
    color: '#EF4444',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30',
    badgeBg: 'bg-red-500',
    badgeText: 'text-white',
    tag: 'Hemen Yap',
  },
  q2: {
    code: 'Q2',
    title: 'Önemli & Acil Değil',
    subtitle: 'Planla (Derin Çalışma & Gelişim)',
    color: '#3B82F6',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    badgeBg: 'bg-blue-500',
    badgeText: 'text-white',
    tag: 'Planla',
  },
  q3: {
    code: 'Q3',
    title: 'Acil & Önemli Değil',
    subtitle: 'Hızlı Çöz / Delege Et (Rutin İşler)',
    color: '#F59E0B',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
    badgeBg: 'bg-amber-500',
    badgeText: 'text-white',
    tag: 'Hızlı Çöz',
  },
  q4: {
    code: 'Q4',
    title: 'Acil Değil & Önemli Değil',
    subtitle: 'Ele / Ertele (Düşük Öncelik)',
    color: '#6B7280',
    bgColor: 'bg-zinc-500/10',
    borderColor: 'border-zinc-500/30',
    badgeBg: 'bg-zinc-500',
    badgeText: 'text-white',
    tag: 'Ele / Ertele',
  },
};

export interface Course {
  id: string;
  code: string; // e.g. "CMPE 451", "Veri Yapıları"
  name: string; // e.g. "Yazılım Mühendisliği", "Algoritmalar ve Veri Yapıları"
  color: string; // Hex color e.g. "#3B82F6", "#10B981"
  instructor?: string;
  room?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  courseId: string; // links to Course.id
  type: CalendarEventType;
  dayOfWeek: number; // 0: Pazartesi (Mon) .. 6: Pazar (Sun)
  startTime: string; // "HH:MM" e.g. "09:00"
  endTime: string; // "HH:MM" e.g. "10:30"
  location?: string;
  notes?: string;
  date?: string; // Optional YYYY-MM-DD for specific deadlines/exams
  completed?: boolean;
}

export interface AcademicSessionItem {
  id: string;
  date: string;
  task: string;
  duration: number; // in seconds
  courseId?: string;
  courseName?: string;
  courseColor?: string;
  eventType?: CalendarEventType;
}

export type ActiveNavTab = 'focus' | 'schedule' | 'analytics' | 'flashcards';

export interface Flashcard {
  id: string;
  front: string; // Soru / Ön Yüz
  back: string;  // Cevap / Açıklama
  courseId?: string;
  courseName?: string;
  courseColor?: string;
  status: 'new' | 'learning' | 'mastered';
  reviewCount: number;
  lastReviewed?: string;
  createdAt: string;
}

export const EVENT_TYPE_CONFIG: Record<
  CalendarEventType,
  { label: string; shortLabel: string; defaultColor: string; icon: string }
> = {
  lecture: {
    label: 'Ders Saati',
    shortLabel: 'Ders',
    defaultColor: '#3B82F6',
    icon: 'GraduationCap',
  },
  lab: {
    label: 'Laboratuvar',
    shortLabel: 'Lab',
    defaultColor: '#10B981',
    icon: 'FlaskConical',
  },
  deadline: {
    label: 'Ödev Teslimi',
    shortLabel: 'Deadline',
    defaultColor: '#F59E0B',
    icon: 'FileText',
  },
  exam: {
    label: 'Sınav Tarihi',
    shortLabel: 'Sınav',
    defaultColor: '#EF4444',
    icon: 'Target',
  },
};

export const PRESET_COURSE_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Emerald
  '#8B5CF6', // Purple
  '#F59E0B', // Amber
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#F97316', // Orange
  '#14B8A6', // Teal
  '#6366F1', // Indigo
  '#84CC16', // Lime
];

export const DAYS_OF_WEEK = [
  { id: 0, name: 'Pazartesi', short: 'Pzt' },
  { id: 1, name: 'Salı', short: 'Sal' },
  { id: 2, name: 'Çarşamba', short: 'Çar' },
  { id: 3, name: 'Perşembe', short: 'Per' },
  { id: 4, name: 'Cuma', short: 'Cum' },
  { id: 5, name: 'Cumartesi', short: 'Cmt' },
  { id: 6, name: 'Pazar', short: 'Paz' },
];
