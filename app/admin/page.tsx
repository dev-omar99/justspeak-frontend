"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "../../components/Header";
import PageTransition from "../../components/PageTransition";
import { getUser, getToken } from "../../lib/auth";
import { getUsers, getAdminStats, deleteUser } from "../../services/api";
import { AdminUser, AdminStats } from "../../types";

export default function AdminPage() {
  const router = useRouter();

  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    const user = getUser();
    const token = getToken();

    if (!user || !token) {
      router.push("/login");
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
    } catch (err: any) {
      setError(err.message || "Failed to delete user.");
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  }

  return (
    <main className="min-h-screen flex flex-col bg-surface">
      <Header showBackButton />
      <PageTransition>
        <div className="max-w-5xl mx-auto w-full flex flex-col gap-6 px-4 sm:px-6 py-6">

          {/* Page Title */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🛡️</span>
              <h1 className="text-xl font-bold text-ink">Admin Dashboard</h1>
            </div>
            {users && (
              <span className="text-xs font-semibold text-primary bg-primary-light rounded-full px-3.5 py-1.5 shadow-sm">
                {users.length} {users.length === 1 ? "User" : "Users"}
              </span>
            )}
          </div>

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
                { icon: "🎙️", value: stats.totalSessions, label: "Sessions" },
                { icon: "💬", value: stats.totalFeedbacks, label: "Feedbacks" },
                { icon: "🚫", value: stats.totalBlocks, label: "Blocks" },
              ].map((s) => (
                <div
                  key={s.label}
                  className="bg-white rounded-2xl p-4 shadow-sm border border-border/60 flex flex-col gap-1 text-center"
                >
                  <span className="text-xl">{s.icon}</span>
                  <p className="text-xl font-bold text-ink">{s.value}</p>
                  <p className="text-[11px] text-ink-soft">{s.label}</p>
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
            <div className="overflow-x-auto rounded-2xl shadow-lg shadow-primary/5 border border-border/60 bg-white">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="bg-gradient-to-r from-primary to-primary-dark">
                    <th className="px-5 py-3.5 font-semibold text-white">User</th>
                    <th className="px-5 py-3.5 font-semibold text-white">Country</th>
                    <th className="px-5 py-3.5 font-semibold text-white text-center">Sessions</th>
                    <th className="px-5 py-3.5 font-semibold text-white">Role</th>
                    <th className="px-5 py-3.5 font-semibold text-white">Joined</th>
                    <th className="px-5 py-3.5 font-semibold text-white text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {users.map((u, i) => (
                    <tr
                      key={u.id}
                      className={`hover:bg-surface/60 transition-colors ${
                        i % 2 === 1 ? "bg-surface/30" : "bg-white"
                      }`}
                    >
                      <td className="px-5 py-3.5 text-ink">
                        <div className="flex items-center gap-2.5">
                          <span className="w-8 h-8 rounded-full bg-primary-light text-primary text-xs font-bold flex items-center justify-center flex-shrink-0">
                            {(u.name || u.email).charAt(0).toUpperCase()}
                          </span>
                          <div>
                            {u.name && (
                              <p className="font-semibold text-ink text-xs">{u.name}</p>
                            )}
                            <p className="font-medium text-ink-soft text-xs">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-ink-soft text-xs">
                        {u.country || "—"}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span className="text-xs font-bold text-primary bg-primary-light px-2 py-0.5 rounded-full">
                          {u.sessionsCount ?? 0}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        {u.isAdmin ? (
                          <span className="text-xs font-semibold text-success bg-success/10 rounded-full px-2.5 py-1">
                            Admin
                          </span>
                        ) : (
                          <span className="text-xs font-medium text-ink-soft bg-border/20 rounded-full px-2.5 py-1">
                            User
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-ink-soft text-xs">
                        {new Date(u.createdAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        {!u.isAdmin && (
                          <>
                            {confirmDeleteId === u.id ? (
                              <div className="flex items-center gap-1.5 justify-center">
                                <button
                                  onClick={() => handleDelete(u.id)}
                                  disabled={deletingId === u.id}
                                  className="text-[11px] font-bold text-white bg-danger hover:bg-danger/90 px-2.5 py-1 rounded-lg transition-colors"
                                >
                                  {deletingId === u.id ? "..." : "Confirm"}
                                </button>
                                <button
                                  onClick={() => setConfirmDeleteId(null)}
                                  className="text-[11px] font-semibold text-ink-soft hover:text-ink px-2.5 py-1 rounded-lg border border-border hover:bg-surface transition-colors"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setConfirmDeleteId(u.id)}
                                className="text-[11px] font-semibold text-danger/70 hover:text-danger hover:bg-danger/10 px-2.5 py-1 rounded-lg transition-colors"
                              >
                                Delete
                              </button>
                            )}
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
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