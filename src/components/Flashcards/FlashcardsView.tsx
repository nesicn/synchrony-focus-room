import React, { useState, useEffect, useMemo } from 'react';
import { 
  Sparkles, 
  Plus, 
  Upload, 
  RotateCw, 
  Check, 
  X, 
  Trash2, 
  Edit3, 
  Search, 
  BookOpen, 
  Layers, 
  ArrowLeft, 
  ArrowRight, 
  Shuffle, 
  Award, 
  GraduationCap,
  Play
} from 'lucide-react';
import { Course, Flashcard } from '../../types/academic';
import { ThemeConfig } from '../../theme';
import { FlashcardImportModal } from './FlashcardImportModal';
import { useAcademic } from '../../context/AcademicContext';

interface FlashcardsViewProps {
  t: ThemeConfig;
}

const generateUUID = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'fc-' + Math.random().toString(36).substring(2, 11) + '-' + Date.now().toString(36);
};

export const FlashcardsView: React.FC<FlashcardsViewProps> = ({ t }) => {
  const { courses, startTimerForCourse } = useAcademic();

  const [cards, setCards] = useState<Flashcard[]>(() => {
    try {
      const saved = localStorage.getItem('synchrony_flashcards');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // Active view: 'study' (interactive flip card test) vs 'deck' (card library & table)
  const [viewMode, setViewMode] = useState<'study' | 'deck'>('study');

  // Study Mode state
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Filter state
  const [selectedCourseFilter, setSelectedCourseFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'new' | 'learning' | 'mastered'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isAddCardModalOpen, setIsAddCardModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<Flashcard | null>(null);

  // New Card Form state
  const [newFront, setNewFront] = useState('');
  const [newBack, setNewBack] = useState('');
  const [newCourseId, setNewCourseId] = useState('');

  // Save to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem('synchrony_flashcards', JSON.stringify(cards));
    } catch (e) {
      console.warn('Failed to save flashcards:', e);
    }
  }, [cards]);

  // Filtered Cards
  const filteredCards = useMemo(() => {
    return cards.filter((card) => {
      if (selectedCourseFilter !== 'all' && card.courseId !== selectedCourseFilter) return false;
      if (statusFilter !== 'all' && card.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesFront = card.front.toLowerCase().includes(query);
        const matchesBack = card.back.toLowerCase().includes(query);
        const matchesCourse = card.courseName?.toLowerCase().includes(query);
        if (!matchesFront && !matchesBack && !matchesCourse) return false;
      }
      return true;
    });
  }, [cards, selectedCourseFilter, statusFilter, searchQuery]);

  // Reset current index when filter changes
  useEffect(() => {
    setCurrentCardIndex(0);
    setIsFlipped(false);
  }, [selectedCourseFilter, statusFilter, searchQuery]);

  const currentStudyCard = filteredCards[currentCardIndex] || null;

  // Study feedback handlers
  const handleMarkCard = (status: 'learning' | 'mastered') => {
    if (!currentStudyCard) return;

    setCards((prev) =>
      prev.map((c) =>
        c.id === currentStudyCard.id
          ? {
              ...c,
              status,
              reviewCount: c.reviewCount + 1,
              lastReviewed: new Date().toISOString(),
            }
          : c
      )
    );

    // Advance to next card
    setIsFlipped(false);
    if (currentCardIndex < filteredCards.length - 1) {
      setCurrentCardIndex((prev) => prev + 1);
    }
  };

  const handleShuffle = () => {
    setCards((prev) => [...prev].sort(() => Math.random() - 0.5));
    setCurrentCardIndex(0);
    setIsFlipped(false);
  };

  const handleAddCardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFront.trim() || !newBack.trim()) return;

    const course = courses.find((c) => c.id === newCourseId);

    if (editingCard) {
      setCards((prev) =>
        prev.map((c) =>
          c.id === editingCard.id
            ? {
                ...c,
                front: newFront.trim(),
                back: newBack.trim(),
                courseId: course?.id,
                courseName: course?.code,
                courseColor: course?.color,
              }
            : c
        )
      );
    } else {
      const newCard: Flashcard = {
        id: generateUUID(),
        front: newFront.trim(),
        back: newBack.trim(),
        courseId: course?.id,
        courseName: course?.code,
        courseColor: course?.color,
        status: 'new',
        reviewCount: 0,
        createdAt: new Date().toISOString(),
      };
      setCards((prev) => [newCard, ...prev]);
    }

    setNewFront('');
    setNewBack('');
    setNewCourseId('');
    setEditingCard(null);
    setIsAddCardModalOpen(false);
  };

  const openEditModal = (card: Flashcard, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingCard(card);
    setNewFront(card.front);
    setNewBack(card.back);
    setNewCourseId(card.courseId || '');
    setIsAddCardModalOpen(true);
  };

  const handleDeleteCard = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCards((prev) => prev.filter((c) => c.id !== id));
    if (currentCardIndex >= filteredCards.length - 1 && currentCardIndex > 0) {
      setCurrentCardIndex((prev) => prev - 1);
    }
  };

  // Keyboard shortcut listener for Study Mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (viewMode !== 'study' || !currentStudyCard) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.code === 'Space') {
        e.preventDefault();
        setIsFlipped((prev) => !prev);
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        handleMarkCard('mastered');
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        handleMarkCard('learning');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewMode, currentStudyCard, currentCardIndex, filteredCards.length]);

  // Statistics
  const stats = useMemo(() => {
    const total = cards.length;
    const mastered = cards.filter((c) => c.status === 'mastered').length;
    const learning = cards.filter((c) => c.status === 'learning').length;
    const newCards = cards.filter((c) => c.status === 'new').length;
    const percent = total > 0 ? Math.round((mastered / total) * 100) : 0;
    return { total, mastered, learning, newCards, percent };
  }, [cards]);

  return (
    <div className="flex flex-col gap-6 w-full max-w-[1300px] mx-auto">
      {/* Top Header Card */}
      <div
        className={`p-6 rounded-3xl border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors duration-500 ${t.cardBg} ${t.border} ${t.shadow}`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-white transition-colors shadow-xs ${t.iconBg} ${t.iconText}`}
          >
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h2 className={`text-base font-bold tracking-tight ${t.primaryText}`}>
              Bilgi Kartları (Flashcards) & Akıllı Tekrar
            </h2>
            <p className={`text-xs ${t.secondaryText}`}>
              NotebookLM veya dış kaynaklardan içe aktarın, kavramları 3D çevirmeli kartlarla test edin
            </p>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* View Mode Toggle: Study vs Deck */}
          <div className={`flex items-center p-1 rounded-xl border ${t.border} ${t.inputBox}`}>
            <button
              onClick={() => {
                setViewMode('study');
                setIsFlipped(false);
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                viewMode === 'study'
                  ? `${t.cardBg} ${t.primaryText} shadow-xs font-bold`
                  : `${t.secondaryText} hover:${t.primaryText}`
              }`}
            >
              🎯 Çalışma Modu
            </button>
            <button
              onClick={() => setViewMode('deck')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                viewMode === 'deck'
                  ? `${t.cardBg} ${t.primaryText} shadow-xs font-bold`
                  : `${t.secondaryText} hover:${t.primaryText}`
              }`}
            >
              📋 Kart Kütüphanesi ({cards.length})
            </button>
          </div>

          {/* Import Modal Button */}
          <button
            onClick={() => setIsImportModalOpen(true)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-all ${t.border} ${t.secondaryHover} ${t.primaryText}`}
            title="NotebookLM veya CSV/Metin yapıştırarak kartları içe aktarın"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>İçe Aktar (Import)</span>
          </button>

          {/* New Card Button */}
          <button
            onClick={() => {
              setEditingCard(null);
              setNewFront('');
              setNewBack('');
              setNewCourseId(courses[0]?.id || '');
              setIsAddCardModalOpen(true);
            }}
            className={`px-4 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all ${t.accentTargetBg} ${t.accentTargetText} hover:opacity-90`}
          >
            <Plus className="w-4 h-4" />
            <span>Kart Ekle</span>
          </button>
        </div>
      </div>

      {/* Progress & Summary Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className={`p-4 rounded-2xl border transition-all ${t.cardBg} ${t.border}`}>
          <span className={`text-[10px] font-bold uppercase tracking-wider ${t.secondaryText}`}>
            Toplam Kart
          </span>
          <div className={`text-xl font-bold font-mono mt-0.5 ${t.primaryText}`}>{stats.total}</div>
        </div>

        <div className={`p-4 rounded-2xl border transition-all ${t.cardBg} ${t.border}`}>
          <span className={`text-[10px] font-bold uppercase tracking-wider text-emerald-500`}>
            Kavranan (Mastered)
          </span>
          <div className="text-xl font-bold font-mono text-emerald-500 mt-0.5">
            {stats.mastered}{' '}
            <span className="text-xs font-normal opacity-75">(%{stats.percent})</span>
          </div>
        </div>

        <div className={`p-4 rounded-2xl border transition-all ${t.cardBg} ${t.border}`}>
          <span className={`text-[10px] font-bold uppercase tracking-wider text-amber-500`}>
            Öğreniliyor
          </span>
          <div className="text-xl font-bold font-mono text-amber-500 mt-0.5">{stats.learning}</div>
        </div>

        <div className={`p-4 rounded-2xl border transition-all ${t.cardBg} ${t.border}`}>
          <span className={`text-[10px] font-bold uppercase tracking-wider text-blue-500`}>
            Yeni Kartlar
          </span>
          <div className="text-xl font-bold font-mono text-blue-500 mt-0.5">{stats.newCards}</div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div
        className={`p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-3 ${t.cardBg} ${t.border}`}
      >
        <div className="flex flex-wrap items-center gap-2 flex-1">
          {/* Course Filter */}
          <select
            value={selectedCourseFilter}
            onChange={(e) => setSelectedCourseFilter(e.target.value)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold outline-none ${t.inputBox} ${t.border} ${t.primaryText}`}
          >
            <option value="all">Tüm Dersler</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <div className={`flex items-center p-0.5 rounded-xl border ${t.border} ${t.inputBox}`}>
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg ${
                statusFilter === 'all' ? `${t.cardBg} ${t.primaryText} shadow-xs` : t.secondaryText
              }`}
            >
              Tümü
            </button>
            <button
              onClick={() => setStatusFilter('learning')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg ${
                statusFilter === 'learning' ? `${t.cardBg} text-amber-500 shadow-xs font-bold` : t.secondaryText
              }`}
            >
              Öğrenilenler
            </button>
            <button
              onClick={() => setStatusFilter('mastered')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg ${
                statusFilter === 'mastered' ? `${t.cardBg} text-emerald-500 shadow-xs font-bold` : t.secondaryText
              }`}
            >
              Kavrananlar
            </button>
          </div>

          {/* Shuffle button */}
          <button
            onClick={handleShuffle}
            className={`p-2 rounded-xl border text-xs font-semibold transition-colors ${t.border} ${t.secondaryHover} ${t.primaryText}`}
            title="Kart sırasını karıştır"
          >
            <Shuffle className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Search Input */}
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs ${t.inputBox} ${t.border} w-full sm:w-64`}>
          <Search className="w-3.5 h-3.5 opacity-50 shrink-0" />
          <input
            type="text"
            placeholder="Kartlarda ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent outline-none text-xs"
          />
        </div>
      </div>

      {/* Main Mode View */}
      {viewMode === 'study' ? (
        /* INTERACTIVE 3D FLIP CARD STUDY MODE */
        filteredCards.length > 0 && currentStudyCard ? (
          <div className="flex flex-col items-center justify-center gap-6 py-4">
            {/* Card Counter & Progress Indicator */}
            <div className="flex items-center justify-between w-full max-w-xl text-xs font-semibold">
              <span className={t.secondaryText}>
                Kart <strong className={t.primaryText}>{currentCardIndex + 1}</strong> / {filteredCards.length}
              </span>
              <div className="flex items-center gap-2">
                {currentStudyCard.courseName && (
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded shadow-xs text-white"
                    style={{ backgroundColor: currentStudyCard.courseColor || '#3B82F6' }}
                  >
                    {currentStudyCard.courseName}
                  </span>
                )}
                <span className="text-[10px] uppercase font-mono opacity-60">
                  {isFlipped ? 'Cevap (Arka Yüz)' : 'Soru (Ön Yüz)'}
                </span>
              </div>
            </div>

            {/* Interactive Flip Card Container */}
            <div
              onClick={() => setIsFlipped(!isFlipped)}
              className={`w-full max-w-xl min-h-[320px] md:min-h-[380px] rounded-3xl border p-8 flex flex-col justify-between cursor-pointer select-none relative shadow-xl transition-all duration-300 hover:shadow-2xl ${t.cardBg} ${t.border}`}
              style={{
                perspective: '1000px',
              }}
            >
              {/* Top Hint */}
              <div className="flex items-center justify-between text-[11px] font-medium opacity-60">
                <span className="uppercase tracking-widest text-[9px] font-bold">
                  {isFlipped ? 'Cevap & Çözüm' : 'Soru / Kavram'}
                </span>
                <span className="flex items-center gap-1 text-[10px]">
                  <RotateCw className="w-3 h-3" />
                  <span>Çevirmek için tıkla (Space)</span>
                </span>
              </div>

              {/* Center Content Text */}
              <div className="py-8 flex flex-col items-center justify-center text-center">
                <p className={`text-base md:text-xl font-semibold leading-relaxed tracking-tight ${t.primaryText}`}>
                  {isFlipped ? currentStudyCard.back : currentStudyCard.front}
                </p>
              </div>

              {/* Bottom Card Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-zinc-200/10 text-xs">
                <div className="flex items-center gap-1.5 opacity-70">
                  <span className="text-[10px] uppercase font-bold">Durum:</span>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      currentStudyCard.status === 'mastered'
                        ? 'bg-emerald-500/20 text-emerald-600'
                        : currentStudyCard.status === 'learning'
                        ? 'bg-amber-500/20 text-amber-600'
                        : 'bg-blue-500/20 text-blue-600'
                    }`}
                  >
                    {currentStudyCard.status === 'mastered'
                      ? 'Kavrandı'
                      : currentStudyCard.status === 'learning'
                      ? 'Öğreniliyor'
                      : 'Yeni'}
                  </span>
                </div>

                <span className="text-[10px] opacity-50">
                  {currentStudyCard.reviewCount} kez tekrar edildi
                </span>
              </div>
            </div>

            {/* Study Action Controls */}
            <div className="flex items-center gap-4 w-full max-w-xl justify-between">
              {/* Previous Card */}
              <button
                disabled={currentCardIndex === 0}
                onClick={() => {
                  setIsFlipped(false);
                  setCurrentCardIndex((prev) => Math.max(0, prev - 1));
                }}
                className={`p-3 rounded-2xl border transition-all disabled:opacity-30 ${t.border} ${t.secondaryHover} ${t.primaryText}`}
                title="Önceki Kart"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              {/* Repetition Response Buttons */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleMarkCard('learning')}
                  className="px-5 py-3 rounded-2xl font-bold text-xs bg-amber-500/15 text-amber-600 border border-amber-500/30 hover:bg-amber-500/25 transition-all flex items-center gap-2 shadow-xs"
                  title="Tekrar Et / Zorlandı (Sol Ok)"
                >
                  <X className="w-4 h-4 stroke-[3]" />
                  <span>Tekrar Et (Öğreniyorum)</span>
                </button>

                <button
                  onClick={() => handleMarkCard('mastered')}
                  className="px-6 py-3 rounded-2xl font-bold text-xs bg-emerald-500 text-white hover:bg-emerald-600 transition-all flex items-center gap-2 shadow-md hover:scale-105"
                  title="Biliyorum / Kavrandı (Sağ Ok)"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Biliyorum (Kavrandı)</span>
                </button>
              </div>

              {/* Next Card */}
              <button
                disabled={currentCardIndex >= filteredCards.length - 1}
                onClick={() => {
                  setIsFlipped(false);
                  setCurrentCardIndex((prev) => Math.min(filteredCards.length - 1, prev + 1));
                }}
                className={`p-3 rounded-2xl border transition-all disabled:opacity-30 ${t.border} ${t.secondaryHover} ${t.primaryText}`}
                title="Sonraki Kart"
              >
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        ) : (
          /* Empty Study State */
          <div
            className={`p-12 rounded-3xl border text-center flex flex-col items-center justify-center ${t.cardBg} ${t.border}`}
          >
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white mb-3 ${t.iconBg}`}>
              <Layers className="w-6 h-6" />
            </div>
            <h3 className={`text-sm font-bold uppercase tracking-wider mb-1 ${t.primaryText}`}>
              Çalışılacak Kart Bulunamadı
            </h3>
            <p className={`text-xs max-w-sm mb-4 ${t.secondaryText}`}>
              Filtrelerinize uygun bilgi kartı yok veya henüz kart eklemediniz. NotebookLM'den notlarınızı yapıştırabilir veya manuel kart oluşturabilirsiniz.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsImportModalOpen(true)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold border flex items-center gap-2 ${t.border} ${t.secondaryHover} ${t.primaryText}`}
              >
                <Upload className="w-4 h-4" />
                <span>Toplu İçe Aktar</span>
              </button>
              <button
                onClick={() => {
                  setEditingCard(null);
                  setNewFront('');
                  setNewBack('');
                  setIsAddCardModalOpen(true);
                }}
                className={`px-4 py-2 rounded-xl text-xs font-semibold shadow-xs ${t.accentTargetBg} ${t.accentTargetText}`}
              >
                + Yeni Kart Ekle
              </button>
            </div>
          </div>
        )
      ) : (
        /* DECK / LIBRARY LIST VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCards.map((card) => (
            <div
              key={card.id}
              className={`p-5 rounded-2xl border flex flex-col justify-between transition-all hover:shadow-md ${t.cardBg} ${t.border}`}
              style={{
                borderTopColor: card.courseColor || '#3B82F6',
                borderTopWidth: '4px',
              }}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {card.courseName ? (
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded shadow-xs text-white"
                        style={{ backgroundColor: card.courseColor || '#3B82F6' }}
                      >
                        {card.courseName}
                      </span>
                    ) : (
                      <span className={`text-[10px] font-bold ${t.secondaryText}`}>Genel</span>
                    )}

                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                        card.status === 'mastered'
                          ? 'bg-emerald-500/15 text-emerald-600'
                          : card.status === 'learning'
                          ? 'bg-amber-500/15 text-amber-600'
                          : 'bg-blue-500/15 text-blue-600'
                      }`}
                    >
                      {card.status === 'mastered' ? 'Kavrandı' : card.status === 'learning' ? 'Öğreniliyor' : 'Yeni'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => openEditModal(card, e)}
                      className={`p-1.5 rounded-lg opacity-70 hover:opacity-100 transition-opacity ${t.secondaryText} hover:${t.primaryText}`}
                      title="Kartı Düzenle"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => handleDeleteCard(card.id, e)}
                      className={`p-1.5 rounded-lg opacity-70 hover:opacity-100 transition-opacity ${t.secondaryText} hover:text-red-500`}
                      title="Kartı Sil"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="mb-3">
                  <span className={`text-[10px] font-bold uppercase tracking-wider block mb-0.5 ${t.secondaryText}`}>
                    Soru:
                  </span>
                  <p className={`text-xs font-semibold leading-relaxed ${t.primaryText} line-clamp-3`}>
                    {card.front}
                  </p>
                </div>

                <div className="pt-2 border-t border-zinc-200/10">
                  <span className={`text-[10px] font-bold uppercase tracking-wider block mb-0.5 ${t.secondaryText}`}>
                    Cevap:
                  </span>
                  <p className={`text-xs leading-relaxed opacity-80 ${t.primaryText} line-clamp-3`}>
                    {card.back}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 mt-3 border-t border-zinc-200/10 text-[10px] opacity-60">
                <span>{card.reviewCount} Tekrar</span>
                <span>{new Date(card.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))}

          {filteredCards.length === 0 && (
            <div className={`col-span-full py-16 text-center text-xs ${t.secondaryText}`}>
              Filtre kriterlerine uyan bilgi kartı bulunamadı.
            </div>
          )}
        </div>
      )}

      {/* Import Modal */}
      <FlashcardImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={(imported) => {
          const cardsWithIds: Flashcard[] = imported.map((item) => ({
            ...item,
            id: generateUUID(),
            createdAt: new Date().toISOString(),
          }));
          setCards((prev) => [...cardsWithIds, ...prev]);
        }}
        courses={courses}
        t={t}
      />

      {/* Manual Add / Edit Modal */}
      {isAddCardModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div
            className={`w-full max-w-lg rounded-3xl border p-6 md:p-8 shadow-2xl transition-all ${t.cardBg} ${t.border}`}
          >
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-zinc-200/20">
              <h3 className={`text-base font-bold tracking-tight ${t.primaryText}`}>
                {editingCard ? 'Bilgi Kartını Düzenle' : 'Yeni Bilgi Kartı Oluştur'}
              </h3>
              <button
                onClick={() => setIsAddCardModalOpen(false)}
                className={`p-1.5 rounded-lg opacity-70 hover:opacity-100 ${t.secondaryText}`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCardSubmit} className="space-y-4">
              <div>
                <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${t.secondaryText}`}>
                  İlişkili Ders
                </label>
                <select
                  value={newCourseId}
                  onChange={(e) => setNewCourseId(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-semibold outline-none ${t.inputBox} ${t.border} ${t.primaryText}`}
                >
                  <option value="">Genel / Ders Seçilmedi</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code} - {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${t.secondaryText}`}>
                  Soru / Ön Yüz (Front) <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={newFront}
                  onChange={(e) => setNewFront(e.target.value)}
                  placeholder="Kavram, terim veya soru..."
                  className={`w-full p-3 rounded-xl border text-xs outline-none resize-none ${t.inputBox} ${t.border} ${t.primaryText}`}
                />
              </div>

              <div>
                <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${t.secondaryText}`}>
                  Cevap / Arka Yüz (Back) <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={newBack}
                  onChange={(e) => setNewBack(e.target.value)}
                  placeholder="Tanım, formül veya detaylı açıklama..."
                  className={`w-full p-3 rounded-xl border text-xs outline-none resize-none ${t.inputBox} ${t.border} ${t.primaryText}`}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-200/20">
                <button
                  type="button"
                  onClick={() => setIsAddCardModalOpen(false)}
                  className={`px-4 py-2 text-xs font-semibold rounded-xl border ${t.border} ${t.primaryText}`}
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 text-xs font-semibold rounded-xl shadow-xs ${t.accentTargetBg} ${t.accentTargetText} hover:opacity-90`}
                >
                  {editingCard ? 'Kaydet' : 'Kartı Oluştur'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
