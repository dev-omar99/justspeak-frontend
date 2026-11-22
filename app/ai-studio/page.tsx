"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Header from "../../components/Header";
import PageTransition from "../../components/PageTransition";
import Button from "../../components/Button";
import {
  AI_PRACTICE_TOPICS,
  AI_TOPIC_CATEGORIES,
  AiPracticeTopic,
  AiTopicCategory,
} from "../../lib/ai-topics";
import { canAccessAiStudio, getPlanById } from "../../lib/plans";
import { getUser, getToken, saveUserSubscription } from "../../lib/auth";
import { consumeAiTokens, sendAiStudioTurn } from "../../services/api";
import { PlanTierId } from "../../types";

interface AiTurnMessage {
  id: string;
  role: "ai" | "user";
  text: string;
  tip?: string;
}

const FOLLOW_UP_QUESTIONS: Record<string, string[]> = {
  "Daily Life & Travel": [
    "Suppose your flight gets delayed by 4 hours at the gate. How would you politely ask the airline agent for meal vouchers or rebooking?",
    "Tell me about the best local dish from your city and how you would describe its flavor to a foreign traveler.",
    "What is one travel experience that taught you something unexpected about another culture?",
  ],
  "Career & Tech": [
    "Can you share a specific example of a challenging problem or deadline you solved recently and what the result was?",
    "If a stakeholder disagrees with your technical or business proposal, how do you persuade them constructively?",
    "Where do you see your career growing over the next two years, and what skills are you prioritizing?",
  ],
  "IELTS & Academic": [
    "In IELTS Part 3, examiners look for structured arguments. Do you think technology makes people more connected or more isolated, and why?",
    "How can governments and individuals balance economic growth with environmental protection in modern cities?",
    "Try using a linking phrase like 'Furthermore' or 'On the other hand'—what is your view on remote education?",
  ],
  "Executive Debate": [
    "If a client asks for a 25% discount before signing an annual contract, how do you protect your value without losing the deal?",
    "Imagine you have 60 seconds with an angel investor. What makes your product 10x better than existing alternatives?",
    "How do you align a cross-functional team when priorities suddenly shift mid-quarter?",
  ],
};

function buildAiCoachReply(
  topic: AiPracticeTopic,
  userText: string,
  turnIndex: number
): { reply: string; tip: string } {
  const words = userText.trim().split(/\s+/).filter(Boolean);
  const pool =
    FOLLOW_UP_QUESTIONS[topic.category] ||
    FOLLOW_UP_QUESTIONS["Daily Life & Travel"];
  const nextQuestion = pool[turnIndex % pool.length];

  let tip =
    "Great clarity! Try expanding with a concrete example ('For instance, last month...') to boost your lexical resource score.";
  if (words.length < 8) {
    tip =
      "Tip: Try speaking in 2–3 full sentences using connectors like 'Because of this' or 'In my experience' for stronger fluency.";
  } else if (words.length >= 18) {
    tip =
      "Excellent sentence length and flow! Your pacing and vocabulary depth sound natural and confident.";
  }

  const reply = `That's a thoughtful point on "${topic.title}". Building on what you shared—${nextQuestion}`;
  return { reply, tip };
}

export default function AiStudioPage() {
  const [selectedCategory, setSelectedCategory] =
    useState<AiTopicCategory>("All Tracks");
  const [userTier, setUserTier] = useState<PlanTierId>("FREE");
  const [aiTokens, setAiTokens] = useState<number>(0);
  const [lockedModalTopic, setLockedModalTopic] =
    useState<AiPracticeTopic | null>(null);
  const [activePreviewTopic, setActivePreviewTopic] =
    useState<AiPracticeTopic | null>(null);
  const [messages, setMessages] = useState<AiTurnMessage[]>([]);
  const [userInput, setUserInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isSpeakingAi, setIsSpeakingAi] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);

  useEffect(() => {
    const user = getUser();
    if (user) {
      const tier = user.planTier || "FREE";
      setUserTier(tier);
      setAiTokens(user.aiTokensBalance ?? getPlanById(tier).monthlyAiTokens);
    }
  }, []);

  function speakText(text: string) {
    if (
      typeof window === "undefined" ||
      !("speechSynthesis" in window) ||
      !voiceEnabled
    ) {
      return;
    }
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";
      utterance.rate = 0.98;
      utterance.onstart = () => setIsSpeakingAi(true);
      utterance.onend = () => setIsSpeakingAi(false);
      utterance.onerror = () => setIsSpeakingAi(false);
      window.speechSynthesis.speak(utterance);
    } catch {}
  }

  const filteredTopics = AI_PRACTICE_TOPICS.filter(
    (topic) =>
      selectedCategory === "All Tracks" || topic.category === selectedCategory
  );

  async function handleLaunchTopic(topic: AiPracticeTopic) {
    const hasStudioAccess = canAccessAiStudio(userTier, aiTokens);
    const needsElite = topic.requiredTier === "ELITE" && userTier !== "ELITE";

    if (!hasStudioAccess || needsElite || aiTokens < topic.tokenCostPerSession) {
      setLockedModalTopic(topic);
      return;
    }

    let nextBalance = Math.max(0, aiTokens - topic.tokenCostPerSession);
    const user = getUser();
    const token = getToken();
    if (token) {
      try {
        const res = await consumeAiTokens(token, topic.tokenCostPerSession, topic.id);
        if (res && typeof res.aiTokensBalance === "number") {
          nextBalance = res.aiTokensBalance;
        }
      } catch {}
    }

    saveUserSubscription(user?.id, userTier, nextBalance);
    setAiTokens(nextBalance);

    const openingMsg: AiTurnMessage = {
      id: "opening-1",
      role: "ai",
      text: topic.samplePrompt,
      tip: `Focus skills: ${topic.skillsFocused.join(" • ")}`,
    };
    setMessages([openingMsg]);
    setUserInput("");
    setActivePreviewTopic(topic);
    speakText(topic.samplePrompt);
  }

  async function handleSendUserResponse(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!activePreviewTopic || !userInput.trim()) return;

    const cleanText = userInput.trim();
    const userTurn: AiTurnMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      text: cleanText,
    };

    setMessages((prev) => [...prev, userTurn]);
    setUserInput("");

    let { reply, tip } = buildAiCoachReply(
      activePreviewTopic,
      cleanText,
      messages.length
    );

    const token = getToken();
    if (token) {
      try {
        const serverTurn = await sendAiStudioTurn(token, {
          topicTitle: activePreviewTopic.title,
          category: activePreviewTopic.category,
          userMessage: cleanText,
          turnIndex: messages.length,
        });
        if (serverTurn && serverTurn.reply) {
          reply = serverTurn.reply;
          tip = serverTurn.tip || tip;
        }
      } catch {}
    }

    const aiTurn: AiTurnMessage = {
      id: `ai-${Date.now() + 1}`,
      role: "ai",
      text: reply,
      tip,
    };

    setMessages((prev) => [...prev, aiTurn]);
    speakText(reply);
  }

  function toggleSpeechRecognition() {
    if (typeof window === "undefined") return;
    const SpeechRec =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      alert(
        "Voice speech-to-text is supported in Chrome/Edge/Safari. You can also type your English response below!"
      );
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRec();
      recognition.lang = "en-US";
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      setIsListening(true);

      recognition.onresult = (event: any) => {
        const transcript = event.results?.[0]?.[0]?.transcript || "";
        if (transcript) {
          setUserInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
        }
      };
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);
      recognition.start();
    } catch {
      setIsListening(false);
    }
  }

  return (
    <main className="min-h-screen flex flex-col pb-24 lg:pb-16 relative">
      <Header />

      <PageTransition>
        <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8">
          {/* AI Studio Hero Banner */}
          <section className="rounded-[32px] bg-gradient-to-br from-[#061533] via-[#002868] to-[#881337] text-white p-6 sm:p-10 shadow-2xl border-2 border-[#E11D48]/35 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative overflow-hidden">
            <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-[#E11D48]/35 blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col gap-2.5 max-w-2xl">
              <span className="inline-flex items-center gap-1.5 bg-white/12 border border-white/25 text-white text-[11px] sm:text-xs font-extrabold px-3 py-1 rounded-full max-w-full">
                🤖 Standalone AI Speaking Partner • Separate from Human Calls
              </span>
              <h1 className="text-2xl sm:text-4xl font-black leading-tight tracking-tight">
                AI Topic Speaking Studio
              </h1>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                Practice diverse real-world topics, job interviews, and IELTS speaking scenarios 24/7 with our dedicated AI model using your monthly AI Token balance.
              </p>
            </div>

            {/* Live AI Token Balance Card */}
            <div className="relative z-10 bg-white/12 backdrop-blur-md border border-white/20 rounded-3xl p-5 flex flex-col gap-3 min-w-[240px] w-full lg:w-auto">
              <div className="flex items-center justify-between gap-4">
                <span className="text-xs font-bold text-slate-200">
                  Your AI Token Balance
                </span>
                <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-[#E11D48] text-white">
                  {userTier}
                </span>
              </div>
              <div className="text-3xl font-black text-white flex items-center gap-1.5">
                <span className="text-[#FF4D6D]">⚡</span>
                <span>{aiTokens.toLocaleString()}</span>
                <span className="text-xs font-semibold text-slate-200">
                  tokens
                </span>
              </div>
              <Link
                href="/pricing"
                className="w-full py-2.5 rounded-xl btn-primary-crest text-white text-xs font-black text-center shadow-md transition-all"
              >
                {aiTokens > 0 ? "Get 3,500 Elite Tokens →" : "Unlock AI Tokens →"}
              </Link>
            </div>
          </section>

          {/* Category Filter Capsules */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {AI_TOPIC_CATEGORIES.map((category) => {
              const active = selectedCategory === category;
              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer ${
                    active
                      ? "bg-[#0B1F3A] text-white shadow-md"
                      : "bg-white text-ink-soft hover:text-ink border border-border"
                  }`}
                >
                  {category}
                </button>
              );
            })}
          </div>

          {/* Topics Grid */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredTopics.map((topic) => {
              const isEliteTrack = topic.requiredTier === "ELITE";
              const isUnlocked =
                canAccessAiStudio(userTier, aiTokens) &&
                (!isEliteTrack || userTier === "ELITE");

              return (
                <div
                  key={topic.id}
                  className="luxury-card bg-white rounded-3xl p-6 border border-border shadow-sm flex flex-col justify-between gap-5"
                >
                  <div className="flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-surface-subtle border border-border flex items-center justify-center text-2xl">
                          {topic.icon}
                        </div>
                        <div>
                          <span className="text-[11px] font-extrabold text-glacier">
                            {topic.category} • {topic.level}
                          </span>
                          <h2 className="text-base font-black text-ink mt-0.5">
                            {topic.title}
                          </h2>
                        </div>
                      </div>

                      <span
                        className={`text-[11px] font-black px-2.5 py-1 rounded-full whitespace-nowrap ${
                          isEliteTrack
                            ? "bg-[#FEF7E6] text-[#B45309] border border-[#F5A623]/50"
                            : "bg-[#EDF6FC] text-[#2264A3] border border-[#3B82C4]/30"
                        }`}
                      >
                        {isEliteTrack ? "👑 Elite" : "⚡ Plus+"}
                      </span>
                    </div>

                    <p className="text-xs text-ink-soft leading-relaxed">
                      {topic.summary}
                    </p>

                    <div className="bg-surface rounded-2xl p-3.5 border border-border/80">
                      <span className="text-[10px] font-black uppercase tracking-wider text-ink-soft">
                        Opening AI Prompt
                      </span>
                      <p className="text-xs font-semibold text-ink italic mt-1">
                        &ldquo;{topic.samplePrompt}&rdquo;
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {topic.skillsFocused.map((skill) => (
                        <span
                          key={skill}
                          className="text-[11px] font-bold px-2.5 py-0.5 rounded-lg bg-surface-subtle text-ink-soft"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-border/70 gap-3">
                    <span className="text-xs font-extrabold text-[#B45309]">
                      ⚡ {topic.tokenCostPerSession} Tokens / session
                    </span>

                    <button
                      type="button"
                      onClick={() => handleLaunchTopic(topic)}
                      className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                        isUnlocked
                          ? "btn-primary-crest text-white shadow-sm"
                          : "bg-[#0B1F3A] hover:bg-[#122E54] text-white"
                      }`}
                    >
                      <span>{isUnlocked ? "🎙️ Start AI Session" : "🔒 Unlock with Tokens"}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </section>
        </div>
      </PageTransition>

      {/* Paid Plan / Token Gate Modal */}
      {lockedModalTopic && (
        <div
          className="fixed inset-0 z-50 bg-[#071426]/70 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setLockedModalTopic(null)}
        >
          <div
            className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-border flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <span className="text-2xl">{lockedModalTopic.icon}</span>
              <span className="text-[11px] font-black px-3 py-1 rounded-full bg-[#FEF7E6] text-[#B45309] border border-[#F5A623]/40">
                Requires {lockedModalTopic.requiredTier} Plan Tokens
              </span>
            </div>

            <div>
              <h3 className="text-lg font-black text-ink">
                Unlock &ldquo;{lockedModalTopic.title}&rdquo;
              </h3>
              <p className="text-xs text-ink-soft leading-relaxed mt-1.5">
                AI Topic Speaking Studio is available exclusively to paid members using monthly AI Tokens:
              </p>
              <ul className="mt-3 flex flex-col gap-2 text-xs text-ink">
                <li className="flex items-center justify-between bg-surface p-2.5 rounded-xl border border-border">
                  <span className="font-bold">⚡ JustSpeak Plus</span>
                  <span className="font-black text-glacier">500 AI Tokens / mo</span>
                </li>
                <li className="flex items-center justify-between bg-[#FEF7E6]/70 p-2.5 rounded-xl border border-[#F5A623]/50">
                  <span className="font-bold">👑 JustSpeak Elite</span>
                  <span className="font-black text-[#B45309]">3,500 AI Tokens / mo (7x!)</span>
                </li>
              </ul>
            </div>

            <div className="flex gap-2.5 pt-2">
              <Button
                variant="secondary"
                onClick={() => setLockedModalTopic(null)}
              >
                Close
              </Button>
              <Link
                href="/pricing"
                className="w-full h-12 rounded-2xl text-xs sm:text-sm font-black flex items-center justify-center bg-gradient-to-r from-[#F5A623] to-[#D97706] text-[#0B1F3A] shadow-md"
              >
                View Token Plans →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Live Interactive AI Topic Speaking Studio Modal */}
      {activePreviewTopic && (
        <div
          className="fixed inset-0 z-50 bg-[#071426]/80 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => {
            if (typeof window !== "undefined" && "speechSynthesis" in window) {
              window.speechSynthesis.cancel();
            }
            setActivePreviewTopic(null);
          }}
        >
          <div
            className="bg-white rounded-[30px] p-5 sm:p-7 max-w-2xl w-full max-h-[90vh] shadow-2xl border border-border flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{activePreviewTopic.icon}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-lg font-black text-ink">
                      {activePreviewTopic.title}
                    </h3>
                    {isSpeakingAi && (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 animate-pulse">
                        🔊 AI Speaking...
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] font-bold text-ink-soft">
                    {activePreviewTopic.category} •{" "}
                    <span className="text-[#B45309]">
                      ⚡ {aiTokens.toLocaleString()} AI Tokens remaining
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const next = !voiceEnabled;
                    setVoiceEnabled(next);
                    if (
                      !next &&
                      typeof window !== "undefined" &&
                      "speechSynthesis" in window
                    ) {
                      window.speechSynthesis.cancel();
                    }
                  }}
                  className="px-3 py-1.5 rounded-xl bg-surface border border-border text-xs font-bold text-ink cursor-pointer"
                >
                  {voiceEnabled ? "🔊 Voice On" : "🔇 Muted"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (
                      typeof window !== "undefined" &&
                      "speechSynthesis" in window
                    ) {
                      window.speechSynthesis.cancel();
                    }
                    setActivePreviewTopic(null);
                  }}
                  className="w-8 h-8 rounded-xl bg-surface hover:bg-surface-subtle text-ink font-black text-xs flex items-center justify-center cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Conversation Stream */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-[48vh]">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${
                    msg.role === "user" ? "items-end" : "items-start"
                  }`}
                >
                  <div
                    className={`max-w-[88%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-[#0B1F3A] text-white rounded-br-xs"
                        : "bg-surface border border-border text-ink rounded-bl-xs"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3 mb-1">
                      <span className="text-[10px] font-black uppercase tracking-wider opacity-75">
                        {msg.role === "user" ? "You" : "🤖 JustSpeak AI Coach"}
                      </span>
                      {msg.role === "ai" && (
                        <button
                          type="button"
                          onClick={() => speakText(msg.text)}
                          className="text-[11px] font-bold text-glacier hover:underline cursor-pointer"
                        >
                          🔊 Replay
                        </button>
                      )}
                    </div>
                    <p>{msg.text}</p>
                    {msg.tip && (
                      <div className="mt-2.5 pt-2 border-t border-border/70 text-[11px] font-semibold text-[#B45309]">
                        💡 {msg.tip}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Microphone & Text Input Controls */}
            <form
              onSubmit={handleSendUserResponse}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-3 border-t border-border"
            >
              <button
                type="button"
                onClick={toggleSpeechRecognition}
                className={`px-4 py-3 rounded-2xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                  isListening
                    ? "bg-rose-600 text-white animate-pulse shadow-md"
                    : "bg-[#EDF6FC] hover:bg-[#DBEEFA] text-[#0B1F3A] border border-[#3B82C4]/40"
                }`}
              >
                <span>🎙️</span>
                <span>{isListening ? "Listening..." : "Speak in English"}</span>
              </button>

              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="Speak with mic or type your English response here..."
                className="flex-1 h-11 rounded-2xl border border-border px-4 text-xs sm:text-sm text-ink focus:outline-none focus:border-glacier"
              />

              <button
                type="submit"
                disabled={!userInput.trim()}
                className="px-5 py-3 rounded-2xl btn-primary-crest text-white text-xs font-black disabled:opacity-40 cursor-pointer shrink-0"
              >
                Send Reply →
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
