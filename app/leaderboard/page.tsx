"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "../../components/Header";
import PageTransition from "../../components/PageTransition";
import Penguin3D from "../../components/Penguin3D";
import BrandWatermark from "../../components/BrandWatermark";
import { getUser, getToken } from "../../lib/auth";
import { getLeaderboard } from "../../services/api";
import { User, LeaderboardData, LeaderboardUser } from "../../types";

type TabType = "speakers" | "streaks" | "loved" | "tribes";

export default function LeaderboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("speakers");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const u = getUser();
    const token = getToken();
    if (!u || !token) {
      router.push("/login");
      return;
    }
    setUser(u);

    getLeaderboard(token)
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [router]);

  const topSpeakers = data?.topSpeakers || [];
  const topStreaks = data?.topStreaks || [];
  const topLoved = data?.topLoved || [];
  const tribeRankings = data?.tribeRankings || [];
  const myRank = data?.myRank || 1;

  const currentList: LeaderboardUser[] =
    activeTab === "speakers" ? topSpeakers : activeTab === "streaks" ? topStreaks : topLoved;

  const topThree = currentList.slice(0, 3);
  const remainingList = currentList.slice(3);

  return (
    <main className="min-h-screen flex flex-col pb-24 md:pb-16 relative overflow-hidden">
      <BrandWatermark opacity={0.04} size="xl" />
      <Header />

      <PageTransition>
        <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8">
          
          {/* Header Hero Banner */}
          <div className="bg-gradient-to-br from-[#071426] via-[#0B1F3A] to-[#13325B] text-white rounded-3xl p-6 sm:p-10 shadow-2xl border border-white/10 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="absolute top-0 right-0 w-80 h-80 bg-gold/15 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col gap-2 text-center md:text-left max-w-xl">
              <span className="inline-flex items-center gap-1.5 bg-gold/20 text-[#F5A623] border border-gold/35 text-xs font-bold px-3.5 py-1 rounded-full w-max mx-auto md:mx-0">
                🏆 Global & Tribe Champions
              </span>
              <h1 className="text-2xl sm:text-4xl font-black leading-tight tracking-tight">
                Speaking Leaderboard
              </h1>
              <p className="text-xs sm:text-sm text-white/70 leading-relaxed">
                Celebrate the most dedicated English speakers and top-performing Tribes from around the world!
              </p>
            </div>

            {/* My Live Rank Badge */}
            <div className="relative z-10 bg-white/10 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-white/15 flex items-center gap-4 flex-shrink-0">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 text-ink font-black text-2xl flex items-center justify-center shadow-lg shadow-amber-400/30">
                #{myRank}
              </div>
              <div className="text-left">
                <p className="text-xs text-white/70">My Global Rank</p>
                <p className="text-sm font-extrabold text-amber-300">
                  {user?.name || (user?.email ? user.email.split("@")[0] : "Learner")}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center justify-center gap-2 bg-white p-1.5 rounded-2xl border border-border/60 shadow-sm max-w-2xl mx-auto w-full overflow-x-auto">
            <button
              onClick={() => setActiveTab("speakers")}
              className={`flex-1 min-w-[120px] py-2.5 px-3 rounded-xl text-xs font-extrabold transition-all ${
                activeTab === "speakers"
                  ? "bg-primary text-white shadow-md shadow-primary/30"
                  : "text-ink-soft hover:text-ink hover:bg-surface"
              }`}
            >
              ⏱️ Minutes Spoken
            </button>
            <button
              onClick={() => setActiveTab("streaks")}
              className={`flex-1 min-w-[120px] py-2.5 px-3 rounded-xl text-xs font-extrabold transition-all ${
                activeTab === "streaks"
                  ? "bg-primary text-white shadow-md shadow-primary/30"
                  : "text-ink-soft hover:text-ink hover:bg-surface"
              }`}
            >
              🔥 Streak Champions
            </button>
            <button
              onClick={() => setActiveTab("loved")}
              className={`flex-1 min-w-[120px] py-2.5 px-3 rounded-xl text-xs font-extrabold transition-all ${
                activeTab === "loved"
                  ? "bg-primary text-white shadow-md shadow-primary/30"
                  : "text-ink-soft hover:text-ink hover:bg-surface"
              }`}
            >
              ❤️ Most Loved
            </button>
            <button
              onClick={() => setActiveTab("tribes")}
              className={`flex-1 min-w-[120px] py-2.5 px-3 rounded-xl text-xs font-extrabold transition-all ${
                activeTab === "tribes"
                  ? "bg-primary text-white shadow-md shadow-primary/30"
                  : "text-ink-soft hover:text-ink hover:bg-surface"
              }`}
            >
              🏛️ Tribe 12 Rankings
            </button>
          </div>

          {/* Tab Content 1: User Podiums & List (Speakers, Streaks, Loved) */}
          {activeTab !== "tribes" && (
            <div className="space-y-6">
              
              {/* Top 3 3D Podium Display */}
              {topThree.length >= 3 && (
                <div className="grid grid-cols-3 gap-2 sm:gap-4 items-end max-w-2xl mx-auto pt-6 pb-2">
                  
                  {/* #2 Silver */}
                  <div className="flex flex-col items-center gap-2">
                    <div className="relative">
                      <div className="w-14 h-14 sm:w-18 sm:h-18 rounded-2xl bg-slate-100 border-2 border-slate-300 text-ink font-bold text-lg flex items-center justify-center shadow-md overflow-hidden">
                        {topThree[1].avatarUrl ? (
                          <img src={topThree[1].avatarUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span>🥈</span>
                        )}
                      </div>
                      <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-slate-400 text-white font-black text-[10px] px-2 py-0.2 rounded-full shadow-xs">
                        #2
                      </span>
                    </div>
                    <p className="text-xs font-bold text-ink truncate max-w-[90px] text-center mt-1">
                      {topThree[1].name}
                    </p>
                    <p className="text-[11px] font-extrabold text-primary">
                      {activeTab === "speakers"
                        ? `${topThree[1].totalMinutes}m`
                        : activeTab === "streaks"
                        ? `${topThree[1].streakDays}d 🔥`
                        : `${topThree[1].lovedCount} ❤️`}
                    </p>
                    <div className="w-full h-20 bg-gradient-to-t from-slate-200 to-slate-100 rounded-t-2xl border-t-2 border-slate-300 flex items-center justify-center font-black text-slate-500 text-xl">
                      2
                    </div>
                  </div>

                  {/* #1 Gold (Highest Podium) */}
                  <div className="flex flex-col items-center gap-2">
                    <div className="relative">
                      <div className="w-18 h-18 sm:w-22 sm:h-22 rounded-3xl bg-amber-50 border-3 border-amber-400 text-ink font-bold text-2xl flex items-center justify-center shadow-xl shadow-amber-400/20 overflow-hidden ring-4 ring-amber-400/30">
                        {topThree[0].avatarUrl ? (
                          <img src={topThree[0].avatarUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span>👑</span>
                        )}
                      </div>
                      <span className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 bg-amber-400 text-ink font-black text-xs px-2.5 py-0.5 rounded-full shadow-md">
                        #1 GOLD
                      </span>
                    </div>
                    <p className="text-sm font-extrabold text-ink truncate max-w-[110px] text-center mt-2">
                      {topThree[0].name}
                    </p>
                    <p className="text-xs font-black text-amber-600">
                      {activeTab === "speakers"
                        ? `${topThree[0].totalMinutes} Mins`
                        : activeTab === "streaks"
                        ? `${topThree[0].streakDays} Days 🔥`
                        : `${topThree[0].lovedCount} Praises ❤️`}
                    </p>
                    <div className="w-full h-32 bg-gradient-to-t from-amber-300/40 via-amber-200/50 to-amber-100 rounded-t-2xl border-t-3 border-amber-400 flex items-center justify-center font-black text-amber-600 text-2xl shadow-inner">
                      🥇 1
                    </div>
                  </div>

                  {/* #3 Bronze */}
                  <div className="flex flex-col items-center gap-2">
                    <div className="relative">
                      <div className="w-14 h-14 sm:w-18 sm:h-18 rounded-2xl bg-amber-50 border-2 border-amber-600/40 text-ink font-bold text-lg flex items-center justify-center shadow-md overflow-hidden">
                        {topThree[2].avatarUrl ? (
                          <img src={topThree[2].avatarUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span>🥉</span>
                        )}
                      </div>
                      <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-amber-700 text-white font-black text-[10px] px-2 py-0.2 rounded-full shadow-xs">
                        #3
                      </span>
                    </div>
                    <p className="text-xs font-bold text-ink truncate max-w-[90px] text-center mt-1">
                      {topThree[2].name}
                    </p>
                    <p className="text-[11px] font-extrabold text-primary">
                      {activeTab === "speakers"
                        ? `${topThree[2].totalMinutes}m`
                        : activeTab === "streaks"
                        ? `${topThree[2].streakDays}d 🔥`
                        : `${topThree[2].lovedCount} ❤️`}
                    </p>
                    <div className="w-full h-16 bg-gradient-to-t from-amber-200/40 to-amber-100/30 rounded-t-2xl border-t-2 border-amber-600/40 flex items-center justify-center font-black text-amber-800 text-lg">
                      3
                    </div>
                  </div>

                </div>
              )}

              {/* Remaining Users Table */}
              <div className="bg-white rounded-3xl p-6 shadow-xl shadow-primary/5 border border-border/60">
                <h3 className="text-sm font-bold text-ink mb-4">All Global Learners</h3>
                <div className="divide-y divide-border/50">
                  {currentList.map((learner, idx) => {
                    const isMe = learner.id === user?.id;
                    return (
                      <div
                        key={learner.id}
                        className={`py-3.5 px-3 flex items-center justify-between gap-3 rounded-2xl transition-all ${
                          isMe ? "bg-primary-light/50 font-bold" : "hover:bg-surface"
                        }`}
                      >
                        <div className="flex items-center gap-3.5">
                          <span
                            className={`w-7 text-center font-black text-xs ${
                              idx === 0
                                ? "text-amber-500 text-sm"
                                : idx === 1
                                ? "text-slate-400"
                                : idx === 2
                                ? "text-amber-700"
                                : "text-ink-soft"
                            }`}
                          >
                            {idx + 1}
                          </span>

                          <div className="w-10 h-10 rounded-xl bg-surface border border-border text-ink font-bold text-xs flex items-center justify-center flex-shrink-0 overflow-hidden">
                            {learner.avatarUrl ? (
                              <img src={learner.avatarUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <span>{learner.name.charAt(0).toUpperCase()}</span>
                            )}
                          </div>

                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-base">{learner.countryFlag || "🌐"}</span>
                              <p className="text-xs font-bold text-ink">{learner.name}</p>
                              {isMe && (
                                <span className="text-[10px] font-extrabold bg-primary text-white px-2 py-0.2 rounded-full">
                                  You
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-ink-soft">
                              {learner.country} • Tribe {learner.tribeId} • {learner.englishLevel}
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="text-xs font-black text-primary">
                            {activeTab === "speakers"
                              ? `${learner.totalMinutes} Mins`
                              : activeTab === "streaks"
                              ? `${learner.streakDays} Days 🔥`
                              : `${learner.lovedCount} Praises ❤️`}
                          </p>
                          <p className="text-[10px] text-ink-soft">
                            {learner.totalSessions} Sessions
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

          {/* Tab Content 2: Tribe 12 Rankings */}
          {activeTab === "tribes" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {tribeRankings.map((tr, idx) => (
                <div
                  key={tr.tribeId}
                  className={`bg-white rounded-3xl p-5 shadow-sm border-2 transition-all flex flex-col justify-between gap-3 ${
                    idx === 0
                      ? "border-amber-400 bg-gradient-to-br from-amber-50/50 to-white shadow-amber-400/10"
                      : "border-border/60 hover:border-primary/40"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-black px-2.5 py-0.5 rounded-full ${
                        idx === 0
                          ? "bg-amber-400 text-ink"
                          : idx === 1
                          ? "bg-slate-300 text-ink"
                          : idx === 2
                          ? "bg-amber-700 text-white"
                          : "bg-surface text-ink-soft"
                      }`}
                    >
                      #{idx + 1}
                    </span>
                    <span className="text-xs font-semibold text-ink-soft">
                      👥 {tr.membersCount} Members
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-extrabold text-ink">{tr.label}</h3>
                    <p className="text-xs text-primary font-bold mt-0.5">
                      {tr.totalMinutes} Total Spoken Minutes
                    </p>
                  </div>

                  <div className="pt-2 border-t border-border/50 flex items-center justify-between text-[11px] text-ink-soft">
                    <span>Routine Power</span>
                    <span className="font-bold text-ink">
                      {tr.membersCount > 0
                        ? `${Math.round(tr.totalMinutes / tr.membersCount)}m avg / member`
                        : "0m"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </PageTransition>
    </main>
  );
}
