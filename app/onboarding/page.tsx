"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "../../components/Header";
import PageTransition from "../../components/PageTransition";
import Button from "../../components/Button";
import Penguin3D from "../../components/Penguin3D";
import { getUser, getToken, saveUser } from "../../lib/auth";
import { updateProfile, joinTribe } from "../../services/api";
import { User } from "../../types";

const GOAL_OPTIONS = [
  { id: "career", icon: "💼", title: "Career & Interviews", desc: "Speak professionally and ace international job interviews" },
  { id: "fluency", icon: "🗣️", title: "Daily Fluency & Confidence", desc: "Overcome fear of speaking and talk naturally without hesitation" },
  { id: "travel", icon: "✈️", title: "Travel & Relocation", desc: "Communicate smoothly while traveling or moving to an English-speaking country" },
  { id: "exams", icon: "🎓", title: "IELTS, TOEFL & Academic", desc: "Prepare for speaking exams and academic presentations" },
  { id: "friends", icon: "🌍", title: "Global Friendships", desc: "Meet interesting learners from around the world and share cultures" },
];

const LEVEL_OPTIONS = [
  {
    id: "Beginner",
    label: "Beginner / Elementary",
    badge: "Level A1 - A2",
    desc: "I know basic vocabulary and grammar, but I need time to form sentences and often feel shy.",
    icon: "🌱",
  },
  {
    id: "Intermediate",
    label: "Intermediate",
    badge: "Level B1 - B2",
    desc: "I can hold everyday conversations comfortably, but want to speak more smoothly and expand my vocabulary.",
    icon: "🌿",
  },
  {
    id: "Advanced",
    label: "Advanced / Fluent",
    badge: "Level C1 - C2",
    desc: "I speak fluent English with ease and enjoy deep discussions, debate, and nuanced topics.",
    icon: "🌳",
  },
];

const TRIBES = [
  { id: 1, label: "Tribe 1", time: "03:00 AM Cairo / Riyadh" },
  { id: 2, label: "Tribe 2", time: "05:00 AM Cairo / Riyadh" },
  { id: 3, label: "Tribe 3", time: "07:00 AM Cairo / Riyadh" },
  { id: 4, label: "Tribe 4", time: "09:00 AM Cairo / Riyadh" },
  { id: 5, label: "Tribe 5", time: "11:00 AM Cairo / Riyadh" },
  { id: 6, label: "Tribe 6", time: "01:00 PM Cairo / Riyadh" },
  { id: 7, label: "Tribe 7", time: "03:00 PM Cairo / Riyadh" },
  { id: 8, label: "Tribe 8", time: "05:00 PM Cairo / Riyadh" },
  { id: 9, label: "Tribe 9", time: "07:00 PM Cairo / Riyadh" },
  { id: 10, label: "Tribe 10", time: "09:00 PM Cairo / Riyadh" },
  { id: 11, label: "Tribe 11", time: "11:00 PM Cairo / Riyadh" },
  { id: 12, label: "Tribe 12", time: "01:00 AM Cairo / Riyadh" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [user, setUser] = useState<User | null>(null);

  // Form State
  const [selectedGoal, setSelectedGoal] = useState("fluency");
  const [selectedLevel, setSelectedLevel] = useState("Intermediate");
  const [selectedTribe, setSelectedTribe] = useState(10); // default 9 PM
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const u = getUser();
    const token = getToken();
    if (!u || !token) {
      router.push("/login");
      return;
    }
    setUser(u);
    if (u.englishLevel) setSelectedLevel(u.englishLevel);
    if (u.tribeId) setSelectedTribe(u.tribeId);
  }, [router]);

  async function handleComplete() {
    const token = getToken();
    if (!token || !user) return;
    setLoading(true);

    try {
      // 1. Update English Level
      await updateProfile(token, {
        englishLevel: selectedLevel,
      });

      // 2. Assign Tribe Routine
      await joinTribe(token, selectedTribe);

      // 3. Update localStorage User
      const updated: User = {
        ...user,
        englishLevel: selectedLevel,
        tribeId: selectedTribe,
      };
      saveUser(updated);

      // 4. Redirect to home dashboard
      router.push("/");
    } catch {
      router.push("/");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex flex-col pb-16">
      <Header />

      <PageTransition>
        <section className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-8 max-w-2xl mx-auto w-full">
          
          {/* Top Mascot & Progress Bar */}
          <div className="w-full flex flex-col items-center gap-4 mb-6 text-center">
            <Penguin3D size="lg" withLink={false} />

            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                Welcome to JustSpeak • Step {step} of 3
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-ink tracking-tight">
                {step === 1 && "What is your main English speaking goal?"}
                {step === 2 && "How would you describe your speaking level?"}
                {step === 3 && "Pick your daily speaking routine time"}
              </h1>
            </div>

            {/* Step Progress Indicators */}
            <div className="flex items-center gap-2 w-48 mx-auto mt-1">
              <div className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${step >= 1 ? "bg-primary" : "bg-border"}`} />
              <div className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${step >= 2 ? "bg-primary" : "bg-border"}`} />
              <div className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${step >= 3 ? "bg-primary" : "bg-border"}`} />
            </div>
          </div>

          {/* Step 1: Goal Selection */}
          {step === 1 && (
            <div className="w-full bg-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-primary/5 border border-border/60 flex flex-col gap-5 animate-in fade-in zoom-in-95 duration-200">
              <div className="grid grid-cols-1 gap-2.5">
                {GOAL_OPTIONS.map((g) => {
                  const isSelected = selectedGoal === g.id;
                  return (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => setSelectedGoal(g.id)}
                      className={`p-4 rounded-2xl border-2 text-left flex items-start gap-3.5 transition-all ${
                        isSelected
                          ? "border-primary bg-primary-light/40 shadow-sm ring-2 ring-primary/20"
                          : "border-border/60 hover:border-border hover:bg-surface text-ink-soft"
                      }`}
                    >
                      <span className="text-2xl p-2 bg-white rounded-xl shadow-xs border border-border/40 flex-shrink-0">
                        {g.icon}
                      </span>
                      <div className="flex-1">
                        <h3 className="text-sm font-extrabold text-ink">{g.title}</h3>
                        <p className="text-xs text-ink-soft mt-0.5 leading-relaxed">{g.desc}</p>
                      </div>
                      <span className={`text-base font-bold ${isSelected ? "text-primary" : "text-border"}`}>
                        {isSelected ? "●" : "○"}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setStep(2)}
                  className="w-full bg-gradient-to-r from-primary via-blue-600 to-primary-dark hover:brightness-110 active:scale-[0.98] transition-all text-white font-extrabold text-center py-4 rounded-2xl text-base shadow-xl shadow-primary/30 flex items-center justify-center gap-2"
                >
                  <span>Continue</span>
                  <span>→</span>
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Level Placement Assessment */}
          {step === 2 && (
            <div className="w-full bg-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-primary/5 border border-border/60 flex flex-col gap-5 animate-in fade-in zoom-in-95 duration-200">
              <div className="grid grid-cols-1 gap-3">
                {LEVEL_OPTIONS.map((lvl) => {
                  const isSelected = selectedLevel === lvl.id;
                  return (
                    <button
                      key={lvl.id}
                      type="button"
                      onClick={() => setSelectedLevel(lvl.id)}
                      className={`p-5 rounded-2xl border-2 text-left flex items-start gap-4 transition-all ${
                        isSelected
                          ? "border-primary bg-primary-light/40 shadow-sm ring-2 ring-primary/20"
                          : "border-border/60 hover:border-border hover:bg-surface text-ink-soft"
                      }`}
                    >
                      <span className="text-3xl p-2.5 bg-white rounded-2xl shadow-xs border border-border/40 flex-shrink-0">
                        {lvl.icon}
                      </span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-extrabold text-ink">{lvl.label}</h3>
                          <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                            {lvl.badge}
                          </span>
                        </div>
                        <p className="text-xs text-ink-soft mt-1 leading-relaxed">{lvl.desc}</p>
                      </div>
                      <span className={`text-base font-bold ${isSelected ? "text-primary" : "text-border"}`}>
                        {isSelected ? "●" : "○"}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-3 pt-2">
                <Button variant="secondary" onClick={() => setStep(1)}>
                  Back
                </Button>
                <button
                  onClick={() => setStep(3)}
                  className="flex-1 bg-gradient-to-r from-primary via-blue-600 to-primary-dark hover:brightness-110 active:scale-[0.98] transition-all text-white font-extrabold text-center py-4 rounded-2xl text-base shadow-xl shadow-primary/30 flex items-center justify-center gap-2"
                >
                  <span>Continue</span>
                  <span>→</span>
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Tribe Routine & Free Passes Activation */}
          {step === 3 && (
            <div className="w-full bg-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-primary/5 border border-border/60 flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-200">
              
              {/* Daily Passes Welcome Gift Box */}
              <div className="bg-gradient-to-r from-amber-400/20 via-amber-500/10 to-amber-400/20 rounded-2xl p-4 border border-amber-300 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">🎟️</span>
                  <div>
                    <h4 className="text-sm font-extrabold text-amber-900">5 Daily Passes Unlocked!</h4>
                    <p className="text-xs text-amber-800/80">Every day you get 5 free 7-minute sessions</p>
                  </div>
                </div>
                <span className="text-xs font-black text-amber-800 bg-amber-300/60 px-3 py-1 rounded-full">
                  Ready
                </span>
              </div>

              {/* Tribe Slot Grid */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-ink uppercase tracking-wider">
                  Choose your regular daily speaking slot:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                  {TRIBES.map((tr) => {
                    const isSelected = selectedTribe === tr.id;
                    return (
                      <button
                        key={tr.id}
                        type="button"
                        onClick={() => setSelectedTribe(tr.id)}
                        className={`p-3 rounded-xl border-2 text-left flex items-center justify-between transition-all ${
                          isSelected
                            ? "border-primary bg-primary-light/40 shadow-xs font-bold"
                            : "border-border/60 hover:bg-surface text-ink-soft"
                        }`}
                      >
                        <div>
                          <span className="text-xs font-bold text-ink block">{tr.label}</span>
                          <span className="text-[11px] text-primary font-semibold">{tr.time}</span>
                        </div>
                        <span className={`text-sm ${isSelected ? "text-primary font-bold" : "text-border"}`}>
                          {isSelected ? "✓" : "+"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <Button variant="secondary" onClick={() => setStep(2)}>
                  Back
                </Button>
                <button
                  onClick={handleComplete}
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-primary via-blue-600 to-primary-dark hover:brightness-110 active:scale-[0.98] transition-all text-white font-extrabold text-center py-4 rounded-2xl text-base shadow-xl shadow-primary/30 flex items-center justify-center gap-2"
                >
                  <span>{loading ? "Setting up..." : "🚀 Let's Start Speaking!"}</span>
                </button>
              </div>
            </div>
          )}

        </section>
      </PageTransition>
    </main>
  );
}
