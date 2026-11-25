"use client";

import { VocabItem } from "../../lib/academy-content";

export type ModalWordItem = VocabItem & { isCustom?: boolean; isMemorized?: boolean };

interface WordDetailModalProps {
  word: ModalWordItem | null;
  isArabic: boolean;
  isSaved: boolean;
  onClose: () => void;
  onSpeak: (text: string, accent?: "en-US" | "en-GB") => void;
  onToggleSaved: (item: ModalWordItem) => void;
  onDeleteCustom?: (item: ModalWordItem) => void;
}

export default function WordDetailModal({
  word,
  isArabic,
  isSaved,
  onClose,
  onSpeak,
  onToggleSaved,
  onDeleteCustom,
}: WordDetailModalProps) {
  if (!word) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-[#061533]/65 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl border border-[#D8E2F0] shadow-2xl max-w-lg w-full overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-1 w-full btn-primary-crest" />
        <div className="p-6 sm:p-7 flex flex-col gap-5">
          {/* Top Bar */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-[#FFF0F2] text-[#D91023] border border-[#E11D48]/25">
                {word.level}
              </span>
              <span className="text-xs font-semibold text-[#475569] italic">
                {word.pos}
              </span>
              {word.isCustom && (
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-[#EAF1FC] text-[#002868]">
                  {isArabic ? "كلمتي" : "My Word"}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="w-8 h-8 rounded-full bg-[#F8FAFC] hover:bg-[#EEF3FA] text-[#475569] hover:text-[#061533] flex items-center justify-center text-sm font-bold cursor-pointer"
            >
              ✕
            </button>
          </div>

          {/* Word & Pronunciation */}
          <div className="flex flex-col gap-2">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#061533] tracking-tight">
              {word.word}
            </h2>
            <div className="flex items-center gap-2 flex-wrap">
              {word.ipa && (
                <span className="text-sm font-mono text-[#1D4ED8]">{word.ipa}</span>
              )}
              <button
                type="button"
                onClick={() => onSpeak(word.word, "en-US")}
                className="px-3 py-1 rounded-lg bg-[#F8FAFC] hover:bg-[#EAF1FC] border border-[#D8E2F0] text-xs font-bold text-[#002868] cursor-pointer"
              >
                US Audio
              </button>
              <button
                type="button"
                onClick={() => onSpeak(word.word, "en-GB")}
                className="px-3 py-1 rounded-lg bg-[#F8FAFC] hover:bg-[#EAF1FC] border border-[#D8E2F0] text-xs font-bold text-[#002868] cursor-pointer"
              >
                UK Audio
              </button>
            </div>
          </div>

          {/* Arabic & English Meanings */}
          <div className="flex flex-col gap-1.5">
            <p className="text-xl font-bold text-[#D91023]">{word.meaningAr}</p>
            <p className="text-sm text-[#475569] leading-relaxed">{word.meaningEn}</p>
          </div>

          {/* Example Sentence */}
          <div className="bg-[#F8FAFC] border border-[#D8E2F0] rounded-xl p-4 flex items-center justify-between gap-3">
            <p className="text-sm text-[#061533] font-medium leading-relaxed">
              &ldquo;{word.example}&rdquo;
            </p>
            <button
              type="button"
              onClick={() => onSpeak(word.example, "en-US")}
              className="px-3 py-1.5 rounded-lg bg-white border border-[#D8E2F0] text-xs font-bold text-[#002868] hover:text-[#D91023] shrink-0 cursor-pointer"
            >
              {isArabic ? "استمع" : "Listen"}
            </button>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2.5 pt-1">
            <button
              type="button"
              onClick={() => {
                onToggleSaved(word);
                onClose();
              }}
              className={`flex-1 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                isSaved
                  ? "bg-[#F8FAFC] hover:bg-[#FFF0F2] text-[#061533] hover:text-[#D91023] border border-[#D8E2F0]"
                  : "btn-primary-crest text-white shadow-xs"
              }`}
            >
              {isSaved
                ? isArabic
                  ? "↩ إرجاع لغير المحفوظة"
                  : "↩ Move Back to To Learn"
                : isArabic
                ? "✓ حفظتها (نقل للمحفوظة)"
                : "✓ Mark as Saved"}
            </button>

            {word.isCustom && onDeleteCustom && (
              <button
                type="button"
                onClick={() => {
                  onDeleteCustom(word);
                  onClose();
                }}
                className="px-4 py-3 rounded-xl bg-[#FFF0F2] hover:bg-[#D91023] text-[#D91023] hover:text-white border border-[#E11D48]/25 text-xs font-bold transition-colors cursor-pointer"
              >
                {isArabic ? "حذف" : "Delete"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
