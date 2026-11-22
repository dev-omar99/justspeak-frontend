"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Header from "../../components/Header";
import PageTransition from "../../components/PageTransition";
import { useI18n } from "../../lib/i18n";
import {
  AI_PRACTICE_TOPICS,
  AI_TOPIC_CATEGORIES,
  AiPracticeTopic,
  AiTopicCategory,
} from "../../lib/ai-topics";
import { getToken } from "../../lib/auth";
import { sendAiStudioTurn } from "../../services/api";
import { getAcademyProgress, saveAcademyProgress } from "../../lib/academy";

interface AiTurnMessage {
  id: string;
  role: "ai" | "user";
  text: string;
  tip?: string;
  corrections?: string[];
  nativeUpgrade?: string;
  fluencyScore?: number;
  grammarScore?: number;
  vocabScore?: number;
  suggestedPhrases?: string[];
  wordCount?: number;
}

function analyzeLocally(topic: AiPracticeTopic, userText: string, turnIndex: number) {
  const words = userText.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const rules: { rx: RegExp; fix: string; rep: string }[] = [
    { rx: /\bi am agree\b/i, fix: 'Say "I agree" instead of "I am agree".', rep: "I agree" },
    { rx: /\b(he|she|it)\s+don'?t\b/i, fix: 'Use "doesn\'t" with he/she/it.', rep: "$1 doesn't" },
    { rx: /\bmore better\b/i, fix: 'Say "much better" instead of "more better".', rep: "much better" },
    { rx: /\b(go|went|going)\s+to\s+home\b/i, fix: 'Say "go/went home" without "to".', rep: "$1 home" },
    { rx: /\bdepend\s+of\b/i, fix: 'Use "depend on" instead of "depend of".', rep: "depend on" },
    { rx: /\binformations\b/i, fix: '"Information" is uncountable (no "s").', rep: "information" },
    { rx: /\badvices\b/i, fix: '"Advice" is uncountable (say "some advice").', rep: "advice" },
    { rx: /\bdiscuss\s+about\b/i, fix: 'Say "discuss" without "about".', rep: "discuss" },
    { rx: /\bexplain\s+me\b/i, fix: 'Say "explain to me".', rep: "explain to me" },
  ];

  const corrections: string[] = [];
  let upgraded = userText.trim();
  for (const r of rules) {
    if (r.rx.test(upgraded)) {
      corrections.push(r.fix);
      upgraded = upgraded.replace(r.rx, r.rep);
    }
  }

  const hasConnector =
    /\b(because|however|therefore|moreover|for example|in my opinion|personally|furthermore|although)\b/i.test(
      userText
    );
  const stopWords = new Set([
    "the", "and", "for", "that", "this", "with", "have", "from", "they", "would",
    "about", "there", "their", "really", "very", "just", "like", "think", "because",
  ]);
  const keyword =
    words
      .map((w) => w.replace(/[^a-zA-Z]/g, "").toLowerCase())
      .find((w) => w.length >= 5 && !stopWords.has(w)) || "";

  const intro = keyword
    ? `You made a great point about "${keyword}".`
    : `That's a thoughtful point on "${topic.title}".`;

  const followUps = [
    `${intro} Could you share a specific real-life example or story that illustrates that?`,
    `${intro} What do you see as the toughest challenge people face in this situation?`,
    `${intro} If someone strongly disagreed with you, what would be your most persuasive argument?`,
    `${intro} How do you think this will change over the next few years?`,
  ];

  const fluencyScore = wordCount < 8 ? 76 : hasConnector ? 95 : 88;
  const grammarScore = Math.max(70, 95 - corrections.length * 9);
  const vocabScore = hasConnector ? 92 : 83;
  const tip =
    corrections[0] ||
    (wordCount < 8
      ? `You spoke ${wordCount} words. Try expanding with "because..." or "for example..." to reach 15–20 words.`
      : hasConnector
      ? `Strong ${wordCount}-word flow with clear linking phrases!`
      : `Good ${wordCount}-word answer! Try opening your next thought with "From my perspective," or "Furthermore,".`);

  const nativeUpgrade =
    upgraded !== userText.trim()
      ? upgraded
      : wordCount < 10
      ? `From my perspective, ${userText.trim().charAt(0).toLowerCase()}${userText.trim().slice(1).replace(/\.$/, "")}, because it makes a meaningful difference.`
      : "";

  return {
    reply: followUps[turnIndex % followUps.length],
    tip,
    corrections,
    nativeUpgrade,
    fluencyScore,
    grammarScore,
    vocabScore,
    suggestedPhrases: [
      "From my perspective, the main reason is...",
      "A concrete example from my experience is...",
      "On the other hand, I would argue that...",
    ],
    wordCount,
  };
}

export default function AiStudioPage() {
  const { lang } = useI18n();
  const isArabic = lang === "ar";

  const [selectedCategory, setSelectedCategory] =
    useState<AiTopicCategory>("All Tracks");
  const [activeTopic, setActiveTopic] = useState<AiPracticeTopic | null>(null);
  const [messages, setMessages] = useState<AiTurnMessage[]>([]);
  const [userInput, setUserInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isSpeakingAi, setIsSpeakingAi] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [speechRate, setSpeechRate] = useState<number>(0.96);

  const recRef = useRef<any>(null);
  const streamEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    streamEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking]);

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  function speakText(text: string, customRate?: number) {
    if (
      typeof window === "undefined" ||
      !("speechSynthesis" in window) ||
      !voiceEnabled
    ) {
      return;
    }
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "en-US";
      u.rate = customRate ?? speechRate;
      const voices = window.speechSynthesis.getVoices();
      const natural =
        voices.find(
          (v) =>
            v.lang.startsWith("en") &&
            (v.name.includes("Google") ||
              v.name.includes("Natural") ||
              v.name.includes("Samantha") ||
              v.name.includes("Jenny"))
        ) || voices.find((v) => v.lang.startsWith("en"));
      if (natural) u.voice = natural;
      u.onstart = () => setIsSpeakingAi(true);
      u.onend = () => setIsSpeakingAi(false);
      u.onerror = () => setIsSpeakingAi(false);
      window.speechSynthesis.speak(u);
    } catch {
      setIsSpeakingAi(false);
    }
  }

  function handleStartTopic(topic: AiPracticeTopic) {
    const opening: AiTurnMessage = {
      id: "opening-1",
      role: "ai",
      text: topic.samplePrompt,
      tip: `Skills in focus: ${topic.skillsFocused.join(" • ")}`,
      suggestedPhrases: [
        "To be honest, I usually...",
        "From my perspective...",
        "Could you clarify what you mean by...?",
      ],
    };
    setMessages([opening]);
    setUserInput("");
    setActiveTopic(topic);
    speakText(topic.samplePrompt);
  }

  async function handleSendTurn(overrideText?: string) {
    const cleanText = (overrideText || userInput).trim();
    if (!activeTopic || !cleanText || isThinking) return;

    if (recRef.current && isListening) {
      try {
        recRef.current.stop();
      } catch {}
      setIsListening(false);
    }

    const userMsg: AiTurnMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      text: cleanText,
      wordCount: cleanText.split(/\s+/).filter(Boolean).length,
    };

    setMessages((prev) => [...prev, userMsg]);
    setUserInput("");
    setIsThinking(true);

    let coachResult = analyzeLocally(activeTopic, cleanText, messages.length);

    const token = getToken();
    if (token) {
      try {
        const res = await sendAiStudioTurn(token, {
          topicTitle: activeTopic.title,
          category: activeTopic.category,
          userMessage: cleanText,
          turnIndex: messages.length,
        });
        if (res && res.reply) {
          coachResult = {
            reply: res.reply,
            tip: res.tip || coachResult.tip,
            corrections: res.corrections || coachResult.corrections,
            nativeUpgrade: res.nativeUpgrade || coachResult.nativeUpgrade,
            fluencyScore: res.fluencyScore ?? coachResult.fluencyScore,
            grammarScore: res.grammarScore ?? coachResult.grammarScore,
            vocabScore: res.vocabScore ?? coachResult.vocabScore,
            suggestedPhrases: res.suggestedPhrases?.length
              ? res.suggestedPhrases
              : coachResult.suggestedPhrases,
            wordCount: res.wordCount ?? coachResult.wordCount,
          };
        }
      } catch {}
    }

    // Sync improved fluency/grammar scores into CEFR Academy progress
    try {
      const academy = getAcademyProgress();
      saveAcademyProgress({
        ...academy,
        scores: {
          ...academy.scores,
          fluency: Math.round((academy.scores.fluency + coachResult.fluencyScore) / 2),
          grammar: Math.round((academy.scores.grammar + coachResult.grammarScore) / 2),
          vocabulary: Math.round((academy.scores.vocabulary + coachResult.vocabScore) / 2),
        },
      });
    } catch {}

    const aiMsg: AiTurnMessage = {
      id: `ai-${Date.now() + 1}`,
      role: "ai",
      text: coachResult.reply,
      tip: coachResult.tip,
      corrections: coachResult.corrections,
      nativeUpgrade: coachResult.nativeUpgrade,
      fluencyScore: coachResult.fluencyScore,
      grammarScore: coachResult.grammarScore,
      vocabScore: coachResult.vocabScore,
      suggestedPhrases: coachResult.suggestedPhrases,
    };

    setIsThinking(false);
    setMessages((prev) => [...prev, aiMsg]);
    speakText(coachResult.reply);
  }

  function toggleMic() {
    if (typeof window === "undefined") return;
    const SpeechRec =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      alert("Live microphone recognition works in Chrome, Edge, and Safari. You can also type below.");
      return;
    }

    if (isListening && recRef.current) {
      try {
        recRef.current.stop();
      } catch {}
      setIsListening(false);
      return;
    }

    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    try {
      const rec = new SpeechRec();
      rec.lang = "en-US";
      rec.interimResults = true;
      rec.maxAlternatives = 1;
      recRef.current = rec;
      setIsListening(true);

      rec.onresult = (e: any) => {
        let finalText = "";
        let interimText = "";
        for (let i = e.resultIndex; i < e.results.length; i++) {
          if (e.results[i].isFinal) finalText += e.results[i][0].transcript;
          else interimText += e.results[i][0].transcript;
        }
        const captured = (finalText || interimText).trim();
        if (captured) setUserInput(captured);
      };
      rec.onend = () => setIsListening(false);
      rec.onerror = () => setIsListening(false);
      rec.start();
    } catch {
      setIsListening(false);
    }
  }

  const filteredTopics = AI_PRACTICE_TOPICS.filter(
    (t) => selectedCategory === "All Tracks" || t.category === selectedCategory
  );

  const lastAiMessage = [...messages].reverse().find((m) => m.role === "ai");

  return (
    <main className="min-h-screen flex flex-col pb-24 lg:pb-16 bg-surface text-ink">
      <Header />

      <PageTransition>
        <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-7 flex flex-col gap-6">
          {/* ACTIVE VOICE COACHING SESSION (Clean Editorial Split View) */}
          {activeTopic ? (
            <section className="bg-white border border-border rounded-[26px] shadow-sm overflow-hidden flex flex-col">
              {/* Top Session Bar */}
              <div className="bg-[#061533] text-white px-5 py-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    type="button"
                    onClick={() => {
                      if (typeof window !== "undefined" && "speechSynthesis" in window) {
                        window.speechSynthesis.cancel();
                      }
                      setActiveTopic(null);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold cursor-pointer"
                  >
                    ← {isArabic ? "كل السيناريوهات" : "All Scenarios"}
                  </button>
                  <div className="min-w-0">
                    <h1 className="text-sm sm:text-base font-black truncate">
                      {activeTopic.icon} {activeTopic.title}
                    </h1>
                    <p className="text-[11px] text-slate-300">
                      {isSpeakingAi
                        ? "🔊 Coach is speaking..."
                        : isListening
                        ? "🎙️ Listening to your English..."
                        : "Oxford-Trained Voice Coach • Live Grammar & Native Rewrite"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <select
                    value={speechRate}
                    onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
                    className="bg-white/10 border border-white/20 text-white text-xs font-bold px-2.5 py-1.5 rounded-xl"
                  >
                    <option value={0.82} className="text-ink">0.82x Slow</option>
                    <option value={0.96} className="text-ink">1.0x Normal</option>
                    <option value={1.12} className="text-ink">1.12x Fast</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      const next = !voiceEnabled;
                      setVoiceEnabled(next);
                      if (!next && typeof window !== "undefined" && "speechSynthesis" in window) {
                        window.speechSynthesis.cancel();
                      }
                    }}
                    className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold cursor-pointer"
                  >
                    {voiceEnabled ? "🔊 Voice On" : "🔇 Muted"}
                  </button>
                </div>
              </div>

              {/* Conversation & Real-Time Coaching Stream */}
              <div className="p-5 sm:p-6 bg-surface flex-1 max-h-[56vh] overflow-y-auto space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${
                      msg.role === "user" ? "items-end" : "items-start"
                    }`}
                  >
                    <div
                      className={`max-w-[92%] sm:max-w-[82%] rounded-2xl p-4 sm:p-5 text-sm leading-relaxed shadow-2xs ${
                        msg.role === "user"
                          ? "bg-[#002868] text-white rounded-br-sm"
                          : "bg-white border border-border text-ink rounded-bl-sm"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3 mb-1.5">
                        <span
                          className={`text-[10px] font-black uppercase tracking-wider ${
                            msg.role === "user" ? "text-slate-200" : "text-[#002868]"
                          }`}
                        >
                          {msg.role === "user" ? "You" : "🎓 JustSpeak AI Coach"}
                        </span>
                        {msg.role === "ai" && (
                          <button
                            type="button"
                            onClick={() => speakText(msg.text)}
                            className="text-[11px] font-extrabold text-[#D91023] hover:underline cursor-pointer"
                          >
                            🔊 Replay
                          </button>
                        )}
                      </div>

                      <p className="font-semibold">{msg.text}</p>

                      {/* Real Grammar Corrections */}
                      {msg.corrections && msg.corrections.length > 0 && (
                        <div className="mt-3 p-3 rounded-xl bg-[#FFF0F2] border border-[#D91023]/25 text-xs text-[#9F1239] flex flex-col gap-1">
                          <span className="font-black text-[#D91023]">
                            ✍️ Grammar & Phrasing Fix:
                          </span>
                          {msg.corrections.map((c, idx) => (
                            <span key={idx} className="font-semibold">
                              • {c}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Native Speaker Upgrade */}
                      {msg.nativeUpgrade && (
                        <div className="mt-2.5 p-3 rounded-xl bg-[#ECFDF5] border border-[#10B981]/35 text-xs text-[#065F46] flex items-start justify-between gap-2">
                          <div>
                            <span className="font-black block">
                              ✨ How a Native Speaker Would Say It:
                            </span>
                            <span className="italic font-bold">
                              &ldquo;{msg.nativeUpgrade}&rdquo;
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => speakText(msg.nativeUpgrade!)}
                            className="px-2.5 py-1 rounded-lg bg-white border border-[#10B981]/30 text-[#059669] font-black shrink-0 cursor-pointer"
                          >
                            🔊 Hear
                          </button>
                        </div>
                      )}

                      {/* 3-Metric Score Pills + Tip */}
                      {(msg.fluencyScore || msg.tip) && (
                        <div className="mt-3 pt-2.5 border-t border-border/70 flex flex-col gap-1.5 text-xs">
                          {msg.fluencyScore && (
                            <div className="flex flex-wrap gap-1.5">
                              <span className="px-2.5 py-0.5 rounded-full bg-[#EAF1FC] text-[#002868] font-black text-[11px]">
                                Fluency: {msg.fluencyScore}%
                              </span>
                              {msg.grammarScore && (
                                <span className="px-2.5 py-0.5 rounded-full bg-[#ECFDF5] text-[#065F46] font-black text-[11px]">
                                  Grammar: {msg.grammarScore}%
                                </span>
                              )}
                              {msg.vocabScore && (
                                <span className="px-2.5 py-0.5 rounded-full bg-[#FFF0F2] text-[#D91023] font-black text-[11px]">
                                  Vocab: {msg.vocabScore}%
                                </span>
                              )}
                            </div>
                          )}
                          {msg.tip && (
                            <p className="text-ink-soft font-semibold">💡 {msg.tip}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {isThinking && (
                  <div className="text-xs font-bold text-ink-soft animate-pulse">
                    🎓 Coach is analyzing your grammar & phrasing...
                  </div>
                )}
                <div ref={streamEndRef} />
              </div>

              {/* Suggested Reply Starters + Input Bar */}
              <div className="p-4 sm:p-5 bg-white border-t border-border flex flex-col gap-3">
                {lastAiMessage?.suggestedPhrases && lastAiMessage.suggestedPhrases.length > 0 && (
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    <span className="text-[11px] font-black text-ink-soft shrink-0">
                      💡 Try starting with:
                    </span>
                    {lastAiMessage.suggestedPhrases.map((phrase, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setUserInput(phrase + " ")}
                        className="px-3 py-1 rounded-full bg-surface hover:bg-[#EAF1FC] border border-border text-[11px] font-bold text-[#002868] whitespace-nowrap cursor-pointer transition-colors"
                      >
                        &ldquo;{phrase}&rdquo;
                      </button>
                    ))}
                  </div>
                )}

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendTurn();
                  }}
                  className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5"
                >
                  <button
                    type="button"
                    onClick={toggleMic}
                    className={`px-5 py-3 rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 cursor-pointer transition-all shrink-0 ${
                      isListening
                        ? "bg-[#D91023] text-white animate-pulse shadow-md"
                        : "bg-[#002868] hover:bg-[#061533] text-white shadow-2xs"
                    }`}
                  >
                    <span>{isListening ? "⏹️" : "🎙️"}</span>
                    <span>
                      {isListening
                        ? isArabic ? "جاري الاستماع..." : "Listening..."
                        : isArabic ? "تحدث بالمايك" : "Tap to Speak"}
                    </span>
                  </button>

                  <input
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder={
                      isArabic
                        ? "تحدث بالمايك أو اكتب إجابتك بالإنجليزية هنا..."
                        : "Speak with mic or type your English answer..."
                    }
                    className="flex-1 h-12 rounded-xl bg-surface border border-border px-4 text-sm font-semibold text-ink focus:outline-none focus:border-[#002868]"
                  />

                  <button
                    type="submit"
                    disabled={!userInput.trim() || isThinking}
                    className="px-6 py-3 rounded-xl btn-primary-crest text-white text-xs sm:text-sm font-black disabled:opacity-40 cursor-pointer shrink-0"
                  >
                    {isArabic ? "إرسال ←" : "Send →"}
                  </button>
                </form>
              </div>
            </section>
          ) : (
            <>
              {/* BRAND-MATCHED NAVY EDITORIAL HERO */}
              <section className="rounded-[28px] bg-gradient-to-br from-[#061533] via-[#002868] to-[#0B1F3A] text-white p-6 sm:p-9 shadow-lg border border-[#002868]/40 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative overflow-hidden">
                <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-[#D91023]/25 blur-3xl pointer-events-none" />

                <div className="relative z-10 flex flex-col gap-2.5 max-w-2xl">
                  <span className="inline-flex items-center gap-1.5 bg-white/15 border border-white/20 text-white text-xs font-black px-3 py-1 rounded-full w-fit">
                    🎙️ Interactive Voice AI Coach • Grammar + Native Rewrite
                  </span>
                  <h1 className="text-2xl sm:text-4xl font-black tracking-tight">
                    {isArabic ? "مدرب المحادثة الذكي (AI Speaking Coach)" : "AI Speaking & Grammar Coach"}
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                    {isArabic
                      ? "تدرّب بصوتك على سيناريوهات حقيقية (مقابلات عمل، سفر، IELTS) واحصل فوراً على تصحيح القواعد، وإعادة الصياغة بأسلوب المتحدث الأصلي، وتقييم الطلاقة."
                      : "Practice real-world scenarios by voice and receive instant grammar fixes, native-speaker rewrites, and live fluency scoring."}
                  </p>
                </div>

                <Link
                  href="/queue"
                  className="relative z-10 px-5 py-3.5 rounded-2xl btn-primary-crest text-white text-xs sm:text-sm font-black whitespace-nowrap shadow-md"
                >
                  🎙️ {isArabic ? "أو تحدث مع شريك حقيقي →" : "Or Talk to a Real Partner →"}
                </Link>
              </section>

              {/* Category Filter Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {AI_TOPIC_CATEGORIES.map((category) => {
                  const active = selectedCategory === category;
                  return (
                    <button
                      key={category}
                      type="button"
                      onClick={() => setSelectedCategory(category)}
                      className={`px-4 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all cursor-pointer border ${
                        active
                          ? "bg-[#002868] text-white border-[#002868] shadow-xs"
                          : "bg-white text-ink-soft border-border hover:text-ink"
                      }`}
                    >
                      {category}
                    </button>
                  );
                })}
              </div>

              {/* Clean, Spacious Editorial Scenarios Grid */}
              <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {filteredTopics.map((topic) => (
                  <div
                    key={topic.id}
                    className="bg-white rounded-[24px] p-6 sm:p-7 border border-border hover:border-[#002868]/45 shadow-2xs hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-col justify-between gap-5 group"
                  >
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-3xl w-12 h-12 rounded-2xl bg-surface border border-border flex items-center justify-center shrink-0">
                          {topic.icon}
                        </span>
                        <span className="text-xs font-semibold text-slate-400">
                          {topic.category} • {topic.level}
                        </span>
                      </div>

                      <h3 className="text-lg sm:text-xl font-black text-ink group-hover:text-[#002868] transition-colors leading-snug">
                        {topic.title}
                      </h3>

                      <p className="text-sm text-ink-soft leading-relaxed">
                        {topic.summary}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleStartTopic(topic)}
                      className="w-full py-3.5 rounded-2xl btn-primary-crest text-white text-sm font-black shadow-xs cursor-pointer"
                    >
                      🎙️ {isArabic ? "ابدأ جلسة التدريب الصوتي →" : "Start Voice Coaching →"}
                    </button>
                  </div>
                ))}
              </section>
            </>
          )}
        </div>
      </PageTransition>
    </main>
  );
}
