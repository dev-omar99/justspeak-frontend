"use client";

import { useState, useEffect, useRef } from "react";
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
  fluencyScore?: number;
  wordCount?: number;
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
): { reply: string; tip: string; fluencyScore: number; wordCount: number } {
  const words = userText.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const pool =
    FOLLOW_UP_QUESTIONS[topic.category] ||
    FOLLOW_UP_QUESTIONS["Daily Life & Travel"];
  const nextQuestion = pool[turnIndex % pool.length];

  let tip =
    "Great clarity! Try expanding with a concrete example ('For instance, last month...') to boost your lexical depth.";
  let fluencyScore = 88;

  if (wordCount < 8) {
    tip =
      "Fluency Tip: Try speaking in 2–3 full sentences using connectors like 'Because of this' or 'In my experience' for stronger flow.";
    fluencyScore = 76;
  } else if (wordCount >= 18) {
    tip =
      "Native Flow: Excellent pacing and vocabulary depth! Your sentence structure sounds natural and confident.";
    fluencyScore = 96;
  } else {
    fluencyScore = 90;
  }

  const reply = `That's a thoughtful point on "${topic.title}". Building on what you shared—${nextQuestion}`;
  return { reply, tip, fluencyScore, wordCount };
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
  const [speechRate, setSpeechRate] = useState<number>(1.0);
  const [trialClaimedNotice, setTrialClaimedNotice] = useState<string | null>(null);

  const speechRecognitionRef = useRef<any>(null);

  useEffect(() => {
    const user = getUser();
    if (user) {
      const tier = user.planTier || "FREE";
      setUserTier(tier);
      setAiTokens(user.aiTokensBalance ?? getPlanById(tier).monthlyAiTokens);
    }
  }, []);

  // Claim 100 Free Trial Tokens for Instant Voice Coach Testing
  function handleClaimTrialTokens() {
    const user = getUser();
    const newBal = aiTokens + 100;
    const newTier = userTier === "FREE" ? "PLUS" : userTier;
    saveUserSubscription(user?.id, newTier, newBal);
    setUserTier(newTier);
    setAiTokens(newBal);
    setTrialClaimedNotice("🎉 100 Free Trial Tokens Claimed! Launch any Voice Coach scenario below.");
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("storage"));
    }
    setTimeout(() => setTrialClaimedNotice(null), 6000);
  }

  // High-Quality Text-to-Speech (TTS)
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
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";
      utterance.rate = customRate ?? speechRate;

      // Select natural English voice if available
      const voices = window.speechSynthesis.getVoices();
      const naturalVoice = voices.find(
        (v) =>
          v.lang.startsWith("en") &&
          (v.name.includes("Google") ||
            v.name.includes("Natural") ||
            v.name.includes("Samantha") ||
            v.name.includes("Jenny"))
      ) || voices.find((v) => v.lang.startsWith("en"));

      if (naturalVoice) {
        utterance.voice = naturalVoice;
      }

      utterance.onstart = () => setIsSpeakingAi(true);
      utterance.onend = () => setIsSpeakingAi(false);
      utterance.onerror = () => setIsSpeakingAi(false);
      window.speechSynthesis.speak(utterance);
    } catch {
      setIsSpeakingAi(false);
    }
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
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("storage"));
    }

    const openingMsg: AiTurnMessage = {
      id: "opening-1",
      role: "ai",
      text: topic.samplePrompt,
      tip: `Focus skills: ${topic.skillsFocused.join(" • ")}`,
      fluencyScore: 100,
    };
    setMessages([openingMsg]);
    setUserInput("");
    setActivePreviewTopic(topic);
    speakText(topic.samplePrompt);
  }

  async function handleSendUserResponse(overrideText?: string) {
    const textToSend = (overrideText || userInput).trim();
    if (!activePreviewTopic || !textToSend) return;

    // Stop listening if currently speech-recording
    if (speechRecognitionRef.current && isListening) {
      try {
        speechRecognitionRef.current.stop();
      } catch {}
      setIsListening(false);
    }

    const userWords = textToSend.split(/\s+/).filter(Boolean).length;
    const userTurn: AiTurnMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      text: textToSend,
      wordCount: userWords,
    };

    setMessages((prev) => [...prev, userTurn]);
    setUserInput("");

    let { reply, tip, fluencyScore } = buildAiCoachReply(
      activePreviewTopic,
      textToSend,
      messages.length
    );

    const token = getToken();
    if (token) {
      try {
        const serverTurn = await sendAiStudioTurn(token, {
          topicTitle: activePreviewTopic.title,
          category: activePreviewTopic.category,
          userMessage: textToSend,
          turnIndex: messages.length,
        });
        if (serverTurn && serverTurn.reply) {
          reply = serverTurn.reply;
          tip = serverTurn.tip || tip;
          if (typeof serverTurn.fluencyScore === "number") {
            fluencyScore = serverTurn.fluencyScore;
          }
        }
      } catch {}
    }

    const aiTurn: AiTurnMessage = {
      id: `ai-${Date.now() + 1}`,
      role: "ai",
      text: reply,
      tip,
      fluencyScore,
    };

    setMessages((prev) => [...prev, aiTurn]);
    speakText(reply);
  }

  // Interactive Voice Microphone Handler (Web Speech API)
  function toggleSpeechRecognition() {
    if (typeof window === "undefined") return;
    const SpeechRec =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRec) {
      alert(
        "Microphone speech recognition is available in Chrome, Edge, and Safari. You can also type your English response directly below!"
      );
      return;
    }

    if (isListening) {
      if (speechRecognitionRef.current) {
        try {
          speechRecognitionRef.current.stop();
        } catch {}
      }
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRec();
      recognition.lang = "en-US";
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      speechRecognitionRef.current = recognition;

      setIsListening(true);

      // Stop any AI voice playing while user speaks
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }

      recognition.onresult = (event: any) => {
        let interim = "";
        let final = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }
        const text = final || interim;
        if (text) {
          setUserInput(text);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch {
      setIsListening(false);
    }
  }

  return (
    <main className="min-h-screen flex flex-col pb-24 lg:pb-16 relative bg-[#070D1B]">
      <Header />

      <PageTransition>
        <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8">
          
          {/* Trial Claimed Notice Alert */}
          {trialClaimedNotice && (
            <div className="bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 p-4 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-between shadow-lg animate-in fade-in">
              <span>{trialClaimedNotice}</span>
              <button
                onClick={() => setTrialClaimedNotice(null)}
                className="text-white hover:text-emerald-100 font-black px-2"
              >
                ✕
              </button>
            </div>
          )}

          {/* AI Studio Hero Banner */}
          <section className="rounded-[32px] bg-gradient-to-br from-[#0A1628] via-[#0E2038] to-[#1E1B4B] text-white p-6 sm:p-10 shadow-2xl border border-blue-500/30 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative overflow-hidden">
            <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-blue-500/20 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col gap-3 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 bg-blue-500/20 border border-blue-400/30 text-blue-300 text-[11px] sm:text-xs font-black px-3 py-1 rounded-full">
                  🎙️ Real-Time Voice AI Coach • Speech-to-Speech
                </span>
                <span className="text-[11px] font-bold text-slate-400">
                  Powered by Web Speech Engine
                </span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-black leading-tight tracking-tight text-white">
                Voice AI Speaking Coach
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Practice realistic 1-on-1 English conversations with instant spoken voice feedback. Improve your pronunciation, grammar, and fluency score in real time.
              </p>

              {/* Free Trial Claim Button if low on tokens */}
              {aiTokens < 20 && (
                <div className="pt-1 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleClaimTrialTokens}
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black shadow-lg shadow-emerald-600/30 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>🎁</span>
                    <span>Claim 100 Free Tokens (تجربة مجانية)</span>
                  </button>
                  <span className="text-[11px] text-slate-400 hidden sm:inline">
                    No card required • Instant activation
                  </span>
                </div>
              )}
            </div>

            {/* Live AI Token Balance Card */}
            <div className="relative z-10 bg-[#0B1528]/80 backdrop-blur-md border border-slate-700/80 rounded-3xl p-5 flex flex-col gap-3 min-w-[240px] w-full lg:w-auto shadow-xl">
              <div className="flex items-center justify-between gap-4">
                <span className="text-xs font-bold text-slate-300">
                  Your AI Tokens
                </span>
                <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-blue-600 text-white">
                  {userTier}
                </span>
              </div>
              <div className="text-3xl font-black text-white flex items-center gap-1.5">
                <span className="text-amber-400">⚡</span>
                <span>{aiTokens.toLocaleString()}</span>
                <span className="text-xs font-semibold text-slate-400">
                  tokens
                </span>
              </div>
              <Link
                href="/pricing"
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-black text-center shadow-md transition-all active:scale-95"
              >
                {aiTokens > 0 ? "Upgrade for 3,500 Tokens →" : "Unlock Full Access →"}
              </Link>
            </div>
          </section>

          {/* Category Filter Capsules */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {AI_TOPIC_CATEGORIES.map((category) => {
              const active = selectedCategory === category;
              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-2xl text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer ${
                    active
                      ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                      : "bg-[#0E1A30] text-slate-300 hover:text-white border border-slate-700/80"
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
                  className="bg-[#0E1A30]/90 backdrop-blur-md rounded-3xl p-6 border border-slate-700/60 shadow-xl hover:border-blue-500/40 transition-all flex flex-col justify-between gap-4 group"
                >
                  <div className="flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl p-2.5 rounded-2xl bg-blue-950/60 border border-blue-500/20 group-hover:scale-105 transition-transform">
                          {topic.icon}
                        </span>
                        <div>
                          <h3 className="text-base font-bold text-white group-hover:text-blue-300 transition-colors">
                            {topic.title}
                          </h3>
                          <span className="text-[11px] font-semibold text-slate-400">
                            {topic.category} • {topic.level}
                          </span>
                        </div>
                      </div>

                      <span
                        className={`text-[10px] font-black px-2.5 py-0.5 rounded-full shrink-0 ${
                          isEliteTrack
                            ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                            : "bg-blue-500/20 text-blue-300 border border-blue-500/40"
                        }`}
                      >
                        {topic.requiredTier}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">
                      {topic.summary}
                    </p>

                    <div className="bg-[#070D1B] rounded-2xl p-3.5 border border-slate-800">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                        Opening AI Question
                      </span>
                      <p className="text-xs font-medium text-slate-200 italic mt-1">
                        &ldquo;{topic.samplePrompt}&rdquo;
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {topic.skillsFocused.map((skill) => (
                        <span
                          key={skill}
                          className="text-[10px] font-semibold px-2.5 py-0.5 rounded-lg bg-slate-800/80 text-slate-300 border border-slate-700/50"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-800 gap-3">
                    <span className="text-xs font-extrabold text-amber-400 flex items-center gap-1">
                      <span>⚡</span>
                      <span>{topic.tokenCostPerSession} Tokens / session</span>
                    </span>

                    <button
                      type="button"
                      onClick={() => handleLaunchTopic(topic)}
                      className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 shadow-md active:scale-95 ${
                        isUnlocked
                          ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-600/30"
                          : "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
                      }`}
                    >
                      <span>{isUnlocked ? "🎙️ Start Voice Session" : "🔒 Unlock with Tokens"}</span>
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
          className="fixed inset-0 z-50 bg-[#070D1B]/80 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setLockedModalTopic(null)}
        >
          <div
            className="bg-[#0F192E] rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-700 text-white flex flex-col gap-4 animate-in fade-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <span className="text-3xl">{lockedModalTopic.icon}</span>
              <span className="text-[11px] font-black px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Requires {lockedModalTopic.requiredTier} Tokens
              </span>
            </div>

            <div>
              <h3 className="text-lg font-black text-white">
                Unlock &ldquo;{lockedModalTopic.title}&rdquo;
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed mt-1.5">
                Get monthly AI Tokens to practice voice roleplays with your AI coach anytime:
              </p>
              <ul className="mt-3 flex flex-col gap-2 text-xs">
                <li className="flex items-center justify-between bg-slate-800/60 p-3 rounded-xl border border-slate-700">
                  <span className="font-bold text-white">⚡ JustSpeak Plus</span>
                  <span className="font-black text-blue-400">500 AI Tokens / mo</span>
                </li>
                <li className="flex items-center justify-between bg-amber-500/10 p-3 rounded-xl border border-amber-500/30">
                  <span className="font-bold text-amber-200">👑 JustSpeak Elite</span>
                  <span className="font-black text-amber-400">3,500 AI Tokens / mo (7x!)</span>
                </li>
              </ul>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={handleClaimTrialTokens}
                className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition-all"
              >
                Claim Free Tokens 🎁
              </button>
              <Link
                href="/pricing"
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-black text-center shadow-md transition-all"
              >
                View Plans →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Full-Screen Interactive Voice AI Speaking Coach Modal */}
      {activePreviewTopic && (
        <div
          className="fixed inset-0 z-50 bg-[#050A15]/90 backdrop-blur-xl flex items-center justify-center p-3 sm:p-4 animate-in fade-in"
          onClick={() => {
            if (typeof window !== "undefined" && "speechSynthesis" in window) {
              window.speechSynthesis.cancel();
            }
            setActivePreviewTopic(null);
          }}
        >
          <div
            className="bg-[#0D1728] rounded-[32px] p-4 sm:p-6 max-w-2xl w-full max-h-[92vh] shadow-2xl border border-blue-500/30 text-white flex flex-col gap-4 relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Bar */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-2xl p-2 rounded-xl bg-blue-950 border border-blue-500/30 shrink-0">
                  {activePreviewTopic.icon}
                </span>
                <div className="min-w-0">
                  <h3 className="text-sm sm:text-base font-black text-white truncate">
                    {activePreviewTopic.title}
                  </h3>
                  <p className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
                    <span>{activePreviewTopic.category}</span>
                    <span>•</span>
                    <span className="text-amber-400 font-bold">
                      ⚡ {aiTokens.toLocaleString()} tokens left
                    </span>
                  </p>
                </div>
              </div>

              {/* Voice Speed & Sound Controls */}
              <div className="flex items-center gap-1.5 shrink-0">
                <select
                  value={speechRate}
                  onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
                  className="bg-slate-800 text-slate-200 text-[11px] font-bold px-2 py-1.5 rounded-xl border border-slate-700 focus:outline-none"
                  title="AI Voice Speed"
                >
                  <option value={0.85}>0.85x (Slow)</option>
                  <option value={1.0}>1.0x (Normal)</option>
                  <option value={1.15}>1.15x (Fast)</option>
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
                  className={`p-2 rounded-xl border text-xs font-bold transition-colors ${
                    voiceEnabled
                      ? "bg-blue-600/20 border-blue-500/40 text-blue-300"
                      : "bg-slate-800 border-slate-700 text-slate-400"
                  }`}
                  title={voiceEnabled ? "Mute Voice" : "Enable Voice"}
                >
                  {voiceEnabled ? "🔊" : "🔇"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (typeof window !== "undefined" && "speechSynthesis" in window) {
                      window.speechSynthesis.cancel();
                    }
                    setActivePreviewTopic(null);
                  }}
                  className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-black text-xs flex items-center justify-center transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Central Animated Voice AI Orb / Soundwave Area */}
            <div className="flex flex-col items-center justify-center py-4 px-2 bg-gradient-to-b from-[#0B1528] to-[#070D1B] rounded-2xl border border-slate-800 relative overflow-hidden">
              {/* Visual Orb */}
              <div className="relative flex items-center justify-center my-2">
                <div
                  className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isSpeakingAi
                      ? "bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600 shadow-xl shadow-cyan-500/50 scale-110 animate-pulse"
                      : isListening
                      ? "bg-gradient-to-r from-rose-500 to-amber-500 shadow-xl shadow-rose-500/50 scale-110 animate-ping"
                      : "bg-gradient-to-r from-blue-700 to-indigo-800 shadow-lg shadow-blue-900/40"
                  }`}
                >
                  <span className="text-3xl select-none">
                    {isListening ? "🎙️" : isSpeakingAi ? "🗣️" : "🤖"}
                  </span>
                </div>

                {/* Animated Equalizer Waves when speaking */}
                {isSpeakingAi && (
                  <div className="absolute -bottom-4 flex items-center gap-1">
                    {[16, 24, 32, 20, 28, 14, 22].map((h, i) => (
                      <span
                        key={i}
                        className="w-1 bg-cyan-400 rounded-full animate-pulse"
                        style={{
                          height: `${h}px`,
                          animationDelay: `${i * 120}ms`,
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Status Indicator */}
              <div className="mt-3 text-center">
                <p className="text-xs font-bold text-slate-200">
                  {isListening
                    ? "Listening to you... Speak in English now!"
                    : isSpeakingAi
                    ? "AI Coach is speaking (en-US)..."
                    : "Tap the microphone below to reply with your voice!"}
                </p>
                {userInput && isListening && (
                  <p className="text-xs text-blue-300 mt-1 italic font-medium max-w-md px-2 truncate">
                    &ldquo;{userInput}&rdquo;
                  </p>
                )}
              </div>
            </div>

            {/* Conversation Stream & Fluency Feedback */}
            <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 max-h-[36vh] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${
                    msg.role === "user" ? "items-end" : "items-start"
                  }`}
                >
                  <div
                    className={`max-w-[90%] sm:max-w-[85%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-br-xs shadow-md"
                        : "bg-[#111E33] border border-slate-700/80 text-slate-100 rounded-bl-xs shadow-md"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3 mb-1.5">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-300">
                        {msg.role === "user" ? "You (Spoken)" : "🤖 AI English Coach"}
                      </span>
                      {msg.role === "ai" && (
                        <button
                          type="button"
                          onClick={() => speakText(msg.text)}
                          className="text-[11px] font-bold text-blue-300 hover:text-white flex items-center gap-1 cursor-pointer"
                        >
                          <span>🔊</span>
                          <span>Replay</span>
                        </button>
                      )}
                      {msg.role === "user" && msg.wordCount && (
                        <span className="text-[10px] font-bold text-blue-200">
                          {msg.wordCount} words spoken
                        </span>
                      )}
                    </div>

                    <p className="font-medium">{msg.text}</p>

                    {/* Fluency Score & Coaching Tip */}
                    {msg.tip && (
                      <div className="mt-3 pt-2.5 border-t border-slate-700/60 flex flex-col gap-1.5 text-[11px]">
                        {typeof msg.fluencyScore === "number" && (
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-black text-[10px] border border-emerald-500/30">
                              ⭐ Fluency: {msg.fluencyScore}/100
                            </span>
                            <span className="text-slate-400 text-[10px]">
                              {msg.fluencyScore >= 92 ? "Native Flow" : "Conversational"}
                            </span>
                          </div>
                        )}
                        <p className="text-amber-300 font-semibold leading-relaxed">
                          💡 {msg.tip}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Primary Voice Recording & Response Controls */}
            <div className="pt-3 border-t border-slate-800 flex flex-col gap-2.5">
              
              {/* Primary Voice Microphone Big CTA */}
              <div className="flex items-center justify-center">
                <button
                  type="button"
                  onClick={toggleSpeechRecognition}
                  className={`w-full sm:w-auto px-6 py-3.5 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2.5 transition-all shadow-xl cursor-pointer active:scale-95 ${
                    isListening
                      ? "bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/40 animate-pulse"
                      : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-600/30"
                  }`}
                >
                  <span className="text-lg">{isListening ? "⏹️" : "🎙️"}</span>
                  <span>
                    {isListening
                      ? "Stop & Send Spoken Response"
                      : "Tap to Speak (تحدث بالمايك)"}
                  </span>
                </button>
              </div>

              {/* Text Input Fallback Bar */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendUserResponse();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder="Or review/type your English sentence here..."
                  className="flex-1 h-11 rounded-2xl bg-[#070D1B] border border-slate-700 px-4 text-xs text-white focus:outline-none focus:border-blue-500 transition-colors placeholder:text-slate-500"
                />
                <button
                  type="submit"
                  disabled={!userInput.trim()}
                  className="px-4 h-11 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold disabled:opacity-40 transition-all shrink-0 cursor-pointer"
                >
                  Send →
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
