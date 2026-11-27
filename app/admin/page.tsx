"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "../../components/Header";
import PageTransition from "../../components/PageTransition";
import { getUser, getToken } from "../../lib/auth";
import {
  getUsers,
  getAdminStats,
  deleteUser,
  updateAdminUserSubscription,
} from "../../services/api";
import { AdminUser, AdminStats, PlanTierId } from "../../types";

export default function AdminPage() {
  const router = useRouter();

  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [updatingSubId, setUpdatingSubId] = useState<string | null>(null);

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

    Promise.all([getUsers(token), getAdminStats(token)])
      .then(([usersData, statsData]) => {
        setUsers(usersData);
        setStats(statsData);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load data");
      });
  }, [router]);

  async function handleDelete(userId: string) {
    const token = getToken();
    if (!token) return;
    setDeletingId(userId);
    try {
      await deleteUser(token, userId);
      setUsers((prev) => prev?.filter((u) => u.id !== userId) ?? null);
      setStats((prev) =>
        prev ? { ...prev, totalUsers: prev.totalUsers - 1 } : null
      );
      setNotice("User deleted successfully.");
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
    setUpdatingSubId(userId);
    try {
      const updated = await updateAdminUserSubscription(token, userId, payload);
      setUsers((prev) =>
        prev
          ? prev.map((u) =>
              u.id === userId
                ? {
                    ...u,
                    planTier: updated.planTier,
                    aiTokensBalance: updated.aiTokensBalance,
                  }
                : u
            )
          : null
      );
      setNotice(
        `Updated user plan to ${updated.planTier} (${updated.aiTokensBalance.toLocaleString()} AI Tokens).`
      );
    } catch (err: any) {
      setError(err.message || "Failed to update subscription.");
    } finally {
      setUpdatingSubId(null);
    }
  }

  return (
    <main className="min-h-screen flex flex-col pb-24 lg:pb-16">
      <Header showBackButton />
      <PageTransition>
        <div className="max-w-6xl mx-auto w-full flex flex-col gap-6 px-4 sm:px-6 py-6">
          {/* American Flag Executive Admin Banner */}
          <div className="rounded-[28px] bg-gradient-to-br from-[#061533] via-[#002868] to-[#881337] text-white p-6 sm:p-8 shadow-xl border-2 border-[#E11D48]/35 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🛡️</span>
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider text-rose-200">
                  Executive Control Center
                </span>
                <h1 className="text-xl sm:text-2xl font-black text-white">
                  JustSpeak Admin & Subscription Manager
                </h1>
              </div>
            </div>
            {users && (
              <span className="text-xs font-black text-white bg-[#E11D48] rounded-full px-4 py-2 shadow-md">
                {users.length} Registered {users.length === 1 ? "Member" : "Members"}
              </span>
            )}
          </div>

          {notice && (
            <div className="bg-[#EAF1FC] border border-[#002868]/30 text-[#002868] rounded-2xl px-4 py-3 text-xs font-bold flex items-center justify-between">
              <span>✨ {notice}</span>
              <button
                type="button"
                onClick={() => setNotice(null)}
                className="font-black cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          {error && (
            <div className="border border-danger/30 rounded-xl p-4 bg-danger/5 text-center">
              <p className="text-danger text-sm font-medium">{error}</p>
            </div>
          )}

          {/* Stats Grid */}
          {stats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { icon: "👥", value: stats.totalUsers, label: "Total Users" },
                { icon: "🎙️", value: stats.totalSessions, label: "Live Sessions" },
                { icon: "💬", value: stats.totalFeedbacks, label: "Feedbacks" },
                { icon: "🚫", value: stats.totalBlocks, label: "Safety Blocks" },
              ].map((s) => (
                <div
                  key={s.label}
                  className="bg-white rounded-2xl p-4 shadow-sm border border-border flex flex-col gap-1 text-center"
                >
                  <span className="text-xl">{s.icon}</span>
                  <p className="text-2xl font-black text-[#002868]">{s.value}</p>
                  <p className="text-[11px] font-bold text-ink-soft">{s.label}</p>
                </div>
              ))}
            </div>
          )}

          {/* Loading */}
          {!error && users === null && (
            <div className="flex flex-col items-center gap-3 py-16">
              <div className="w-9 h-9 rounded-full border-4 border-primary-light border-t-primary animate-spin" />
              <p className="text-sm text-ink-soft">Loading users...</p>
            </div>
          )}

          {/* Users Table */}
          {users && (
            <div className="overflow-x-auto rounded-3xl shadow-lg border border-border bg-white">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="bg-gradient-to-r from-[#002868] via-[#0A3161] to-[#D91023]">
                    <th className="px-5 py-3.5 font-extrabold text-white text-xs">User</th>
                    <th className="px-5 py-3.5 font-extrabold text-white text-xs">Country</th>
                    <th className="px-5 py-3.5 font-extrabold text-white text-xs text-center">Sessions</th>
                    <th className="px-5 py-3.5 font-extrabold text-white text-xs">Plan & AI Tokens</th>
                    <th className="px-5 py-3.5 font-extrabold text-white text-xs">Instant Upgrade / Grant</th>
                    <th className="px-5 py-3.5 font-extrabold text-white text-xs text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {users.map((u, i) => {
                    const tier = u.planTier || "FREE";
                    const tokens = u.aiTokensBalance ?? 0;
                    const busy = updatingSubId === u.id;
                    return (
                      <tr
                        key={u.id}
                        className={`hover:bg-surface/60 transition-colors ${
                          i % 2 === 1 ? "bg-surface/30" : "bg-white"
                        }`}
                      >
                        <td className="px-5 py-3.5 text-ink">
                          <div className="flex items-center gap-2.5">
                            <span className="w-8 h-8 rounded-full bg-[#002868] text-white text-xs font-black flex items-center justify-center flex-shrink-0">
                              {(u.name || u.email || "U").charAt(0).toUpperCase()}
                            </span>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <p className="font-extrabold text-ink text-xs">
                                  {u.name || "Learner"}
                                </p>
                                {u.isAdmin && (
                                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[#FFF0F2] text-[#D91023] border border-[#E11D48]/30">
                                    ADMIN
                                  </span>
                                )}
                              </div>
                              <p className="font-medium text-ink-soft text-[11px]">
                                {u.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-ink-soft text-xs font-semibold">
                          {u.country || "—"}
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <span className="text-xs font-black text-[#002868] bg-[#EAF1FC] px-2.5 py-1 rounded-full">
                            {u.sessionsCount ?? 0}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex flex-col gap-1">
                            <span
                              className={`text-[11px] font-black px-2.5 py-0.5 rounded-full w-max ${
                                tier === "ELITE"
                                  ? "bg-[#E11D48] text-white"
                                  : tier === "PLUS"
                                  ? "bg-[#002868] text-white"
                                  : "bg-surface-subtle text-ink-soft border border-border"
                              }`}
                            >
                              {tier}
                            </span>
                            <span className="text-[11px] font-extrabold text-[#D91023]">
                              ⚡ {tokens.toLocaleString()} Tokens
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex flex-wrap items-center gap-1.5">
                            {(["FREE", "PLUS", "ELITE"] as PlanTierId[]).map(
                              (targetTier) => (
                                <button
                                  key={targetTier}
                                  type="button"
                                  disabled={busy || tier === targetTier}
                                  onClick={() =>
                                    handlePlanChange(u.id, {
                                      planTier: targetTier,
                                    })
                                  }
                                  className={`text-[10px] font-black px-2.5 py-1 rounded-lg transition-all cursor-pointer disabled:opacity-40 ${
                                    tier === targetTier
                                      ? "bg-[#061533] text-white"
                                      : "bg-surface hover:bg-[#EAF1FC] text-[#002868] border border-border"
                                  }`}
                                >
                                  {targetTier}
                                </button>
                              )
                            )}
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() =>
                                handlePlanChange(u.id, { addTokens: 500 })
                              }
                              className="text-[10px] font-black px-2.5 py-1 rounded-lg bg-[#FFF0F2] hover:bg-[#FFE4E8] text-[#D91023] border border-[#E11D48]/30 cursor-pointer disabled:opacity-40"
                            >
                              +500 ⚡
                            </button>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          {!u.isAdmin && (
                            <>
                              {confirmDeleteId === u.id ? (
                                <div className="flex items-center gap-1.5 justify-center">
                                  <button
                                    onClick={() => handleDelete(u.id)}
                                    disabled={deletingId === u.id}
                                    className="text-[11px] font-bold text-white bg-danger hover:bg-danger/90 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                                  >
                                    {deletingId === u.id ? "..." : "Confirm"}
                                  </button>
                                  <button
                                    onClick={() => setConfirmDeleteId(null)}
                                    className="text-[11px] font-semibold text-ink-soft hover:text-ink px-2.5 py-1 rounded-lg border border-border hover:bg-surface transition-colors cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setConfirmDeleteId(u.id)}
                                  className="text-[11px] font-semibold text-danger/70 hover:text-danger hover:bg-danger/10 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                                >
                                  Delete
                                </button>
                              )}
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {users.length === 0 && (
                <div className="py-12 text-center">
                  <p className="text-sm text-ink-soft">No registered users yet</p>
                </div>
              )}
            </div>
          )}
        </div>
      </PageTransition>
    </main>
  );
}
