"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "../../components/Header";
import PageTransition from "../../components/PageTransition";
import Button from "../../components/Button";
import { getUser, getToken, saveUser, clearAuth } from "../../lib/auth";
import { getDashboardData, updateProfile, getBlockedUsers, unblockUser } from "../../services/api";
import { User, BlockedUserItem } from "../../types";

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

// Preset 3D/Emoji Avatars for instant choice
const PRESET_AVATARS = [
  { label: "Penguin", emoji: "🐧" },
  { label: "Astronaut", emoji: "🚀" },
  { label: "Explorer", emoji: "🌍" },
  { label: "Scholar", emoji: "🦉" },
  { label: "Lion", emoji: "🦁" },
  { label: "Techie", emoji: "🤖" },
  { label: "Coffee", emoji: "☕" },
  { label: "Artist", emoji: "🎨" },
];

export default function ProfilePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [user, setUser] = useState<User | null>(null);

  // form state
  const [name, setName] = useState("");
  const [country, setCountry] = useState("");
  const [englishLevel, setEnglishLevel] = useState("Intermediate");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string>("");

  // stats
  const [stats, setStats] = useState<{
    totalSessions: number;
    totalMinutes: number;
    countriesCount: number;
    streakDays: number;
    lovedCount: number;
    blockedCount: number;
  } | null>(null);

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Blocked users
  const [blockedList, setBlockedList] = useState<BlockedUserItem[]>([]);
  const [loadingBlocked, setLoadingBlocked] = useState(false);

  // Sound settings
  const [soundEnabled, setSoundEnabled] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("justspeak_sound_enabled");
      if (stored !== null) {
        setSoundEnabled(stored !== "false");
      }
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
        });
        if (data.user.name) setName(data.user.name);
        if (data.user.country) setCountry(data.user.country);
        if (data.user.englishLevel) setEnglishLevel(data.user.englishLevel);
        if (data.user.bio) setBio(data.user.bio || "");
        if (data.user.avatarUrl) setAvatarUrl(data.user.avatarUrl || "");
      })
      .catch(() => {});

    // Load blocked
    setLoadingBlocked(true);
    getBlockedUsers(token)
      .then((list) => setBlockedList(list))
      .catch(() => {})
      .finally(() => setLoadingBlocked(false));
  }, [router]);

  // Handle Photo File Upload with Canvas Compression
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

  function handleLogout() {
    clearAuth();
    router.push("/login");
  }

  if (!user) return null;

  const initials = (user.name || (user.email ? user.email.split("@")[0] : (user.phone || "L"))).charAt(0).toUpperCase();

  return (
    <main className="min-h-screen flex flex-col bg-surface pb-24 md:pb-16">
      <Header />

      <PageTransition>
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8">

          {/* Top Profile Hero Card */}
          <div className="bg-gradient-to-r from-ink via-[#0d223a] to-[#1e3a8a] text-white rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="absolute top-0 right-0 w-80 h-80 bg-primary/25 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex items-center gap-5">
              {/* Profile Avatar View */}
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary to-primary-dark text-white font-extrabold text-3xl flex items-center justify-center shadow-xl shadow-primary/40 flex-shrink-0 overflow-hidden border-2 border-white/20">
                {avatarUrl ? (
                  avatarUrl.startsWith("data:") || avatarUrl.startsWith("http") ? (
                    <img
                      src={avatarUrl}
                      alt={user.name || "User Avatar"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-4xl select-none">{avatarUrl}</span>
                  )
                ) : (
                  <span>{initials}</span>
                )}
              </div>

              <div className="flex flex-col gap-1 text-center sm:text-left">
                <div className="flex items-center gap-2 justify-center sm:justify-start">
                  <h1 className="text-2xl font-extrabold" dir="auto">
                    {user.name || (user.email ? user.email.split("@")[0] : (user.phone || "Learner"))}
                  </h1>
                  <span className="bg-white/10 text-white/90 text-xs font-semibold px-3 py-0.5 rounded-full border border-white/15">
                    {englishLevel}
                  </span>
                </div>
                <p className="text-xs text-white/70">{user.email || user.phone}</p>

                {user.country && (
                  <p className="text-xs text-amber-300 font-medium">📍 {user.country}</p>
                )}
              </div>
            </div>

            <div className="relative z-10 flex items-center gap-3">
              <button
                onClick={handleLogout}
                className="text-xs font-bold text-white bg-danger/80 hover:bg-danger px-4 py-2.5 rounded-xl shadow-md transition-all"
              >
                Log Out
              </button>
            </div>
          </div>

          {/* 12-Column Desktop Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

            {/* Left Area (7 Columns): Edit Profile Form */}
            <div className="lg:col-span-7 space-y-6">
              <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-primary/5 border border-border/60 flex flex-col gap-6">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">✏️</span>
                  <div>
                    <h2 className="text-lg font-bold text-ink">Personal Profile & Settings</h2>
                    <p className="text-xs text-ink-soft">Update how speaking partners see you</p>
                  </div>
                </div>

                <form onSubmit={handleSave} className="flex flex-col gap-6">
                  
                  {/* 1. Avatar Selection & Upload Section */}
                  <div className="flex flex-col gap-3 p-4 bg-surface rounded-2xl border border-border/60">
                    <label className="text-xs font-bold text-ink uppercase tracking-wider flex items-center justify-between">
                      <span>Profile Picture / Avatar</span>
                      {avatarUrl && (
                        <button
                          type="button"
                          onClick={() => setAvatarUrl("")}
                          className="text-[11px] text-danger hover:underline font-semibold"
                        >
                          Remove Photo
                        </button>
                      )}
                    </label>

                    <div className="flex flex-col sm:flex-row items-center gap-4">
                      {/* Current Preview */}
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary-dark text-white font-bold text-2xl flex items-center justify-center shadow-md overflow-hidden border border-border flex-shrink-0">
                        {avatarUrl ? (
                          avatarUrl.startsWith("data:") || avatarUrl.startsWith("http") ? (
                            <img
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

                      {/* Upload Button + Presets */}
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
                            className="text-xs font-bold text-ink bg-white hover:bg-surface border border-border px-3.5 py-2 rounded-xl shadow-xs transition-all flex items-center gap-1.5"
                          >
                            <span>📷</span>
                            <span>Upload Custom Photo</span>
                          </button>
                        </div>

                        {/* Preset Emojis/3D Avatars */}
                        <div className="flex items-center gap-1.5 pt-1">
                          <span className="text-[10px] text-ink-soft font-semibold">Or pick:</span>
                          <div className="flex items-center gap-1 flex-wrap">
                            {PRESET_AVATARS.map((av) => (
                              <button
                                key={av.label}
                                type="button"
                                onClick={() => setAvatarUrl(av.emoji)}
                                className={`w-8 h-8 rounded-xl flex items-center justify-center text-base border transition-all ${
                                  avatarUrl === av.emoji
                                    ? "bg-primary-light border-primary scale-110 shadow-xs"
                                    : "bg-white border-border hover:bg-surface hover:scale-105"
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
                  </div>

                  {/* 2. Display Name (Supports Arabic & English) */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-ink uppercase tracking-wider">
                      Display Name
                    </label>
                    <input
                      type="text"
                      dir="auto"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name or nickname..."
                      maxLength={60}
                      className="w-full border border-border rounded-2xl px-4 py-3.5 text-sm text-ink bg-surface focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all font-sans"
                    />
                  </div>

                  {/* 3. Country */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-ink uppercase tracking-wider">
                      Your Country
                    </label>
                    <select
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="w-full border border-border rounded-2xl px-4 py-3.5 text-sm text-ink bg-surface focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all appearance-none cursor-pointer font-sans"
                    >
                      <option value="">— Select your country —</option>
                      {COUNTRIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 4. English Level */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-ink uppercase tracking-wider">
                      English Speaking Level
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {ENGLISH_LEVELS.map((lvl) => (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() => setEnglishLevel(lvl)}
                          className={`py-3 px-3 rounded-2xl border-2 text-xs font-bold transition-all ${
                            englishLevel === lvl
                              ? "border-primary bg-primary-light/40 text-primary shadow-sm"
                              : "border-border/60 text-ink-soft hover:border-border hover:bg-surface"
                          }`}
                        >
                          {lvl}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 5. Short Bio & Interests (Supports Arabic & English seamlessly with dir="auto") */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-ink uppercase tracking-wider flex items-center justify-between">
                      <span>Short Bio & Interests <span className="normal-case font-normal text-ink-soft">(optional)</span></span>
                      <span className="text-[10px] text-ink-soft font-normal">عربي أو إنجليزي</span>
                    </label>
                    <textarea
                      dir="auto"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Tell partners about your hobbies, work, or goals (e.g. أهلاً، أحب السفر وممارسة الإنجليزية أو I work in tech and love sports)..."
                      maxLength={300}
                      rows={3}
                      className="w-full border border-border rounded-2xl px-4 py-3 text-sm text-ink bg-surface focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none font-sans leading-relaxed"
                    />
                    <p className="text-[10px] text-ink-soft text-right">{bio.length}/300</p>
                  </div>

                  {error && (
                    <div className="bg-danger/10 border border-danger/20 rounded-xl p-3 text-center">
                      <p className="text-danger text-xs font-medium">{error}</p>
                    </div>
                  )}

                  {success && (
                    <div className="bg-success/10 border border-success/20 rounded-xl p-3 text-center animate-in fade-in duration-200">
                      <p className="text-success text-xs font-semibold">✓ Profile saved successfully!</p>
                    </div>
                  )}

                  <Button type="submit" variant="primary" disabled={saving}>
                    {saving ? "Saving Changes..." : "💾 Save Changes"}
                  </Button>
                </form>
              </div>
            </div>

            {/* Right Area (5 Columns): Praise & Never Meet Again Manager */}
            <div className="lg:col-span-5 space-y-6">

              {/* 1. Partner Praise Details (Screenshot 3) */}
              <div className="bg-gradient-to-br from-rose-500/10 via-rose-500/5 to-white rounded-3xl p-6 sm:p-7 border border-rose-200 shadow-xl shadow-rose-500/5 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <span className="text-3xl">❤️</span>
                  <span className="text-xs font-bold text-rose-600 bg-rose-100 px-3 py-1 rounded-full">
                    Partner Feedback
                  </span>
                </div>
                <div>
                  <p className="text-xs text-ink-soft font-medium">Partners said:</p>
                  <h3 className="text-base font-extrabold text-ink mt-0.5">
                    "I'd love to talk with you again!"
                  </h3>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black text-rose-600">{stats?.lovedCount || 0}</span>
                  <span className="text-xs font-semibold text-rose-500">compliments received</span>
                </div>
                <p className="text-xs text-ink-soft leading-relaxed border-t border-rose-200/60 pt-3">
                  Partners leave compliments when you are friendly, active, and supportive during the conversation.
                </p>
              </div>

              {/* 2. Sound Effects & Audio Preferences */}
              <div className="bg-white rounded-3xl p-6 shadow-xl shadow-primary/5 border border-border/60 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">🔔</span>
                    <div>
                      <h3 className="text-sm font-extrabold text-ink">Audio & Sound FX</h3>
                      <p className="text-xs text-ink-soft">Call chimes and match alerts</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleToggleSound}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      soundEnabled
                        ? "bg-emerald-500 text-white shadow-xs"
                        : "bg-surface border border-border text-ink-soft"
                    }`}
                  >
                    <span>{soundEnabled ? "🔊 Enabled" : "🔇 Muted"}</span>
                  </button>
                </div>
              </div>

              {/* 3. Never Meet Again / Blocklist Manager (Screenshot 3) */}
              <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-xl shadow-primary/5 border border-border/60 flex flex-col gap-4">

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🚫</span>
                    <h3 className="text-base font-bold text-ink">Never Meet Again List</h3>
                  </div>
                  <span className="text-xs font-bold text-ink-soft bg-border/40 px-2.5 py-0.5 rounded-full">
                    {blockedList.length}
                  </span>
                </div>

                <p className="text-xs text-ink-soft leading-relaxed">
                  Users on this list will never be paired with you in future conversation queues.
                </p>

                {loadingBlocked ? (
                  <div className="py-6 text-center text-xs text-ink-soft">Loading list...</div>
                ) : blockedList.length > 0 ? (
                  <div className="divide-y divide-border/40 max-h-56 overflow-y-auto pr-1">
                    {blockedList.map((item) => (
                      <div
                        key={item.id}
                        className="py-3 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-base">{item.blockedUser.flag}</span>
                          <div>
                            <p className="font-bold text-ink">{item.blockedUser.name}</p>
                            <p className="text-[10px] text-ink-soft">
                              Blocked on {new Date(item.blockedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleUnblock(item.blockedUser.id)}
                          className="text-xs font-bold text-primary hover:text-primary-dark hover:underline"
                        >
                          Unblock
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-6 text-center text-xs text-ink-soft">
                    You haven't blocked any users yet.
                  </div>
                )}
              </div>

            </div>

          </div>

        </div>
      </PageTransition>
    </main>
  );
}
