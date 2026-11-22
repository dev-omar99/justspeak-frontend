"use client";

import { useMemo, useState } from "react";
import { StructuredLesson } from "../../lib/academy-lessons";

function playFeedbackChime(type: "correct" | "wrong" | "complete") {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const notes =
      type === "correct"
        ? [523.25, 659.25]
        : type === "complete"
        ? [523.25, 659.25, 783.99, 1046.5]
        : [260, 210];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type === "wrong" ? "triangle" : "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.1);
      gain.gain.setValueAtTime(0.08, ctx.currentTime + i * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.1 + 0.28);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.1);
      osc.stop(ctx.currentTime + i * 0.1 + 0.3);
    });
  } catch {}
}

interface InteractiveLessonDrillProps {
  lesson: StructuredLesson;
  isArabic: boolean;
  onEarnXp: (amount: number) => void;
  onContinue: () => void;
  onBack: () => void;
}

export default function InteractiveLessonDrill({
  lesson,
  isArabic,
  onEarnXp,
  onContinue,
  onBack,
}: InteractiveLessonDrillProps) {
  // Challenge 1: Fill-in-the-blank using lesson word #1 & #2
  const fillQuestions = useMemo(() => {
    return lesson.vocabulary.slice(0, 2).map((target, idx) => {
      const regex = new RegExp(`\\b${target.word}\\b`, "i");
      const sentenceWithBlank = regex.test(target.example)
        ? target.example.replace(regex, "______")
        : `Choose the word meaning "${target.meaningEn}": ______`;

      const distractors = lesson.vocabulary
        .filter((w) => w.id !== target.id)
        .slice(idx, idx + 3)
        .map((w) => w.word);

      // Deterministic shuffle based on word lengths so SSR/client match
      const options = [target.word, ...distractors].sort(
        (a, b) => a.charCodeAt(0) - b.charCodeAt(0)
      );

      return {
        id: target.id,
        prompt: sentenceWithBlank,
        hintAr: target.meaningAr,
        answer: target.word,
        options,
      };
    });
  }, [lesson]);

  // Challenge 2: Tap-to-Build Sentence (from pronunciation.shadowSentence)
  const sentenceWords = useMemo(() => {
    const raw = lesson.pronunciation.shadowSentence
      .replace(/[.!?]/g, "")
      .trim()
      .split(/\s+/)
      .slice(0, 8);
    return raw;
  }, [lesson]);

  const scrambledPool = useMemo(() => {
    return sentenceWords
      .map((word, idx) => ({ id: `${idx}-${word}`, word }))
      .sort((a, b) => a.word.toLowerCase().localeCompare(b.word.toLowerCase()));
  }, [sentenceWords]);

  const [fillIdx, setFillIdx] = useState(0);
  const [fillChoice, setFillChoice] = useState<string | null>(null);
  const [fillStatus, setFillStatus] = useState<"idle" | "correct" | "wrong">("idle");
  const [combo, setCombo] = useState(0);
  const [stage, setStage] = useState<"fill" | "build" | "done">("fill");

  // Sentence Builder State
  const [selectedTiles, setSelectedTiles] = useState<{ id: string; word: string }[]>([]);
  const [buildStatus, setBuildStatus] = useState<"idle" | "correct" | "wrong">("idle");

  const currentFill = fillQuestions[fillIdx];

  function handleCheckFill() {
    if (!fillChoice || !currentFill) return;
    if (fillChoice.toLowerCase() === currentFill.answer.toLowerCase()) {
      setFillStatus("correct");
      setCombo((c) => c + 1);
      onEarnXp(15);
      playFeedbackChime("correct");
    } else {
      setFillStatus("wrong");
      setCombo(0);
      playFeedbackChime("wrong");
    }
  }

  function handleNextFill() {
    setFillChoice(null);
    setFillStatus("idle");
    if (fillIdx < fillQuestions.length - 1) {
      setFillIdx((i) => i + 1);
    } else {
      setStage("build");
    }
  }

  function handleToggleTile(tile: { id: string; word: string }) {
    if (buildStatus === "correct") return;
    setBuildStatus("idle");
    const exists = selectedTiles.some((t) => t.id === tile.id);
    if (exists) {
      setSelectedTiles((prev) => prev.filter((t) => t.id !== tile.id));
    } else {
      setSelectedTiles((prev) => [...prev, tile]);
    }
  }

  function handleCheckBuild() {
    const built = selectedTiles.map((t) => t.word.toLowerCase()).join(" ");
    const target = sentenceWords.map((w) => w.toLowerCase()).join(" ");
    if (built === target) {
      setBuildStatus("correct");
      setCombo((c) => c + 1);
      onEarnXp(25);
      playFeedbackChime("complete");
      setTimeout(() => setStage("done"), 650);
    } else {
      setBuildStatus("wrong");
      setCombo(0);
      playFeedbackChime("wrong");
    }
  }

  return (
    <section className="bg-white border border-border rounded-[24px] p-6 sm:p-8 shadow-xs flex flex-col gap-5">
      <div className="flex items-center justify-between flex-wrap gap-2 border-b border-border pb-4">
        <div>
          <span className="text-[11px] font-black text-[#D91023] uppercase tracking-wider">
            Step 4 • Interactive Practice Arena
          </span>
          <h2 className="text-xl font-black text-ink mt-0.5">
            🎮 {isArabic ? "تحديات تفاعلية لتثبيت الدرس" : "Interactive Mastery Challenges"}
          </h2>
        </div>
        {combo >= 2 && (
          <span className="px-3 py-1 rounded-full bg-[#FFF0F2] text-[#D91023] border border-[#D91023]/30 text-xs font-black animate-bounce">
            🔥 {combo}x Combo!
          </span>
        )}
      </div>

      {/* STAGE A: FILL IN THE BLANK */}
      {stage === "fill" && currentFill && (
        <div className="flex flex-col gap-5">
          <div className="flex items-center justify-between text-xs font-bold text-ink-soft">
            <span>
              {isArabic
                ? `تمرين إكمال الجملة (${fillIdx + 1}/${fillQuestions.length})`
                : `Fill in the Blank (${fillIdx + 1}/${fillQuestions.length})`}
            </span>
            <span className="text-[#002868] font-extrabold">
              💡 {isArabic ? `تلميح: ${currentFill.hintAr}` : `Hint: ${currentFill.hintAr}`}
            </span>
          </div>

          <div className="bg-surface border border-border rounded-2xl p-5 text-base sm:text-lg font-extrabold text-ink leading-relaxed">
            {currentFill.prompt}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {currentFill.options.map((opt) => {
              const selected = fillChoice === opt;
              let cls = "bg-white border-border text-ink hover:border-[#002868]";
              if (fillStatus === "correct" && opt === currentFill.answer) {
                cls = "bg-[#ECFDF5] border-[#10B981] text-[#065F46]";
              } else if (fillStatus === "wrong" && selected) {
                cls = "bg-[#FFF0F2] border-[#D91023] text-[#9F1239]";
              } else if (selected) {
                cls = "bg-[#EAF1FC] border-[#002868] text-[#002868] shadow-2xs";
              }
              return (
                <button
                  key={opt}
                  type="button"
                  disabled={fillStatus === "correct"}
                  onClick={() => {
                    setFillChoice(opt);
                    setFillStatus("idle");
                  }}
                  className={`py-3.5 px-4 rounded-2xl border-2 text-sm font-black transition-all cursor-pointer ${cls}`}
                >
                  {opt}
                </button>
              );
            })}
          </div>

          {fillStatus === "correct" && (
            <div className="p-4 rounded-2xl bg-[#ECFDF5] border border-[#10B981]/40 text-[#065F46] text-xs sm:text-sm font-extrabold flex items-center justify-between gap-3">
              <span>🎉 {isArabic ? "إجابة رائعة! +15 XP" : "Spot on! +15 XP earned"}</span>
              <button
                type="button"
                onClick={handleNextFill}
                className="px-4 py-2 rounded-xl bg-[#059669] text-white text-xs font-black cursor-pointer"
              >
                {isArabic ? "التالي →" : "Continue →"}
              </button>
            </div>
          )}

          {fillStatus === "wrong" && (
            <div className="p-3.5 rounded-2xl bg-[#FFF0F2] border border-[#D91023]/30 text-[#9F1239] text-xs font-bold">
              ❌ {isArabic ? "جرّب كلمة أخرى — انظر للتلميح بالأعلى!" : "Not quite — check the hint above and try again!"}
            </div>
          )}

          {fillStatus !== "correct" && (
            <button
              type="button"
              disabled={!fillChoice}
              onClick={handleCheckFill}
              className="self-start px-6 py-3 rounded-xl bg-[#002868] hover:bg-[#061533] disabled:opacity-40 text-white text-xs sm:text-sm font-black cursor-pointer"
            >
              ✓ {isArabic ? "تحقق من الإجابة" : "Check Answer"}
            </button>
          )}
        </div>
      )}

      {/* STAGE B: DUOLINGO-STYLE SENTENCE BUILDER */}
      {stage === "build" && (
        <div className="flex flex-col gap-5">
          <div>
            <span className="text-xs font-black text-[#002868] uppercase">
              🧩 {isArabic ? "رتّب الكلمات لتكوين الجملة الصحيحة" : "Tap the Words in Order to Build the Sentence"}
            </span>
          </div>

          {/* Built Sentence Drop Zone */}
          <div className="min-h-[76px] p-4 rounded-2xl bg-surface border-2 border-dashed border-[#002868]/30 flex flex-wrap items-center gap-2">
            {selectedTiles.length === 0 ? (
              <span className="text-xs font-semibold text-ink-soft">
                {isArabic ? "اضغط على الكلمات بالأسفل بالترتيب..." : "Tap word tiles below in the right order..."}
              </span>
            ) : (
              selectedTiles.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => handleToggleTile(t)}
                  className="px-3.5 py-2 rounded-xl bg-[#002868] text-white text-sm font-black shadow-2xs cursor-pointer hover:bg-[#D91023] transition-colors"
                >
                  {t.word}
                </button>
              ))
            )}
          </div>

          {/* Word Bank */}
          <div className="flex flex-wrap gap-2">
            {scrambledPool.map((tile) => {
              const used = selectedTiles.some((t) => t.id === tile.id);
              return (
                <button
                  key={tile.id}
                  type="button"
                  disabled={used}
                  onClick={() => handleToggleTile(tile)}
                  className={`px-3.5 py-2 rounded-xl border-2 text-sm font-extrabold transition-all cursor-pointer ${
                    used
                      ? "bg-surface border-border text-slate-300 opacity-40 cursor-default"
                      : "bg-white border-border text-ink hover:border-[#002868] shadow-2xs active:scale-95"
                  }`}
                >
                  {tile.word}
                </button>
              );
            })}
          </div>

          {buildStatus === "wrong" && (
            <div className="p-3.5 rounded-2xl bg-[#FFF0F2] border border-[#D91023]/30 text-[#9F1239] text-xs font-bold flex items-center justify-between gap-2">
              <span>❌ {isArabic ? "الترتيب غير دقيق تماماً — اضغط على أي كلمة بالأعلى لإزالتها وإعادة المحاولة." : "Order is slightly off — tap any placed word to remove and retry."}</span>
              <button
                type="button"
                onClick={() => {
                  setSelectedTiles([]);
                  setBuildStatus("idle");
                }}
                className="underline font-black shrink-0 cursor-pointer"
              >
                Reset
              </button>
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={selectedTiles.length !== sentenceWords.length}
              onClick={handleCheckBuild}
              className="px-6 py-3 rounded-xl bg-[#002868] hover:bg-[#061533] disabled:opacity-40 text-white text-xs sm:text-sm font-black cursor-pointer"
            >
              ✓ {isArabic ? "تحقق من الجملة (+25 XP)" : "Check Sentence (+25 XP)"}
            </button>
            <button
              type="button"
              onClick={() => setStage("done")}
              className="text-xs font-bold text-ink-soft hover:text-ink underline cursor-pointer"
            >
              {isArabic ? "تخطي" : "Skip"}
            </button>
          </div>
        </div>
      )}

      {/* STAGE C: DRILL COMPLETE */}
      {stage === "done" && (
        <div className="bg-[#ECFDF5] border border-[#10B981]/40 rounded-2xl p-6 text-center flex flex-col items-center gap-3">
          <span className="text-4xl">⚡</span>
          <h3 className="text-lg font-black text-[#065F46]">
            {isArabic ? "ممتاز! أنهيت التحديات التفاعلية بنجاح!" : "Interactive Challenges Mastered!"}
          </h3>
          <p className="text-xs text-[#047857]">
            {isArabic
              ? "أنت الآن جاهز لتطبيق النطق والشادوينج بصوتك في الخطوة التالية."
              : "Now let's activate these exact sentences with your voice in Step 5."}
          </p>
          <button
            type="button"
            onClick={onContinue}
            className="mt-1 px-6 py-3 rounded-xl btn-primary-crest text-white text-xs sm:text-sm font-black cursor-pointer"
          >
            {isArabic ? "التالي: النطق والشادوينج →" : "Continue to Pronunciation & Shadow →"}
          </button>
        </div>
      )}

      <div className="flex items-center justify-between pt-3 border-t border-border">
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2.5 rounded-xl bg-surface border border-border text-xs font-bold text-ink cursor-pointer"
        >
          ← {isArabic ? "السابق" : "Back"}
        </button>
        {stage !== "done" && (
          <button
            type="button"
            onClick={onContinue}
            className="text-xs font-bold text-ink-soft hover:text-[#002868] cursor-pointer"
          >
            {isArabic ? "الانتقال للخطوة التالية →" : "Next Step →"}
          </button>
        )}
      </div>
    </section>
  );
}
