import React, { useState } from 'react';
import { X, Upload, FileText, Check, AlertCircle, Sparkles, BookOpen } from 'lucide-react';
import { Course, Flashcard } from '../../types/academic';
import { ThemeConfig } from '../../theme';

interface FlashcardImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (newCards: Omit<Flashcard, 'id' | 'createdAt'>[]) => void;
  courses: Course[];
  t: ThemeConfig;
}

export const FlashcardImportModal: React.FC<FlashcardImportModalProps> = ({
  isOpen,
  onClose,
  onImport,
  courses,
  t,
}) => {
  const [rawText, setRawText] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [formatType, setFormatType] = useState<'auto' | 'qa' | 'csv' | 'json'>('auto');

  if (!isOpen) return null;

  // Parser function that understands NotebookLM, Q&A, CSV, TSV, and JSON
  const parseRawInput = (text: string): Array<{ front: string; back: string }> => {
    const trimmed = text.trim();
    if (!trimmed) return [];

    // 1. Try parsing JSON
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          const valid = parsed
            .map((item: any) => ({
              front: item.front || item.question || item.q || item.soru || '',
              back: item.back || item.answer || item.a || item.cevap || '',
            }))
            .filter((item) => item.front.trim() && item.back.trim());
          if (valid.length > 0) return valid;
        }
      } catch (e) {
        // Continue to other formats
      }
    }

    const lines = trimmed.split('\n');
    const result: Array<{ front: string; back: string }> = [];

    // 2. Try parsing Q: / A: or Soru: / Cevap: patterns (NotebookLM / AI prompts)
    let currentQ = '';
    let currentA = '';
    let foundQAPattern = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) {
        if (currentQ && currentA) {
          result.push({ front: currentQ.trim(), back: currentA.trim() });
          currentQ = '';
          currentA = '';
        }
        continue;
      }

      // Match Q: or Soru: or Question: or 1. Soru:
      const qMatch = line.match(/^(?:(?:\d+[\.\)]|\-|\*)\s*)?(?:q|soru|question)\s*[:\-]\s*(.*)$/i);
      const aMatch = line.match(/^(?:(?:\d+[\.\)]|\-|\*)\s*)?(?:a|cevap|answer)\s*[:\-]\s*(.*)$/i);

      if (qMatch) {
        foundQAPattern = true;
        if (currentQ && currentA) {
          result.push({ front: currentQ.trim(), back: currentA.trim() });
          currentA = '';
        }
        currentQ = qMatch[1];
      } else if (aMatch) {
        foundQAPattern = true;
        currentA = aMatch[1];
      } else if (currentA) {
        // Multi-line answer
        currentA += '\n' + line;
      } else if (currentQ) {
        // Multi-line question
        currentQ += ' ' + line;
      }
    }

    if (currentQ && currentA) {
      result.push({ front: currentQ.trim(), back: currentA.trim() });
    }

    if (foundQAPattern && result.length > 0) {
      return result;
    }

    // 3. Try parsing CSV, TSV or delimiter-based lines (Tab, Semicolon, Colon, Hyphen)
    const delimiterResults: Array<{ front: string; back: string }> = [];
    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;

      let parts: string[] = [];
      if (line.includes('\t')) {
        parts = line.split('\t');
      } else if (line.includes(';')) {
        parts = line.split(';');
      } else if (line.includes(' - ') || line.includes(' — ')) {
        parts = line.split(/ - | — /);
      } else if (line.includes(',')) {
        parts = line.split(',');
      }

      if (parts.length >= 2) {
        const front = parts[0].trim();
        const back = parts.slice(1).join(';').trim();
        if (front && back) {
          delimiterResults.push({ front, back });
        }
      }
    }

    if (delimiterResults.length > 0) {
      return delimiterResults;
    }

    return [];
  };

  const parsedCards = parseRawInput(rawText);
  const selectedCourse = courses.find((c) => c.id === selectedCourseId);

  const handleImportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (parsedCards.length === 0) return;

    const cardsToImport: Omit<Flashcard, 'id' | 'createdAt'>[] = parsedCards.map((card) => ({
      front: card.front,
      back: card.back,
      courseId: selectedCourse?.id,
      courseName: selectedCourse?.code,
      courseColor: selectedCourse?.color,
      status: 'new',
      reviewCount: 0,
    }));

    onImport(cardsToImport);
    setRawText('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div
        className={`w-full max-w-2xl rounded-3xl border p-6 md:p-8 shadow-2xl transition-all ${t.cardBg} ${t.border}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-zinc-200/20">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-2xl text-white ${t.iconBg}`}>
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className={`text-base font-bold tracking-tight ${t.primaryText}`}>
                Toplu Bilgi Kartı İçe Aktar (Import Flashcards)
              </h3>
              <p className={`text-xs ${t.secondaryText}`}>
                NotebookLM, Quizlet, Anki, ChatGPT veya CSV/JSON formatındaki notlarınızı yapıştırın
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-xl opacity-70 hover:opacity-100 transition-opacity ${t.secondaryHover} ${t.primaryText}`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleImportSubmit} className="space-y-4">
          {/* Target Course Selector */}
          <div>
            <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${t.secondaryText}`}>
              Kartların Bağlanacağı Ders
            </label>
            <div className="flex flex-wrap items-center gap-2 max-h-24 overflow-y-auto">
              <button
                type="button"
                onClick={() => setSelectedCourseId('')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                  !selectedCourseId
                    ? `${t.accentTargetBg} ${t.accentTargetText} border-transparent shadow-xs`
                    : `border-transparent bg-black/5 opacity-70 hover:opacity-100 ${t.primaryText}`
                }`}
              >
                Genel / Ders Yok
              </button>
              {courses.map((course) => (
                <button
                  key={course.id}
                  type="button"
                  onClick={() => setSelectedCourseId(course.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
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
                    className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs"
                    style={{ backgroundColor: course.color }}
                  />
                  <span className={selectedCourseId === course.id ? '' : t.primaryText}>
                    {course.code}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Paste Input Area */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className={`text-xs font-semibold uppercase tracking-wider ${t.secondaryText}`}>
                Metin veya Veri Alanı
              </label>
              <span className={`text-[11px] font-mono font-bold ${parsedCards.length > 0 ? 'text-emerald-500' : t.secondaryText}`}>
                {parsedCards.length} kart algılandı
              </span>
            </div>
            <textarea
              rows={8}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder={`Soru: Soru metnini buraya yapıştırın\nCevap: Cevap metnini buraya yapıştırın\n\nVeya doğrudan CSV / ayrılmış metin:\nKavram 1; Açıklama 1\nKavram 2; Açıklama 2`}
              className={`w-full p-3.5 rounded-2xl border text-xs font-mono leading-relaxed outline-none transition-all resize-none ${t.inputBox} ${t.border} ${t.primaryText}`}
            />
          </div>

          {/* Live Preview List */}
          {parsedCards.length > 0 && (
            <div className={`p-3.5 rounded-2xl border max-h-40 overflow-y-auto custom-scrollbar ${t.inputBox} ${t.border}`}>
              <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-500 mb-2">
                Ayrıştırılan Kart Önizlemesi ({parsedCards.length})
              </div>
              <div className="space-y-1.5">
                {parsedCards.slice(0, 5).map((card, i) => (
                  <div key={i} className="text-xs flex items-start gap-2 border-b border-zinc-200/10 pb-1.5 last:border-b-0">
                    <span className="font-bold text-blue-500 shrink-0">#{i + 1}</span>
                    <span className={`font-semibold truncate max-w-[200px] ${t.primaryText}`}>
                      {card.front}
                    </span>
                    <span className="text-zinc-400">→</span>
                    <span className={`truncate text-zinc-500 ${t.secondaryText}`}>
                      {card.back}
                    </span>
                  </div>
                ))}
                {parsedCards.length > 5 && (
                  <div className={`text-[10px] italic pt-1 ${t.secondaryText}`}>
                    ...ve {parsedCards.length - 5} kart daha içe aktarılacak
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-200/20">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 text-xs font-semibold rounded-xl border transition-all ${t.border} ${t.secondaryHover} ${t.primaryText}`}
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={parsedCards.length === 0}
              className={`px-5 py-2 text-xs font-semibold rounded-xl shadow-xs transition-all flex items-center gap-2 disabled:opacity-40 ${t.accentTargetBg} ${t.accentTargetText} hover:opacity-90`}
            >
              <Upload className="w-4 h-4" />
              <span>{parsedCards.length > 0 ? `${parsedCards.length} Kartı İçe Aktar` : 'Kartları İçe Aktar'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
