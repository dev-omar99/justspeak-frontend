"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "../../components/Header";
import PageTransition from "../../components/PageTransition";
import Button from "../../components/Button";
import BrandWatermark from "../../components/BrandWatermark";
import { getUser, getToken, saveUser, clearAuth } from "../../lib/auth";
import {
  getDashboardData,
  updateProfile,
  getBlockedUsers,
  unblockUser,
  getBuddies,
  toggleBuddy,
  changePasswordApi,
  deleteMyAccountApi,
} from "../../services/api";
import { User, BlockedUserItem, BuddyUserItem, RecentPartner } from "../../types";

const ENGLISH_LEVELS = [
  "Beginner",
  "Elementary",
  "Intermediate",
  "Upper-Intermediate",
  "Advanced",
  "Native",
];

const COUNTRIES = [
  "Egypt",
  "Saudi Arabia",
  "UAE",
  "Kuwait",
  "Qatar",
  "Jordan",
  "Lebanon",
  "Morocco",
  "Algeria",
  "Tunisia",
  "USA",
  "UK",
  "Canada",
  "Australia",
  "Germany",
  "France",
  "Spain",
  "Italy",
  "Turkey",
  "Brazil",
  "India",
  "Pakistan",
  "Indonesia",
  "Japan",
  "Korea",
  "Mexico",
  "Colombia",
];

const PRESET_AVATARS = [
  { label: "Eagle Crest", emoji: "🦅" },
  { label: "Astronaut", emoji: "🚀" },
  { label: "Explorer", emoji: "🌍" },
  { label: "Scholar", emoji: "🦉" },
  { label: "Lion", emoji: "🦁" },
  { label: "Techie", emoji: "🤖" },
  { label: "Coffee", emoji: "☕" },
  { label: "Artist", emoji: "🎨" },
];

type ActiveDrawer =
  | null
  | "settings"
  | "buddies"
  | "history"
  | "match-settings"
  | "never-meet"
  | "chatbot";

export default function ProfilePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [user, setUser] = useState<User | null>(null);
  const [activeDrawer, setActiveDrawer] = useState<ActiveDrawer>(null);

  // Profile form state
  const [name, setName] = useState("");
  const [country, setCountry] = useState("");
  const [englishLevel, setEnglishLevel] = useState("Intermediate");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string>("");

  // Dashboard stats & lists
  const [stats, setStats] = useState<{
    totalSessions: number;
    totalMinutes: number;
    countriesCount: number;
    streakDays: number;
    lovedCount: number;
    blockedCount: number;
    contributionPoints?: number;
  } | null>(null);
  const [recentPartners, setRecentPartners] = useState<RecentPartner[]>([]);
  const [buddiesList, setBuddiesList] = useState<BuddyUserItem[]>([]);
  const [blockedList, setBlockedList] = useState<BlockedUserItem[]>([]);
  const [loadingBlocked, setLoadingBlocked] = useState(false);

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Account security (Change Password & Delete Account)
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordStatus, setPasswordStatus] = useState<{ type: "ok" | "err"; msg: string } | null>(null);
  const [changingPassword, setChangingPassword] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  // Sound & Match settings
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [matchSameLevel, setMatchSameLevel] = useState(false);
  const [matchGlobalPriority, setMatchGlobalPriority] = useState(true);
  const [subtitlesHelper, setSubtitlesHelper] = useState(true);

  // Chatbot state
  const [chatMessages, setChatMessages] = useState<
    { sender: "bot" | "user"; text: string }[]
  >([
    {
      sender: "bot",
      text: "Hi there! 👋 I'm the JustSpeak Assistant. Ask me about speaking tips, how tickets work, Tribe hours, or practice an icebreaker with me!",
    },
  ]);
  const [chatInput, setChatInput] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("justspeak_sound_enabled");
      if (stored !== null) {
        setSoundEnabled(stored !== "false");
      }
      const sameLvl = localStorage.getItem("justspeak_match_same_level");
      if (sameLvl !== null) setMatchSameLevel(sameLvl === "true");
    }
  }, []);

  function handleToggleSound() {
    const next = !soundEnabled;
    setSoundEnabled(next);
    if (typeof window !== "undefined") {
      localStorage.setItem("justspeak_sound_enabled", String(next));
    }
  }

  useEffect(() => {
    const currentUser = getUser();
    const token = getToken();
    if (!currentUser || !token) {
      router.push("/login");
      return;
    }
    setUser(currentUser);
    setName(currentUser.name || "");
    setCountry(currentUser.country || "");
    setEnglishLevel(currentUser.englishLevel || "Intermediate");
    setBio(currentUser.bio || "");
    setAvatarUrl(currentUser.avatarUrl || "");

    getDashboardData(token)
      .then((data) => {
        setStats({
          totalSessions: data.stats.totalSessions,
          totalMinutes: data.stats.totalMinutes,
          countriesCount: data.stats.countriesCount,
          streakDays: data.stats.streakDays,
          lovedCount: data.stats.lovedCount,
          blockedCount: data.stats.blockedCount,
          contributionPoints: data.stats.contributionPoints,
        });
        setRecentPartners(data.recentPartners || []);
        if (data.user.name) setName(data.user.name);
        if (data.user.country) setCountry(data.user.country);
        if (data.user.englishLevel) setEnglishLevel(data.user.englishLevel);
        if (data.user.bio) setBio(data.user.bio || "");
        if (data.user.avatarUrl) setAvatarUrl(data.user.avatarUrl || "");
      })
      .catch(() => {});

    getBuddies(token)
      .then((list) => setBuddiesList(list))
      .catch(() => {});

    setLoadingBlocked(true);
    getBlockedUsers(token)
      .then((list) => setBlockedList(list))
      .catch(() => {})
      .finally(() => setLoadingBlocked(false));
  }, [router]);

  // Handle Photo File Upload with Canvas Compression (200x200 JPEG)
  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("Please select an image smaller than 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const maxDim = 200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        ctx?.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
        setAvatarUrl(dataUrl);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const token = getToken();
    if (!token || !user) return;

    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const result = await updateProfile(token, {
        name: name.trim() || undefined,
        country: country || undefined,
        englishLevel,
        bio: bio.trim() || undefined,
        avatarUrl: avatarUrl || undefined,
      });

      if (result.success) {
        const updatedUser: User = {
          ...user,
          name: result.user.name,
          country: result.user.country,
          englishLevel: result.user.englishLevel,
          bio: bio.trim() || undefined,
          avatarUrl: avatarUrl || undefined,
        };
        saveUser(updatedUser);
        setUser(updatedUser);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (err: any) {
      setError(err.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  }

  async function handleUnblock(blockedId: string) {
    const token = getToken();
    if (!token) return;
    try {
      await unblockUser(token, blockedId);
      setBlockedList((prev) => prev.filter((b) => b.blockedUser.id !== blockedId));
    } catch {}
  }

  async function handleRemoveBuddy(buddyId: string) {
    const token = getToken();
    if (!token) return;
    try {
      await toggleBuddy(token, buddyId);
      setBuddiesList((prev) => prev.filter((b) => b.id !== buddyId));
    } catch {}
  }

  function handleSendChat(e: React.FormEvent) {
    e.preventDefault();
    const q = chatInput.trim();
    if (!q) return;
    setChatMessages((prev) => [...prev, { sender: "user", text: q }]);
    setChatInput("");

    const lower = q.toLowerCase();
    let reply =
      "Great question! On JustSpeak, each session lasts 7 minutes face-to-face. Remember to keep your camera on and complete the survey afterwards to earn Contribution Points!";
    if (lower.includes("ticket") || lower.includes("free")) {
      reply =
        "You receive 5 White Tickets every day at midnight for free! You can also earn Blue Bonus Tickets from events, streaks, and inviting friends.";
    } else if (lower.includes("tribe")) {
      reply =
        "Your Tribe groups you with active learners who practice at similar hours. Joining during your Tribe time gives you fast matching and bonus camaraderie!";
    } else if (lower.includes("topic") || lower.includes("practice")) {
      reply =
        "Let's practice! Here's a warm-up topic: 'Has anything made you want to work harder to earn more recently?' Tell me in 2 sentences!";
    } else if (lower.includes("prime") || lower.includes("invite")) {
      reply =
        "When 3 invited friends join their first conversation using your code, you unlock a 10-day Prime membership with unlimited tickets!";
    }

    setTimeout(() => {
      setChatMessages((prev) => [...prev, { sender: "bot", text: reply }]);
    }, 350);
  }

  function handleLogout() {
    clearAuth();
    router.push("/login");
  }

  if (!user) return null;

  const displayName =
    user.name || (user.email ? user.email.split("@")[0] : user.phone || "Learner");
  const initials = displayName.charAt(0).toUpperCase();

  return (
    <main className="min-h-screen flex flex-col pb-28 md:pb-16 relative overflow-hidden">
      <BrandWatermark opacity={0.04} size="xl" />
      <Header />

      <PageTransition>
        <div className="max-w-2xl mx-auto w-full px-4 sm:px-6 py-6 flex flex-col gap-4">
          {/* Top "My page" Header Row (Screenshot #11) */}
          <div className="flex items-center justify-between pt-1 pb-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              My page
            </h1>
            <button
              type="button"
              onClick={() => setActiveDrawer("settings")}
              aria-label="Open Profile Settings"
              className="w-10 h-10 rounded-full hover:bg-slate-200/70 flex items-center justify-center text-slate-700 transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </button>
          </div>

          {/* One clear next action */}
          <Link
            href="/queue"
            className="w-full py-3.5 rounded-2xl bg-gradient-to-br from-[#E11D48] to-[#9F0A1C] text-white font-bold text-sm text-center shadow-sm"
          >
            Start a 7-minute call
          </Link>

          {/* User Identity Row with Golden Shield Badge (Screenshot #11) */}
          <button
            type="button"
            onClick={() => setActiveDrawer("settings")}
            className="flex items-center justify-between py-2 px-1 text-left group"
          >
            <div className="flex items-center gap-3.5">
              {/* Golden Shield / Tribe Crest + Avatar */}
              <div className="relative flex items-center gap-2.5">
                <div className="w-8 h-9 rounded-lg bg-gradient-to-b from-amber-300 via-amber-400 to-amber-600 p-0.5 shadow-sm flex items-center justify-center">
                  <div className="w-full h-full bg-[#1E293B] rounded-[6px] flex flex-col items-center justify-center text-amber-300">
                    <span className="text-xs leading-none">☀️</span>
                  </div>
                </div>

                {avatarUrl ? (
                  <div className="w-11 h-11 rounded-full bg-blue-600 text-white font-bold text-base flex items-center justify-center overflow-hidden border-2 border-white shadow-sm">
                    {avatarUrl.startsWith("data:") || avatarUrl.startsWith("http") ? (
                      <img loading="lazy" decoding="async"
                        src={avatarUrl}
                        alt={displayName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-xl">{avatarUrl}</span>
                    )}
                  </div>
                ) : null}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span
                    className="text-xl font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors"
                    dir="auto"
                  >
                    {displayName}
                  </span>
                  {user.isAdmin && (
                    <span className="text-[10px] font-extrabold uppercase tracking-wide text-amber-700 bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-full">
                      Admin
                    </span>
                  )}
                </div>
                {user.email && (
                  <p className="text-xs text-slate-600 font-medium" dir="ltr">
                    {user.email}
                  </p>
                )}
                <p className="text-xs text-slate-500">
                  {country ? `📍 ${country} • ` : ""}
                  {englishLevel}
                </p>
              </div>
            </div>

            <span className="text-xs font-bold text-blue-600 group-hover:underline">
              Edit profile ›
            </span>
          </button>

          {/* Card 1: My Buddies (Screenshot #11) */}
          <button
            type="button"
            onClick={() => setActiveDrawer("buddies")}
            className="w-full bg-white hover:bg-slate-50/80 rounded-2xl px-5 py-4 shadow-sm border border-slate-100 flex items-center justify-between transition-all"
          >
            <div className="flex items-center gap-3.5">
              <span className="text-blue-600">
                <svg
                  className="w-6 h-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
                </svg>
              </span>
              <span className="text-[15px] font-bold text-slate-900">
                My Buddies
              </span>
            </div>
            <div className="flex items-center gap-2">
              {buddiesList.length > 0 && (
                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full">
                  {buddiesList.length}
                </span>
              )}
              <span className="text-slate-400 text-lg font-bold">›</span>
            </div>
          </button>

          {/* Card 2: Dark-Navy "Invite and get a 10-day Prime membership!" Banner (Screenshot #11) */}
          <Link
            href="/invite"
            className="w-full bg-gradient-to-r from-[#1E2548] via-[#232D5A] to-[#2B376E] hover:brightness-110 text-white rounded-2xl px-5 py-4 shadow-md flex items-center justify-between gap-4 transition-all relative overflow-hidden"
          >
            <div className="flex items-center gap-4">
              {/* 3D Golden Gift Box Illustration */}
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-300 via-amber-400 to-amber-600 flex items-center justify-center shadow-md flex-shrink-0 relative">
                <span className="text-2xl select-none">🎁</span>
                <span className="absolute -top-1 -right-1 text-xs">✨</span>
              </div>
              <div className="text-left" dir="ltr">
                <p className="text-xs text-slate-200 font-medium">
                  Invite and get
                </p>
                <p className="text-[15px] font-extrabold text-amber-300 leading-snug">
                  a 10-day Prime membership!
                </p>
              </div>
            </div>
            <span className="text-white/80 text-xl font-bold">›</span>
          </Link>

          {/* Menu Cards Stack (Screenshot #11) */}
          <div className="flex flex-col gap-3">
            {/* Match history */}
            <button
              type="button"
              onClick={() => setActiveDrawer("history")}
              className="w-full bg-white hover:bg-slate-50/80 rounded-2xl px-5 py-4 shadow-sm border border-slate-100 flex items-center justify-between transition-all"
            >
              <div className="flex items-center gap-3.5">
                <span className="text-blue-600">
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.2}
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </span>
                <span className="text-[15px] font-bold text-slate-900">
                  Match history
                </span>
              </div>
              <div className="flex items-center gap-2">
                {recentPartners.length > 0 && (
                  <span className="text-xs font-semibold text-slate-400">
                    {recentPartners.length}
                  </span>
                )}
                <span className="text-slate-400 text-lg font-bold">›</span>
              </div>
            </button>

            {/* My memos */}
            <Link
              href="/memos?tab=memos"
              className="w-full bg-white hover:bg-slate-50/80 rounded-2xl px-5 py-4 shadow-sm border border-slate-100 flex items-center justify-between transition-all"
            >
              <div className="flex items-center gap-3.5">
                <span className="text-blue-600">
                  <svg
                    className="w-6 h-6"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
                  </svg>
                </span>
                <span className="text-[15px] font-bold text-slate-900">
                  My memos
                </span>
              </div>
              <span className="text-slate-400 text-lg font-bold">›</span>
            </Link>

            {/* Match settings */}
            <button
              type="button"
              onClick={() => setActiveDrawer("match-settings")}
              className="w-full bg-white hover:bg-slate-50/80 rounded-2xl px-5 py-4 shadow-sm border border-slate-100 flex items-center justify-between transition-all"
            >
              <div className="flex items-center gap-3.5">
                <span className="text-blue-600">
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.2}
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                    />
                  </svg>
                </span>
                <span className="text-[15px] font-bold text-slate-900">
                  Match settings
                </span>
              </div>
              <span className="text-slate-400 text-lg font-bold">›</span>
            </button>

            {/* Never meet again */}
            <button
              type="button"
              onClick={() => setActiveDrawer("never-meet")}
              className="w-full bg-white hover:bg-slate-50/80 rounded-2xl px-5 py-4 shadow-sm border border-slate-100 flex items-center justify-between transition-all"
            >
              <div className="flex items-center gap-3.5">
                <span className="text-blue-600">
                  <svg
                    className="w-6 h-6"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11H7v-2h10v2z" />
                  </svg>
                </span>
                <span className="text-[15px] font-bold text-slate-900">
                  Never meet again
                </span>
              </div>
              <div className="flex items-center gap-2">
                {blockedList.length > 0 && (
                  <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                    {blockedList.length}
                  </span>
                )}
                <span className="text-slate-400 text-lg font-bold">›</span>
              </div>
            </button>

            {/* JustSpeak Chatbot */}
            <button
              type="button"
              onClick={() => setActiveDrawer("chatbot")}
              className="w-full bg-white hover:bg-slate-50/80 rounded-2xl px-5 py-4 shadow-sm border border-slate-100 flex items-center justify-between transition-all"
            >
              <div className="flex items-center gap-3.5">
                <span className="text-blue-600">
                  <svg
                    className="w-6 h-6"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2a2 2 0 012 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 017 7h1a1 1 0 011 1v3a1 1 0 01-1 1h-1v1a2 2 0 01-2 2H5a2 2 0 01-2-2v-1H2a1 1 0 01-1-1v-3a1 1 0 011-1h1a7 7 0 017-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 012-2zm-3 10a1.5 1.5 0 100 3 1.5 1.5 0 000-3zm6 0a1.5 1.5 0 100 3 1.5 1.5 0 000-3z" />
                  </svg>
                </span>
                <span className="text-[15px] font-bold text-slate-900">
                  JustSpeak Chatbot
                </span>
              </div>
              <span className="text-slate-400 text-lg font-bold">›</span>
            </button>

            {/* Admin dashboard — only rendered for admin accounts.
                Server-side AdminGuard + ADMIN_EMAIL policy still enforce access. */}
            {user.isAdmin && (
              <Link
                href="/admin"
                className="w-full bg-gradient-to-r from-[#1E2548] via-[#232D5A] to-[#2B376E] hover:brightness-110 text-white rounded-2xl px-5 py-4 shadow-md flex items-center justify-between transition-all"
              >
                <div className="flex items-center gap-3.5">
                  <span className="w-10 h-10 rounded-xl bg-amber-400/20 flex items-center justify-center text-amber-300">
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 17v-2a4 4 0 00-4-4H3m9 6a9 9 0 019-9m-9 9a9 9 0 00-9-9m9 9v-4m0-4a4 4 0 014-4h2"
                      />
                    </svg>
                  </span>
                  <div className="text-left">
                    <p className="text-[15px] font-extrabold">Admin dashboard</p>
                    <p className="text-xs text-slate-300">
                      Users, stats and subscriptions
                    </p>
                  </div>
                </div>
                <span className="text-white/80 text-lg font-bold">›</span>
              </Link>
            )}
          </div>

          {/* Quick Summary Footer Card */}
          <div className="mt-2 bg-white rounded-2xl p-4 border border-slate-100 shadow-xs flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-4">
              <span>
                Compliments:{" "}
                <strong className="text-slate-800">
                  {stats?.lovedCount || 0} ❤️
                </strong>
              </span>
              <span>
                Sessions:{" "}
                <strong className="text-slate-800">
                  {stats?.totalSessions || 0}
                </strong>
              </span>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-rose-200 bg-rose-50 text-xs font-extrabold text-rose-600 hover:bg-rose-100 hover:border-rose-300 transition-all active:scale-95"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Log out
            </button>
          </div>
        </div>
      </PageTransition>

      {/* ===================================================================== */}
      {/* DRAWER 1: Profile & Account Settings (⚙️ Icon)                        */}
      {/* ===================================================================== */}
      {activeDrawer === "settings" && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 my-auto max-h-[90vh] overflow-y-auto flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">
                  Personal Profile & Settings
                </h2>
                <p className="text-xs text-slate-500">
                  Update how speaking partners see you
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveDrawer(null)}
                className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="flex flex-col gap-5">
              {/* Avatar Selection & Upload */}
              <div className="flex flex-col gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200/70">
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center justify-between">
                  <span>Profile Picture / Avatar</span>
                  {avatarUrl && (
                    <button
                      type="button"
                      onClick={() => setAvatarUrl("")}
                      className="text-[11px] text-rose-600 hover:underline font-semibold"
                    >
                      Remove Photo
                    </button>
                  )}
                </label>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-bold text-2xl flex items-center justify-center shadow-md overflow-hidden border border-slate-200 flex-shrink-0">
                    {avatarUrl ? (
                      avatarUrl.startsWith("data:") ||
                      avatarUrl.startsWith("http") ? (
                        <img loading="lazy" decoding="async"
                          src={avatarUrl}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-3xl select-none">{avatarUrl}</span>
                      )
                    ) : (
                      <span>{initials}</span>
                    )}
                  </div>

                  <div className="flex-1 flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageUpload}
                        accept="image/*"
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-xs font-bold text-slate-800 bg-white hover:bg-slate-100 border border-slate-200 px-3.5 py-2 rounded-xl shadow-xs transition-all flex items-center gap-1.5"
                      >
                        <span>📷</span>
                        <span>Upload Custom Photo</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5 pt-1 flex-wrap">
                      <span className="text-[10px] text-slate-500 font-semibold">
                        Or pick:
                      </span>
                      {PRESET_AVATARS.map((av) => (
                        <button
                          key={av.label}
                          type="button"
                          onClick={() => setAvatarUrl(av.emoji)}
                          className={`w-8 h-8 rounded-xl flex items-center justify-center text-base border transition-all ${
                            avatarUrl === av.emoji
                              ? "bg-blue-50 border-blue-600 scale-110 shadow-xs"
                              : "bg-white border-slate-200 hover:bg-slate-100"
                          }`}
                          title={av.label}
                        >
                          {av.emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Display Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Display Name
                </label>
                <input
                  type="text"
                  dir="auto"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name or nickname..."
                  maxLength={60}
                  className="w-full border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600"
                />
              </div>

              {/* Country */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Your Country
                </label>
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 cursor-pointer"
                >
                  <option value="">— Select your country —</option>
                  {COUNTRIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* English Level */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  English Speaking Level
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {ENGLISH_LEVELS.map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setEnglishLevel(lvl)}
                      className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all ${
                        englishLevel === lvl
                          ? "border-blue-600 bg-blue-50 text-blue-600"
                          : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              {/* Short Bio */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center justify-between">
                  <span>Short Bio & Interests</span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    {bio.length}/300
                  </span>
                </label>
                <textarea
                  dir="auto"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell partners about your hobbies, work, or goals..."
                  maxLength={300}
                  rows={3}
                  className="w-full border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 resize-none"
                />
              </div>

              {error && (
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-center">
                  <p className="text-rose-600 text-xs font-medium">{error}</p>
                </div>
              )}

              {success && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center">
                  <p className="text-emerald-700 text-xs font-semibold">
                    ✓ Profile saved successfully!
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex items-center gap-1.5 px-4 py-3 rounded-xl border border-rose-200 bg-rose-50 text-xs font-extrabold text-rose-600 hover:bg-rose-100 hover:border-rose-300 transition-all active:scale-95"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
                  Log Out
                </button>
                <Button type="submit" variant="primary" disabled={saving}>
                  {saving ? "Saving..." : "💾 Save Changes"}
                </Button>
              </div>
            </form>

            {/* Change Password Section */}
            <div className="border-t border-slate-200 pt-5 flex flex-col gap-3">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
                🔒 Change Password
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Current password"
                  className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-600"
                />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="New password (min 8 chars)"
                  minLength={8}
                  className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>
              {passwordStatus && (
                <p
                  className={`text-xs font-semibold ${
                    passwordStatus.type === "ok" ? "text-emerald-700" : "text-rose-600"
                  }`}
                >
                  {passwordStatus.msg}
                </p>
              )}
              <button
                type="button"
                disabled={changingPassword || !currentPassword || newPassword.length < 8}
                onClick={async () => {
                  const token = getToken();
                  if (!token) return;
                  setChangingPassword(true);
                  setPasswordStatus(null);
                  try {
                    await changePasswordApi(token, currentPassword, newPassword);
                    setCurrentPassword("");
                    setNewPassword("");
                    setPasswordStatus({ type: "ok", msg: "✓ Password updated successfully." });
                  } catch (err: any) {
                    setPasswordStatus({
                      type: "err",
                      msg: err?.message || "Failed to update password.",
                    });
                  } finally {
                    setChangingPassword(false);
                  }
                }}
                className="self-start px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold disabled:opacity-40 transition-colors cursor-pointer"
              >
                {changingPassword ? "Updating..." : "Update Password"}
              </button>
            </div>

            {/* Danger Zone: Delete Account */}
            <div className="border-t border-rose-100 pt-5 flex flex-col gap-2.5">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-rose-700">
                ⚠️ Danger Zone
              </h3>
              {!confirmDelete ? (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="self-start px-4 py-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold transition-colors cursor-pointer"
                >
                  Delete My Account
                </button>
              ) : (
                <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3.5 flex flex-col gap-2.5">
                  <p className="text-xs text-rose-800 font-semibold">
                    Are you sure? This permanently deletes your account, buddies, and progress.
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={deletingAccount}
                      onClick={async () => {
                        const token = getToken();
                        if (!token) return;
                        setDeletingAccount(true);
                        try {
                          await deleteMyAccountApi(token);
                          clearAuth();
                          router.push("/");
                        } catch (err: any) {
                          setError(err?.message || "Failed to delete account.");
                          setDeletingAccount(false);
                          setConfirmDelete(false);
                        }
                      }}
                      className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer disabled:opacity-50"
                    >
                      {deletingAccount ? "Deleting..." : "Yes, Delete Permanently"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(false)}
                      className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* DRAWER 2: My Buddies                                                  */}
      {/* ===================================================================== */}
      {activeDrawer === "buddies" && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 flex flex-col gap-4 max-h-[85vh]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">👥</span>
                <h2 className="text-lg font-extrabold text-slate-900">
                  My Buddies ({buddiesList.length})
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setActiveDrawer(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-slate-500">
              Learners you connected with as speaking buddies.
            </p>
            {buddiesList.length > 0 ? (
              <div className="divide-y divide-slate-100 overflow-y-auto pr-1">
                {buddiesList.map((item) => (
                  <div
                    key={item.id}
                    className="py-3 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{item.countryFlag || "🌐"}</span>
                      <div>
                        <p className="text-sm font-bold text-slate-900">
                          {item.name}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {item.country || "Global"} •{" "}
                          {item.englishLevel || "Intermediate"}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveBuddy(item.id)}
                      className="text-xs font-semibold text-rose-500 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-10 text-center flex flex-col items-center gap-2">
                <span className="text-3xl">🤝</span>
                <p className="text-sm font-bold text-slate-800">
                  No buddies added yet
                </p>
                <p className="text-xs text-slate-500 max-w-xs">
                  When both you and your partner select &quot;I&apos;d love to
                  talk again!&quot; after a session, you can connect as buddies.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* DRAWER 3: Match History                                               */}
      {/* ===================================================================== */}
      {activeDrawer === "history" && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 flex flex-col gap-4 max-h-[85vh]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">🕒</span>
                <h2 className="text-lg font-extrabold text-slate-900">
                  Match history
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setActiveDrawer(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>
            {recentPartners.length > 0 ? (
              <div className="divide-y divide-slate-100 overflow-y-auto pr-1">
                {recentPartners.map((p) => (
                  <div
                    key={p.id}
                    className="py-3 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{p.countryFlag || "🌐"}</span>
                      <div>
                        <p className="text-sm font-bold text-slate-900">
                          {p.name}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Met {p.sessionCount}{" "}
                          {p.sessionCount === 1 ? "time" : "times"} •{" "}
                          {new Date(p.lastMetDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Link
                      href="/memos?tab=memos"
                      className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-xl"
                    >
                      📄+ Memo
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-10 text-center text-xs text-slate-500">
                No past conversations yet. Join your next room to start speaking!
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* DRAWER 4: Match Settings                                              */}
      {/* ===================================================================== */}
      {activeDrawer === "match-settings" && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-extrabold text-slate-900">
                Match settings
              </h2>
              <button
                type="button"
                onClick={() => setActiveDrawer(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                <div>
                  <p className="text-sm font-bold text-slate-900">
                    Prioritize different countries
                  </p>
                  <p className="text-xs text-slate-500">
                    Match with international speakers first
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setMatchGlobalPriority(!matchGlobalPriority)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold ${
                    matchGlobalPriority
                      ? "bg-blue-600 text-white"
                      : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {matchGlobalPriority ? "On" : "Off"}
                </button>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                <div>
                  <p className="text-sm font-bold text-slate-900">
                    Similar fluency level
                  </p>
                  <p className="text-xs text-slate-500">
                    Prefer partners near {englishLevel}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const next = !matchSameLevel;
                    setMatchSameLevel(next);
                    if (typeof window !== "undefined") {
                      localStorage.setItem(
                        "justspeak_match_same_level",
                        String(next)
                      );
                    }
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold ${
                    matchSameLevel
                      ? "bg-blue-600 text-white"
                      : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {matchSameLevel ? "On" : "Off"}
                </button>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                <div>
                  <p className="text-sm font-bold text-slate-900">
                    Audio & Call Sound FX
                  </p>
                  <p className="text-xs text-slate-500">
                    Chimes when a partner joins or timer ends
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleToggleSound}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold ${
                    soundEnabled
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {soundEnabled ? "🔊 On" : "🔇 Muted"}
                </button>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                <div>
                  <p className="text-sm font-bold text-slate-900">
                    Topic prompt helper
                  </p>
                  <p className="text-xs text-slate-500">
                    Show illustrated topic cards during calls
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSubtitlesHelper(!subtitlesHelper)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold ${
                    subtitlesHelper
                      ? "bg-blue-600 text-white"
                      : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {subtitlesHelper ? "On" : "Off"}
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setActiveDrawer(null)}
              className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* DRAWER 5: Never Meet Again                                            */}
      {/* ===================================================================== */}
      {activeDrawer === "never-meet" && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 flex flex-col gap-4 max-h-[85vh]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">⛔</span>
                <h2 className="text-lg font-extrabold text-slate-900">
                  Never meet again ({blockedList.length})
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setActiveDrawer(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-slate-500">
              Users on this list will never be paired with you in future
              conversation queues.
            </p>
            {loadingBlocked ? (
              <div className="py-8 text-center text-xs text-slate-400">
                Loading list...
              </div>
            ) : blockedList.length > 0 ? (
              <div className="divide-y divide-slate-100 overflow-y-auto pr-1">
                {blockedList.map((item) => (
                  <div
                    key={item.id}
                    className="py-3 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-base">{item.blockedUser.flag}</span>
                      <div>
                        <p className="font-bold text-slate-900">
                          {item.blockedUser.name}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          Added {new Date(item.blockedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleUnblock(item.blockedUser.id)}
                      className="text-xs font-bold text-blue-600 hover:underline"
                    >
                      Unblock
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-slate-500">
                You haven&apos;t added anyone to Never meet again.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* DRAWER 6: JustSpeak Chatbot                                           */}
      {/* ===================================================================== */}
      {activeDrawer === "chatbot" && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 flex flex-col gap-4 h-[500px] max-h-[85vh]">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-blue-600 text-white flex items-center justify-center text-lg">
                  🤖
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-slate-900">
                    JustSpeak Chatbot
                  </h2>
                  <p className="text-[11px] text-emerald-600 font-semibold">
                    ● Online • English Coach & Support
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveDrawer(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {chatMessages.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex ${
                    m.sender === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[82%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                      m.sender === "user"
                        ? "bg-blue-600 text-white rounded-br-xs"
                        : "bg-slate-100 text-slate-800 rounded-bl-xs"
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={handleSendChat} className="flex items-center gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask about tickets, tribes, or practice..."
                className="flex-1 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs text-slate-900 bg-slate-50 focus:outline-none focus:border-blue-600"
              />
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2.5 rounded-2xl transition-colors"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
                }
