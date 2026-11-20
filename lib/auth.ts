"use client";

import { PlanTierId, User } from "../types";

const TOKEN_KEY = "justspeak_token";
const USER_KEY = "justspeak_user";
const SUBSCRIPTION_PREFIX = "justspeak_sub_";

export function saveToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function saveUserSubscription(
  userId: string | undefined,
  planTier: PlanTierId,
  aiTokensBalance: number
): void {
  if (typeof window === "undefined") return;
  const key = `${SUBSCRIPTION_PREFIX}${userId || "default"}`;
  localStorage.setItem(
    key,
    JSON.stringify({ planTier, aiTokensBalance, updatedAt: Date.now() })
  );
  const current = getUser();
  if (current) {
    localStorage.setItem(
      USER_KEY,
      JSON.stringify({ ...current, planTier, aiTokensBalance })
    );
  }
}

export function saveUser(user: User): void {
  if (typeof window === "undefined") return;
  let merged: User = { ...user };
  const subRaw = localStorage.getItem(
    `${SUBSCRIPTION_PREFIX}${user.id || "default"}`
  );
  if (subRaw) {
    try {
      const sub = JSON.parse(subRaw);
      if (!merged.planTier && sub.planTier) {
        merged.planTier = sub.planTier;
      }
      if (
        merged.aiTokensBalance === undefined &&
        typeof sub.aiTokensBalance === "number"
      ) {
        merged.aiTokensBalance = sub.aiTokensBalance;
      }
    } catch {}
  }
  localStorage.setItem(USER_KEY, JSON.stringify(merged));
}

export function getUser(): User | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as User;
    const subRaw = localStorage.getItem(
      `${SUBSCRIPTION_PREFIX}${parsed.id || "default"}`
    );
    if (subRaw) {
      const sub = JSON.parse(subRaw);
      return {
        ...parsed,
        planTier: sub.planTier || parsed.planTier || "FREE",
        aiTokensBalance:
          typeof sub.aiTokensBalance === "number"
            ? sub.aiTokensBalance
            : parsed.aiTokensBalance,
      };
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearAuth(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}