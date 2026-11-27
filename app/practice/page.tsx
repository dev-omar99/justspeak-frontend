"use client";

import ScrollRow from "../../components/ScrollRow";
import { useState } from "react";
import Link from "next/link";
import Header from "../../components/Header";
import PageTransition from "../../components/PageTransition";
import Button from "../../components/Button";
import BrandWatermark from "../../components/BrandWatermark";

interface PhraseItem {
  id: string;
  phrase: string;
  meaning: string;
  example: string;
  category: string;
}

const PHRASES: PhraseItem[] = [
  // 1. Starting a Thought
  {
    id: "p1",
    phrase: "To be completely honest with you...",
    meaning: "Used to express a sincere, direct opinion politely.",
    example: "To be completely honest with you, I was nervous before my first speaking session!",
    category: "Starting a Thought",
  },
  {
    id: "p2",
    phrase: "From my personal experience...",
    meaning: "Introducing a personal story or insight.",
    example: "From my personal experience, practicing every day for 7 minutes builds fluency fast.",
    category: "Starting a Thought",
  },
  {
    id: "p3",
    phrase: "As far as I'm concerned...",
    meaning: "Giving your personal perspective on a topic.",
    example: "As far as I'm concerned, traveling is the best way to open your mind.",
    category: "Starting a Thought",
  },
  // 2. Agreeing & Adding
  {
    id: "p4",
    phrase: "I couldn't agree more with that point!",
    meaning: "Expressing 100% enthusiastic agreement.",
    example: "I couldn't agree more with that point! Consistency is everything.",
    category: "Agreeing & Connecting",
  },
  {
    id: "p5",
    phrase: "Speaking of which, that reminds me of...",
    meaning: "Smoothly bridging to a related story or idea.",
    example: "Speaking of which, that reminds me of a trip I took to Rome last summer.",
    category: "Agreeing & Connecting",
  },
  {
    id: "p6",
    phrase: "That makes a lot of sense.",
    meaning: "Acknowledging that you understand and validate your partner's point.",
    example: "That makes a lot of sense, especially given your busy schedule.",
    category: "Agreeing & Connecting",
  },
  // 3. Polite Disagreement
  {
    id: "p7",
    phrase: "I see your point, however...",
    meaning: "Respectfully offering an alternative point of view.",
    example: "I see your point, however, remote work has saved me two hours of commuting every day.",
    category: "Polite Nuance",
  },
  {
    id: "p8",
    phrase: "Not necessarily, in some cases...",
    meaning: "Clarifying that things might be different under certain circumstances.",
    example: "Not necessarily, in some cases learning online is even more effective than a classroom.",
    category: "Polite Nuance",
  },
  // 4. Buying Thinking Time (Fillers)
  {
    id: "p9",
    phrase: "That's a really interesting question, let me think...",
    meaning: "Gives your brain 3-4 seconds to formulate thoughts naturally without awkward silence.",
    example: "That's a really interesting question, let me think about what inspired me to start.",
    category: "Fillers for Thinking",
  },
  {
    id: "p10",
    phrase: "How can I put this best...",
    meaning: "Polite natural phrase used while searching for the right vocabulary.",
    example: "How can I put this best... it felt like discovering a whole new world.",
    category: "Fillers for Thinking",
  },
  // 5. High-Impact Idioms
  {
    id: "p11",
    phrase: "Break the ice",
    meaning: "To make people feel more comfortable in a conversation.",
    example: "Asking about someone's favorite food is a great way to break the ice!",
    category: "Idioms & Colloquial",
  },
  {
    id: "p12",
    phrase: "Hit the nail on the head",
    meaning: "To describe exactly what is causing a situation or state the exact truth.",
    example: "You hit the nail on the head! Speaking confidence comes from daily habit.",
    category: "Idioms & Colloquial",
  },
];

const CATEGORIES = [
  "All Categories",
  "Starting a Thought",
  "Agreeing & Connecting",
  "Polite Nuance",
  "Fillers for Thinking",
  "Idioms & Colloquial",
];

export default function PracticePage() {
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [searchQuery, setSearchQuery] = useState("");
  const [playingId, setPlayingId] = useState<string | null>(null);

  const filtered = PHRASES.filter((p) => {
    const matchesCat = selectedCategory === "All Categories" || p.category === selectedCategory;
    const matchesSearch =
      p.phrase.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.meaning.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.example.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  function handleSpeak(item: PhraseItem) {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      alert("Text-to-speech is not supported on this browser.");
      return;
    }

    window.speechSynthesis.cancel();
    setPlayingId(item.id);

    const utterance = new SpeechSynthesisUtterance(item.phrase);
    utterance.lang = "en-US";
    utterance.rate = 0.9; // natural conversational pace

    utterance.onend = () => setPlayingId(null);
    utterance.onerror = () => setPlayingId(null);

    window.speechSynthesis.speak(utterance);
  }

  return (
    <main className="min-h-screen flex flex-col pb-24 md:pb-16 relative overflow-hidden">
      <BrandWatermark opacity={0.04} size="xl" />
      <Header />

      <PageTransition>
        <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8">
          
          {/* Hero Banner */}
          <div className="bg-gradient-to-br from-[#071426] via-[#0B1F3A] to-[#13325B] text-white rounded-3xl p-6 sm:p-10 shadow-2xl border border-white/10 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="absolute top-0 right-0 w-80 h-80 bg-glacier/20 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col gap-2 text-center md:text-left max-w-xl">
              <span className="inline-flex items-center gap-1.5 bg-white/10 text-[#9CCDF2] border border-white/15 text-xs font-bold px-3.5 py-1 rounded-full w-max mx-auto md:mx-0">
                🎙️ Speaking Fluency Vault
              </span>
              <h1 className="text-2xl sm:text-4xl font-black leading-tight tracking-tight">
                Conversational Connectors
              </h1>
              <p className="text-xs sm:text-sm text-white/70 leading-relaxed">
                Master natural English transition phrases and listen to native audio pronunciations to sound fluent and confident in your 7-minute sessions!
              </p>
            </div>

            <div className="relative z-10 flex flex-col gap-2 flex-shrink-0">
              <Link
                href="/queue"
                className="bg-white hover:bg-surface text-ink font-extrabold text-xs px-5 py-3 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                <span>🚀</span>
                <span>Practice in Live Call</span>
              </Link>
            </div>
          </div>

          {/* Search & Category Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search phrases, meanings, or examples..."
              className="w-full sm:max-w-md bg-white border border-border/80 text-xs text-ink rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/30 shadow-xs"
            />

            <ScrollRow>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    selectedCategory === cat
                      ? "bg-primary text-white shadow-xs"
                      : "bg-white text-ink-soft hover:text-ink border border-border/60"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </ScrollRow>
          </div>

          {/* Phrases Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((item) => {
              const isPlaying = playingId === item.id;
              return (
                <div
                  key={item.id}
                  className="shelf-card bg-white rounded-3xl p-6 shadow-xl shadow-primary/5 border border-border/60 flex flex-col justify-between gap-4 cursor-default group"
                >

                  <div className="flex flex-col gap-2">
                    <div className="flex items-start justify-between gap-3">
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-primary-light text-primary px-2.5 py-0.5 rounded-full">
                        {item.category}
                      </span>
                      
                      {/* Audio Speak Button */}
                      <button
                        onClick={() => handleSpeak(item)}
                        className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all flex items-center gap-1.5 active:scale-95 ${
                          isPlaying
                            ? "bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-500/30 ring-2 ring-emerald-300"
                            : "bg-surface hover:bg-primary hover:text-white text-ink border-border/70"
                        }`}
                        title="Listen to native audio pronunciation"
                      >
                        <span>{isPlaying ? "🔊 Playing..." : "🔊 Listen"}</span>
                      </button>
                    </div>

                    <h3 className="text-base font-extrabold text-ink mt-1 group-hover:text-primary transition-colors">
                      "{item.phrase}"
                    </h3>
                    <p className="text-xs text-ink-soft leading-relaxed">{item.meaning}</p>
                  </div>

                  {/* Example Context Box */}
                  <div className="bg-surface rounded-2xl p-3.5 border border-border/50 text-xs flex flex-col gap-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-ink-soft">
                      Real-Life Conversation Example:
                    </span>
                    <p className="text-xs font-medium text-ink italic leading-relaxed">
                      "{item.example}"
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </PageTransition>
    </main>
  );
}
