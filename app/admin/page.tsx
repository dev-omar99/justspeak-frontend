"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "../../components/Header";
import PageTransition from "../../components/PageTransition";
import { getUser, getToken } from "../../lib/auth";
import { api } from "../../services/api";
import {
  AdminUser,
  AdminUserDetail,
  AdminStats,
  AdminSessionItem,
  AdminLiveOverview,
  AdminAiSessionItem,
  AdminAiSessionDetail,
  AdminRecordingItem,
  AdminFeedbackItem,
  AdminAuditEntry,
  PlanTierId,
} from "../../types";

type TabId =
  | "overview"
  | "users"
  | "sessions"
  | "ai-sessions"
  | "recordings"
  | "feedback"
  | "audit";

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: "overview", label: "Overview", icon: "📊" },
  { id: "users", label: "Users", icon: "👥" },
  { id: "sessions", label: "P2P Sessions", icon: "🗣️" },
  { id: "ai-sessions", label: "AI Sessions", icon: "🤖" },
  { id: "recordings", label: "Recordings", icon: "🎙️" },
  { id: "feedback", label: "Feedback", icon: "⭐" },
  { id: "audit", label: "Audit Log", icon: "📜" },
];

function fmtDate(value: string | null | undefined): string {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

function fmtDuration(sec: number | null | undefined): string {
  if (!sec || sec <= 0) return "0m";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

export default function AdminPage() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [live, setLive] = useState<AdminLiveOverview | null>(null);
  const [sessions, setSessions] = useState<AdminSessionItem[] | null>(null);
  const [aiSessions, setAiSessions] = useState<AdminAiSessionItem[] | null>(null);
  const [recordings, setRecordings] = useState<AdminRecordingItem[] | null>(null);
  const [feedback, setFeedback] = useState<AdminFeedbackItem[] | null>(null);
  const [auditLog, setAuditLog] = useState<AdminAuditEntry[] | null>(null);

  const [userDetail, setUserDetail] = useState<AdminUserDetail | null>(null);
  const [aiDetail, setAiDetail] = useState<AdminAiSessionDetail | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmForceEndId, setConfirmForceEndId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [quotaDraft, setQuotaDraft] = useState<string>("");

  const loadTab = useCallback(
    (tab: TabId) => {
      const token = getToken();
      if (!token) return;
      setError(null);
      const fail = (err: unknown) =>
        setError(err instanceof Error ? err.message : "Failed to load data");
      switch (tab) {
        case "overview":
          Promise.all([api.getAdminStats(token), api.getAdminLive(token)])
            .then(([s, l]) => {
              setStats(s);
              setLive(l);
            })
            .catch(fail);
          break;
        case "users":
          api.getUsers(token).then(setUsers).catch(fail);
          break;
        case "sessions":
          api.getAdminSessions(token).then(setSessions).catch(fail);
          break;
        case "ai-sessions":
          api.getAdminAiSessions(token).then(setAiSessions).catch(fail);
          break;
        case "recordings":
          api.getAdminRecordings(token).then(setRecordings).catch(fail);
          break;
        case "feedback":
          api.getAdminFeedback(token).then(setFeedback).catch(fail);
          break;
        case "audit":
          api.getAdminAuditLog(token).then(setAuditLog).catch(fail);
          break;
      }
    },
    []
  );

  useEffect(() => {
    const user = getUser();
    const token = getToken();

    if (!user || !token) {
      router.push("/login");
      return;
    }

    // Client-side convenience gate: non-admins are sent back to their profile.
    // The real enforcement is server-side (AdminGuard + ADMIN_EMAIL policy);
    // this only keeps the admin UI out of sight for regular users.
    if (!user.isAdmin) {
      router.push("/profile");
      return;
    }

    loadTab("overview");
  }, [router, loadTab]);

  function switchTab(tab: TabId) {
    setActiveTab(tab);
    setNotice(null);
    loadTab(tab);
  }

  async function openUserDetail(userId: string) {
    const token = getToken();
    if (!token) return;
    setBusyId(userId);
    try {
      const detail = await api.getAdminUserDetail(token, userId);
      setUserDetail(detail);
      setQuotaDraft(String(detail.aiQuotaOffset));
    } catch (err: any) {
      setError(err.message || "Failed to load user.");
    } finally {
      setBusyId(null);
    }
  }

  async function openAiDetail(sessionId: string) {
    const token = getToken();
    if (!token) return;
    setBusyId(sessionId);
    try {
      setAiDetail(await api.getAdminAiSessionDetail(token, sessionId));
    } catch (err: any) {
      setError(err.message || "Failed to load AI session.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(userId: string) {
    const token = getToken();
    if (!token) return;
    setDeletingId(userId);
    try {
      await api.deleteUser(token, userId);
      setUsers((prev) => prev?.filter((u) => u.id !== userId) ?? null);
      setStats((prev) =>
        prev ? { ...prev, totalUsers: prev.totalUsers - 1 } : null
      );
      setNotice("User deleted. Their sessions stay in history as anonymous rows.");
    } catch (err: any) {
      setError(err.message || "Failed to delete user.");
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  }

  async function handlePlanChange(
    userId: string,
    payload: { planTier?: PlanTierId; addTokens?: number }
  ) {
    const token = getToken();
    if (!token) return;
    setBusyId(userId);
    try {
      const updated = await api.updateAdminUserSubscription(token, userId, payload);
      setUsers((prev) =>
        prev
          ? prev.map((u) =>
              u.id === userId
                ? { ...u, planTier: updated.planTier, aiTokensBalance: updated.aiTokensBalance }
                : u
            )
          : null
      );
      if (userDetail?.id === userId) {
        setUserDetail({
          ...userDetail,
          planTier: updated.planTier,
          aiTokensBalance: updated.aiTokensBalance,
        });
      }
      setNotice("Subscription updated.");
    } catch (err: any) {
      setError(err.message || "Failed to update subscription.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleQuotaSave() {
    if (!userDetail) return;
    const token = getToken();
    if (!token) return;
    const offset = parseInt(quotaDraft, 10);
    if (Number.isNaN(offset) || offset < 0) {
      setError("Offset must be a non-negative number.");
      return;
    }
    setBusyId(userDetail.id);
    try {
      const res = await api.setAdminAiQuotaOffset(token, userDetail.id, offset);
      setUserDetail({ ...userDetail, aiQuotaOffset: res.offset });
      setNotice(
        "Quota offset saved. No sessions were deleted; the counter just shifts."
      );
    } catch (err: any) {
      setError(err.message || "Failed to save quota offset.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleForceEnd(sessionId: string) {
    const token = getToken();
    if (!token) return;
    setBusyId(sessionId);
    try {
      await api.forceEndAdminAiSession(token, sessionId);
      setAiSessions((prev) =>
        prev
          ? prev.map((s) =>
              s.id === sessionId ? { ...s, status: "finished", endedAt: new Date().toISOString() } : s
            )
          : null
      );
      setStats((prev) =>
        prev ? { ...prev, activeAiSessions: Math.max(0, prev.activeAiSessions - 1) } : null
      );
      setNotice("Session force-ended. Transcript and report are kept.");
    } catch (err: any) {
      setError(err.message || "Failed to force-end session.");
    } finally {
      setBusyId(null);
      setConfirmForceEndId(null);
    }
  }

  const inputCls =
    "bg-slate-100 border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <main className="min-h-screen flex flex-col pb-24 md:pb-12 relative overflow-hidden">
      <BrandWatermarkBg />
      <Header />
      <PageTransition>
        <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-6 flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Admin dashboard
              </h1>
              <p className="text-xs text-slate-500">
                Full platform control. Every change is written to the audit log.
              </p>
            </div>
            <button
              type="button"
              onClick={() => loadTab(activeTab)}
              className="text-xs font-bold text-blue-600 hover:underline"
            >
              ⟳ Refresh
            </button>
          </div>

          {/* Tab bar */}
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => switchTab(tab.id)}
                className={`flex items-center gap-1.5 whitespace-nowrap px-4 py-2 rounded-full text-sm font-bold transition-all ${
                  activeTab === tab.id
                    ? "bg-[#1E2548] text-white shadow-md"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                }`}
              >
                <span aria-hidden>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl px-4 py-3 text-sm font-semibold">
              {error}
            </div>
          )}
          {notice && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl px-4 py-3 text-sm font-semibold">
              {notice}
            </div>
          )}

          {/* ============================ OVERVIEW ============================ */}
          {activeTab === "overview" && (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Users", value: stats?.totalUsers, sub: `+${stats?.newUsersLast7d ?? 0} this week` },
                  { label: "P2P sessions", value: stats?.totalSessions },
                  { label: "AI sessions", value: stats?.totalAiSessions, sub: `${stats?.activeAiSessions ?? 0} active now` },
                  { label: "Recordings", value: stats?.totalRecordings },
                  { label: "Peer feedback", value: stats?.totalFeedbacks },
                  { label: "Blocks", value: stats?.totalBlocks },
                ].map((card) => (
                  <div
                    key={card.label}
                    className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4"
                  >
                    <p className="text-xs font-semibold text-slate-500">{card.label}</p>
                    <p className="text-2xl font-extrabold text-slate-900">
                      {card.value ?? "…"}
                    </p>
                    {card.sub && (
                      <p className="text-[11px] text-slate-400 font-medium">{card.sub}</p>
                    )}
                  </div>
                ))}
              </div>

              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
                <h2 className="text-sm font-extrabold text-slate-900 mb-3">
                  🔴 Live right now
                </h2>
                {!live ? (
                  <p className="text-sm text-slate-400">Loading…</p>
                ) : live.liveRooms.length === 0 && live.activeAiSessions.length === 0 ? (
                  <p className="text-sm text-slate-400">
                    No live P2P rooms or active AI sessions at the moment.
                  </p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {live.liveRooms.map((room) => (
                      <div
                        key={room.roomName}
                        className="flex items-center justify-between bg-slate-50 rounded-xl px-3 py-2"
                      >
                        <span className="text-sm font-bold text-slate-800">
                          P2P room
                        </span>
                        <span className="text-xs text-slate-500">
                          {room.participants.map((p) => p.userName).join(" + ")}
                        </span>
                      </div>
                    ))}
                    {live.activeAiSessions.map((s) => (
                      <div
                        key={s.id}
                        className="flex items-center justify-between bg-slate-50 rounded-xl px-3 py-2"
                      >
                        <span className="text-sm font-bold text-slate-800">
                          AI · {s.mode}
                        </span>
                        <span className="text-xs text-slate-500">
                          {s.user.name || s.user.email || s.userId} · started{" "}
                          {fmtDate(s.startedAt)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ============================= USERS ============================= */}
          {activeTab === "users" && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              {!users ? (
                <p className="text-sm text-slate-400 p-4">Loading…</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-slate-400 border-b border-slate-100">
                        <th className="px-4 py-3 font-semibold">User</th>
                        <th className="px-4 py-3 font-semibold">Plan</th>
                        <th className="px-4 py-3 font-semibold">Joined</th>
                        <th className="px-4 py-3 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => (
                        <tr key={u.id} className="border-b border-slate-50 last:border-0">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div>
                                <p className="font-bold text-slate-800 flex items-center gap-1.5">
                                  {u.name || "—"}
                                  {u.isAdmin && (
                                    <span className="text-[10px] font-extrabold uppercase text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-full">
                                      Admin
                                    </span>
                                  )}
                                </p>
                                <p className="text-xs text-slate-400" dir="ltr">
                                  {u.email || u.phone || u.id}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-full">
                              {u.planTier || "FREE"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-500">
                            {fmtDate(u.createdAt)}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => openUserDetail(u.id)}
                                disabled={busyId === u.id}
                                className="text-xs font-bold text-blue-600 hover:underline disabled:opacity-50"
                              >
                                Manage
                              </button>
                              {!u.isAdmin &&
                                (confirmDeleteId === u.id ? (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => handleDelete(u.id)}
                                      disabled={deletingId === u.id}
                                      className="text-xs font-bold text-white bg-rose-600 px-2 py-1 rounded-lg disabled:opacity-50"
                                    >
                                      {deletingId === u.id ? "Deleting…" : "Confirm delete"}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setConfirmDeleteId(null)}
                                      className="text-xs font-bold text-slate-500 hover:underline"
                                    >
                                      Cancel
                                    </button>
                                  </>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => setConfirmDeleteId(u.id)}
                                    className="text-xs font-bold text-rose-600 hover:underline"
                                  >
                                    Delete
                                  </button>
                                ))}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ========================== P2P SESSIONS ========================== */}
          {activeTab === "sessions" && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-col gap-2">
              {!sessions ? (
                <p className="text-sm text-slate-400">Loading…</p>
              ) : sessions.length === 0 ? (
                <p className="text-sm text-slate-400">No P2P sessions yet.</p>
              ) : (
                sessions.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between bg-slate-50 rounded-xl px-3 py-2"
                  >
                    <div>
                      <p className="text-sm font-bold text-slate-800">
                        {s.topic || "Free talk"}
                      </p>
                      <p className="text-xs text-slate-500">
                        {s.participants
                          .map((p) => p.name || p.email || "unknown")
                          .join(" + ")}
                      </p>
                    </div>
                    <div className="text-right text-xs text-slate-500">
                      <p>{fmtDate(s.createdAt)}</p>
                      <p>{s.feedbackCount} feedback</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ========================== AI SESSIONS =========================== */}
          {activeTab === "ai-sessions" && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-col gap-2">
              {!aiSessions ? (
                <p className="text-sm text-slate-400">Loading…</p>
              ) : aiSessions.length === 0 ? (
                <p className="text-sm text-slate-400">No AI partner sessions yet.</p>
              ) : (
                aiSessions.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between bg-slate-50 rounded-xl px-3 py-2 gap-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-800 truncate">
                        {s.mode} · {s.personaId}
                        <span
                          className={`ml-2 text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded-full ${
                            s.status === "active"
                              ? "text-emerald-700 bg-emerald-100"
                              : "text-slate-500 bg-slate-200"
                          }`}
                        >
                          {s.status}
                        </span>
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        {s.user.name || s.user.email || s.userId} · {fmtDuration(s.durationSec)} ·{" "}
                        {s._count.recordings} rec
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => openAiDetail(s.id)}
                        disabled={busyId === s.id}
                        className="text-xs font-bold text-blue-600 hover:underline disabled:opacity-50"
                      >
                        View
                      </button>
                      {s.status === "active" &&
                        (confirmForceEndId === s.id ? (
                          <>
                            <button
                              type="button"
                              onClick={() => handleForceEnd(s.id)}
                              disabled={busyId === s.id}
                              className="text-xs font-bold text-white bg-rose-600 px-2 py-1 rounded-lg disabled:opacity-50"
                            >
                              Confirm end
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmForceEndId(null)}
                              className="text-xs font-bold text-slate-500 hover:underline"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmForceEndId(s.id)}
                            className="text-xs font-bold text-amber-600 hover:underline"
                          >
                            Force end
                          </button>
                        ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* =========================== RECORDINGS =========================== */}
          {activeTab === "recordings" && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-col gap-2">
              {!recordings ? (
                <p className="text-sm text-slate-400">Loading…</p>
              ) : recordings.length === 0 ? (
                <p className="text-sm text-slate-400">No recordings yet.</p>
              ) : (
                recordings.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between bg-slate-50 rounded-xl px-3 py-2"
                  >
                    <div>
                      <p className="text-sm font-bold text-slate-800">
                        {r.kind} · {r.session?.mode || "session"}
                        <span
                          className={`ml-2 text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded-full ${
                            r.status === "stored"
                              ? "text-emerald-700 bg-emerald-100"
                              : "text-slate-500 bg-slate-200"
                          }`}
                        >
                          {r.status}
                        </span>
                      </p>
                      <p className="text-xs text-slate-500">
                        {r.session?.user.name || r.session?.user.email || r.userId} ·{" "}
                        {(r.bytes / 1024).toFixed(0)} KB
                      </p>
                    </div>
                    <p className="text-xs text-slate-500">{fmtDate(r.createdAt)}</p>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ============================ FEEDBACK ============================ */}
          {activeTab === "feedback" && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-col gap-2">
              {!feedback ? (
                <p className="text-sm text-slate-400">Loading…</p>
              ) : feedback.length === 0 ? (
                <p className="text-sm text-slate-400">No peer feedback yet.</p>
              ) : (
                feedback.map((f) => (
                  <div key={f.id} className="bg-slate-50 rounded-xl px-3 py-2">
                    <p className="text-sm font-bold text-slate-800">
                      {f.giver.name || f.giver.email} → {f.receiver.name || f.receiver.email}
                    </p>
                    <p className="text-xs text-slate-500">
                      Level: {f.levelFeedback} · Rating: {f.partnerRating}
                      {f.compliments.length > 0 && ` · ${f.compliments.join(", ")}`}
                    </p>
                    <p className="text-[11px] text-slate-400">{fmtDate(f.createdAt)}</p>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ============================= AUDIT ============================== */}
          {activeTab === "audit" && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-col gap-2">
              {!auditLog ? (
                <p className="text-sm text-slate-400">Loading…</p>
              ) : auditLog.length === 0 ? (
                <p className="text-sm text-slate-400">No admin actions recorded yet.</p>
              ) : (
                auditLog.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between bg-slate-50 rounded-xl px-3 py-2"
                  >
                    <div>
                      <p className="text-sm font-bold text-slate-800">{a.action}</p>
                      <p className="text-xs text-slate-500">
                        {a.targetType}
                        {a.targetId ? ` · ${a.targetId.slice(0, 8)}…` : ""} · by{" "}
                        {a.adminEmail}
                      </p>
                    </div>
                    <p className="text-xs text-slate-500">{fmtDate(a.createdAt)}</p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </PageTransition>

      {/* ======================= USER DETAIL DRAWER ========================== */}
      {userDetail && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-extrabold text-slate-900">Manage user</h2>
              <button
                type="button"
                onClick={() => setUserDetail(null)}
                className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="text-sm text-slate-700 flex flex-col gap-1">
              <p className="font-bold text-slate-900 text-base">
                {userDetail.name || "—"}
                {userDetail.isAdmin && (
                  <span className="ml-2 text-[10px] font-extrabold uppercase text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-full">
                    Admin
                  </span>
                )}
              </p>
              <p dir="ltr">{userDetail.email || userDetail.phone || "—"}</p>
              <p className="text-xs text-slate-500">
                {userDetail.country || "—"} · {userDetail.englishLevel || "—"} · joined{" "}
                {fmtDate(userDetail.createdAt)}
              </p>
              <p className="text-xs text-slate-500">
                Buddies {userDetail.buddiesCount} · Blocks {userDetail.blockedCount} ·
                Feedback {userDetail.feedbackGiven}/{userDetail.feedbackReceived} · Tickets{" "}
                {userDetail.ticketsLeft}
              </p>
            </div>

            <div className="border-t border-slate-100 pt-3">
              <p className="text-xs font-extrabold text-slate-500 uppercase mb-2">
                Subscription
              </p>
              <div className="flex items-center gap-2">
                {(["FREE", "PLUS", "ELITE"] as PlanTierId[]).map((tier) => (
                  <button
                    key={tier}
                    type="button"
                    onClick={() => handlePlanChange(userDetail.id, { planTier: tier })}
                    disabled={busyId === userDetail.id}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold disabled:opacity-50 ${
                      userDetail.planTier === tier
                        ? "bg-[#1E2548] text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {tier}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => handlePlanChange(userDetail.id, { addTokens: 100 })}
                  disabled={busyId === userDetail.id}
                  className="px-3 py-1.5 rounded-full text-xs font-bold bg-blue-50 text-blue-600 hover:bg-blue-100 disabled:opacity-50"
                >
                  +100 tokens ({userDetail.aiTokensBalance})
                </button>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-3">
              <p className="text-xs font-extrabold text-slate-500 uppercase mb-1">
                AI free-quota offset
              </p>
              <p className="text-[11px] text-slate-400 mb-2">
                {userDetail.aiSessionsUsed} sessions used · offset {userDetail.aiQuotaOffset}.
                Raising the offset grants extra free sessions; history is never deleted.
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  value={quotaDraft}
                  onChange={(e) => setQuotaDraft(e.target.value)}
                  className={inputCls + " w-24"}
                />
                <button
                  type="button"
                  onClick={handleQuotaSave}
                  disabled={busyId === userDetail.id}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#1E2548] text-white hover:brightness-110 disabled:opacity-50"
                >
                  Save offset
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====================== AI SESSION DETAIL DRAWER ====================== */}
      {aiDetail && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-extrabold text-slate-900">
                AI session · {aiDetail.mode}
              </h2>
              <button
                type="button"
                onClick={() => setAiDetail(null)}
                className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500">
              {aiDetail.user.name || aiDetail.user.email} · {aiDetail.personaId} ·{" "}
              {aiDetail.level} · {aiDetail.status} · {fmtDuration(aiDetail.durationSec)} ·{" "}
              {fmtDate(aiDetail.startedAt)}
            </p>

            {Array.isArray(aiDetail.transcript) && aiDetail.transcript.length > 0 && (
              <div>
                <p className="text-xs font-extrabold text-slate-500 uppercase mb-1">
                  Transcript ({(aiDetail.transcript as unknown[]).length} turns)
                </p>
                <div className="bg-slate-50 rounded-xl p-3 max-h-64 overflow-y-auto flex flex-col gap-1.5">
                  {(aiDetail.transcript as { role?: string; text?: string }[]).map(
                    (turn, i) => (
                      <p key={i} className="text-xs text-slate-700">
                        <span className="font-bold">
                          {turn.role === "user" ? "Student" : "AI"}:
                        </span>{" "}
                        {turn.text}
                      </p>
                    )
                  )}
                </div>
              </div>
            )}

            {aiDetail.report != null && (
              <div>
                <p className="text-xs font-extrabold text-slate-500 uppercase mb-1">
                  Report {aiDetail.reportModel ? `(${aiDetail.reportModel})` : ""}
                </p>
                <pre className="bg-slate-50 rounded-xl p-3 text-[11px] text-slate-700 max-h-56 overflow-y-auto whitespace-pre-wrap">
                  {JSON.stringify(aiDetail.report, null, 2)}
                </pre>
              </div>
            )}

            {aiDetail.recordings.length > 0 && (
              <div>
                <p className="text-xs font-extrabold text-slate-500 uppercase mb-1">
                  Recordings ({aiDetail.recordings.length})
                </p>
                <div className="flex flex-col gap-1">
                  {aiDetail.recordings.map((r) => (
                    <p key={r.id} className="text-xs text-slate-600">
                      {r.kind} · {r.status} · {(r.bytes / 1024).toFixed(0)} KB
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

/** Subtle brand backdrop, mirrors the profile page. */
function BrandWatermarkBg() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 opacity-[0.04]"
      style={{
        backgroundImage: "url(/icon.svg)",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center 20%",
        backgroundSize: "420px",
      }}
    />
  );
}
