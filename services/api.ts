import {
  AuthResponse,
  SignupPayload,
  LoginPayload,
  RoomDetails,
  QueueStatusResponse,
  AdminUser,
  AdminStats,
  AdminUserDetail,
  AdminSessionItem,
  AdminLiveOverview,
  AdminAiSessionItem,
  AdminAiSessionDetail,
  AdminRecordingItem,
  AdminFeedbackItem,
  AdminAuditEntry,
  UserDashboardData,
  BuddyUserItem,
  BlockedUserItem,
  UpdateProfilePayload,
  LeaderboardData,
} from "../types";
import { clearAuth } from "../lib/auth";



export function getApiBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (
    configured &&
    !configured.includes("localhost") &&
    !configured.includes("127.0.0.1")
  ) {
    return configured.replace(/\/$/, "");
  }
  if (typeof window !== "undefined" && window.location) {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol || "http:";
    if (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      /^\d+\.\d+\.\d+\.\d+$/.test(hostname)
    ) {
      return `${protocol}//${hostname}:4000`;
    }
    if (configured) {
      return configured.replace(/\/$/, "");
    }
    return `${protocol}//${hostname}:4000`;
  }
  return configured || "http://localhost:4000";
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || "";
  }

  /** GET requests currently on the wire, shared so two components asking for the same thing cost one call. */
  private inflight = new Map<string, Promise<unknown>>();

  /**
   * GETs with the same URL and token that overlap in time share one network call
   * (the dashboard was fetched twice on Home, Learn and My Page). GETs also stop
   * waiting after 25 s with a message that says to retry. Writes are untouched.
   */
  private request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const method = (options.method || "GET").toUpperCase();
    if (method !== "GET") return this.requestOnce<T>(endpoint, options);
    const auth = (options.headers as Record<string, string> | undefined)?.Authorization || "";
    const key = `${endpoint}|${auth}`;
    const hit = this.inflight.get(key);
    if (hit) return hit as Promise<T>;
    const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
    const timer = controller ? setTimeout(() => controller.abort(), 25000) : null;
    const p = this.requestOnce<T>(endpoint, controller ? { ...options, signal: controller.signal } : options)
      .catch((err: any) => {
        if (err?.name === "AbortError") {
          throw new Error("This is taking longer than usual. Check your connection and try again.");
        }
        throw err;
      })
      .finally(() => {
        if (timer) clearTimeout(timer);
        this.inflight.delete(key);
      });
    this.inflight.set(key, p);
    return p;
  }

  private async requestOnce<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const base = this.baseUrl || getApiBaseUrl();
    const url = `${base}${endpoint}`;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const isRoomPage =
          typeof window !== "undefined" &&
          window.location.pathname.startsWith("/room");
        if (response.status === 401 && headers.Authorization && !isRoomPage) {
          clearAuth();
          if (
            typeof window !== "undefined" &&
            !window.location.pathname.startsWith("/login")
          ) {
            window.location.href = "/login";
          }
        }
        const errorMessage =
          (data && data.message) ||
          `Request failed with status ${response.status}`;
        throw new Error(
          Array.isArray(errorMessage) ? errorMessage.join(", ") : errorMessage
        );
      }

      return data as T;
    } catch (error: any) {
      if (error.name === "TypeError" && error.message.includes("fetch")) {
        throw new Error(
          "Unable to connect to the server. Please check your network connection."
        );
      }
      throw error;
    }
  }

  // Auth methods
  async signup(payload: SignupPayload): Promise<AuthResponse> {
    return this.request<AuthResponse>("/auth/signup", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async login(payload: LoginPayload): Promise<AuthResponse> {
    return this.request<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async sendOtp(payload: { identifier: string; type?: 'email' | 'phone'; countryCode?: string }): Promise<{ success: boolean; message: string; identifier: string; devCode?: string; pendingApproval?: boolean; cooldownSeconds?: number }> {
    return this.request<{ success: boolean; message: string; identifier: string; devCode?: string; pendingApproval?: boolean; cooldownSeconds?: number }>("/auth/send-otp", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async verifyOtp(payload: {
    identifier: string;
    code: string;
    password?: string;
    name?: string;
    country?: string;
    countryCode?: string;
  }): Promise<AuthResponse & { verified?: boolean; message?: string }> {
    return this.request<AuthResponse & { verified?: boolean; message?: string }>("/auth/verify-otp", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async googleAuth(payload: {
    credential: string;
    country?: string;
  }): Promise<AuthResponse & { message?: string }> {
    return this.request<AuthResponse & { message?: string }>("/auth/google", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async resetPassword(payload: {
    identifier: string;
    code: string;
    newPassword: string;
    countryCode?: string;
  }): Promise<AuthResponse & { success?: boolean; message?: string }> {
    return this.request<AuthResponse & { success?: boolean; message?: string }>(
      "/auth/reset-password",
      {
        method: "POST",
        body: JSON.stringify(payload),
      }
    );
  }


  // Room & Queue methods
  async createRoom(token: string): Promise<RoomDetails> {
    return this.request<RoomDetails>("/rooms/create", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  async joinQueue(token: string, differentCountryOnly: boolean = false): Promise<QueueStatusResponse> {
    return this.request<QueueStatusResponse>("/rooms/queue", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ differentCountryOnly }),
    });
  }


  async leaveQueue(token: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>("/rooms/leave", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  async recoverTicket(
    token: string,
    sessionId: string
  ): Promise<{ success: boolean; ticketsLeft: number }> {
    return this.request<{ success: boolean; ticketsLeft: number }>(
      "/rooms/recover-ticket",
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ sessionId }),
      }
    );
  }

  // Admin methods
  async getUsers(token: string): Promise<AdminUser[]> {
    return this.request<AdminUser[]>("/admin/users", {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  async getAdminStats(token: string): Promise<AdminStats> {
    return this.request<AdminStats>("/admin/stats", {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  async deleteUser(token: string, userId: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/admin/users/${userId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  // Feedback methods
  async submitFeedback(
    token: string,
    payload: {
      sessionId: string;
      partnerId: string;
      levelFeedback: "HIGHER" | "SAME" | "LOWER";
      partnerRating: "LIKED" | "NEUTRAL" | "BLOCKED";
      compliments?: string[];
    }
  ): Promise<{ success: boolean; message: string; feedbackId?: string }> {

    return this.request<{ success: boolean; message: string; feedbackId?: string }>(
      "/feedback",
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      }
    );
  }

  // Dashboard & User Analytics
  async getDashboardData(token: string): Promise<UserDashboardData> {
    return this.request<UserDashboardData>("/users/dashboard", {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  async getLeaderboard(token: string): Promise<LeaderboardData> {
    return this.request<LeaderboardData>("/users/leaderboard", {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
  }


  async getBlockedUsers(token: string): Promise<BlockedUserItem[]> {
    return this.request<BlockedUserItem[]>("/users/blocked", {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  async unblockUser(token: string, blockedId: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/users/blocked/${blockedId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  async updateProfile(
    token: string,
    payload: UpdateProfilePayload
  ): Promise<{ success: boolean; user: any }> {
    return this.request<{ success: boolean; user: any }>("/users/profile", {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    });
  }

  async toggleBuddy(token: string, buddyId: string): Promise<{ isBuddy: boolean }> {
    return this.request<{ isBuddy: boolean }>(`/users/buddy/${buddyId}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  async getBuddies(token: string): Promise<BuddyUserItem[]> {
    return this.request<BuddyUserItem[]>("/users/buddies", {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  async joinTribe(token: string, tribeId: number): Promise<{ success: boolean; tribeId: number }> {
    return this.request<{ success: boolean; tribeId: number }>("/users/tribe", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ tribeId }),
    });
  }

  async callBuddy(token: string, buddyId: string, topic?: string): Promise<RoomDetails> {
    return this.request<RoomDetails>("/rooms/buddy-call", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ buddyId, topic }),
    });
  }

  async upgradeSubscription(
    token: string,
    planTier: "FREE" | "PLUS" | "ELITE",
    billingCycle: "monthly" | "annual" = "monthly"
  ): Promise<{ success: boolean; planTier: "FREE" | "PLUS" | "ELITE"; aiTokensBalance: number }> {
    return this.request<{ success: boolean; planTier: "FREE" | "PLUS" | "ELITE"; aiTokensBalance: number }>(
      "/users/subscription",
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ planTier, billingCycle }),
      }
    );
  }

  async consumeAiTokens(
    token: string,
    amount: number,
    topicId?: string
  ): Promise<{ success: boolean; planTier: "FREE" | "PLUS" | "ELITE"; aiTokensBalance: number }> {
    return this.request<{ success: boolean; planTier: "FREE" | "PLUS" | "ELITE"; aiTokensBalance: number }>(
      "/users/ai-tokens/consume",
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ amount, topicId }),
      }
    );
  }

  async sendAiStudioTurn(
    token: string,
    payload: {
      topicTitle: string;
      category?: string;
      userMessage: string;
      turnIndex?: number;
    }
  ): Promise<{
    reply: string;
    tip: string;
    fluencyScore: number;
    grammarScore?: number;
    vocabScore?: number;
    corrections?: string[];
    nativeUpgrade?: string;
    suggestedPhrases?: string[];
    wordCount: number;
  }> {
    return this.request(
      "/users/ai-studio/turn",
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      }
    );
  }

  async updateAdminUserSubscription(
    token: string,
    userId: string,
    payload: { planTier?: "FREE" | "PLUS" | "ELITE"; aiTokensBalance?: number; addTokens?: number }
  ): Promise<{ success: boolean; userId: string; planTier: "FREE" | "PLUS" | "ELITE"; aiTokensBalance: number }> {
    return this.request<{ success: boolean; userId: string; planTier: "FREE" | "PLUS" | "ELITE"; aiTokensBalance: number }>(
      `/admin/users/${userId}/subscription`,
      {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      }
    );
  }

  // Admin: full platform control endpoints
  private adminGet<T>(token: string, path: string): Promise<T> {
    return this.request<T>(path, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  getAdminUserDetail(token: string, userId: string) {
    return this.adminGet<AdminUserDetail>(token, `/admin/users/${userId}`);
  }

  setAdminAiQuotaOffset(token: string, userId: string, offset: number) {
    return this.request<{ success: boolean; userId: string; offset: number }>(
      `/admin/users/${userId}/ai-quota-offset`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ offset }),
      }
    );
  }

  getAdminSessions(token: string, take = 20, skip = 0) {
    return this.adminGet<AdminSessionItem[]>(token, `/admin/sessions?take=${take}&skip=${skip}`);
  }

  getAdminLive(token: string) {
    return this.adminGet<AdminLiveOverview>(token, `/admin/live`);
  }

  getAdminAiSessions(token: string, opts: { status?: string; userId?: string; take?: number; skip?: number } = {}) {
    const params = new URLSearchParams();
    if (opts.status) params.set("status", opts.status);
    if (opts.userId) params.set("userId", opts.userId);
    if (opts.take) params.set("take", String(opts.take));
    if (opts.skip) params.set("skip", String(opts.skip));
    const qs = params.toString();
    return this.adminGet<AdminAiSessionItem[]>(token, `/admin/ai-sessions${qs ? `?${qs}` : ""}`);
  }

  getAdminAiSessionDetail(token: string, sessionId: string) {
    return this.adminGet<AdminAiSessionDetail>(token, `/admin/ai-sessions/${sessionId}`);
  }

  forceEndAdminAiSession(token: string, sessionId: string) {
    return this.request<{ success: boolean; id: string; status: string; changed: boolean }>(
      `/admin/ai-sessions/${sessionId}/force-end`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      }
    );
  }

  getAdminRecordings(token: string, opts: { userId?: string; take?: number; skip?: number } = {}) {
    const params = new URLSearchParams();
    if (opts.userId) params.set("userId", opts.userId);
    if (opts.take) params.set("take", String(opts.take));
    if (opts.skip) params.set("skip", String(opts.skip));
    const qs = params.toString();
    return this.adminGet<AdminRecordingItem[]>(token, `/admin/recordings${qs ? `?${qs}` : ""}`);
  }

  getAdminFeedback(token: string, take = 20, skip = 0) {
    return this.adminGet<AdminFeedbackItem[]>(token, `/admin/feedback?take=${take}&skip=${skip}`);
  }

  getAdminAuditLog(token: string, take = 50, skip = 0) {
    return this.adminGet<AdminAuditEntry[]>(token, `/admin/audit-log?take=${take}&skip=${skip}`);
  }
}

export const api = new ApiClient();

export const signup = (payload: SignupPayload) => api.signup(payload);
export const login = (payload: LoginPayload) => api.login(payload);
export const sendOtp = (payload: { identifier: string; type?: 'email' | 'phone'; countryCode?: string }) =>
  api.sendOtp(payload);
export const verifyOtp = (payload: {
  identifier: string;
  code: string;
  password?: string;
  name?: string;
  country?: string;
  countryCode?: string;
}) => api.verifyOtp(payload);
export const googleLogin = (payload: {
  credential: string;
  country?: string;
}) => api.googleAuth(payload);
export const resetPassword = (payload: {
  identifier: string;
  code: string;
  newPassword: string;
  countryCode?: string;
}) => api.resetPassword(payload);
export const joinQueue = (token: string, differentCountryOnly?: boolean) =>
  api.joinQueue(token, differentCountryOnly);
export const leaveQueue = (token: string) => api.leaveQueue(token);
export const recoverTicket = (token: string, sessionId: string) =>
  api.recoverTicket(token, sessionId);
export const createRoom = (token: string) => api.createRoom(token);



export const getUsers = (token: string) => api.getUsers(token);
export const getAdminStats = (token: string) => api.getAdminStats(token);
export const deleteUser = (token: string, userId: string) => api.deleteUser(token, userId);
export const submitFeedback = (
  token: string,
  payload: {
    sessionId: string;
    partnerId: string;
    levelFeedback: "HIGHER" | "SAME" | "LOWER";
    partnerRating: "LIKED" | "NEUTRAL" | "BLOCKED";
    compliments?: string[];
  }
) => api.submitFeedback(token, payload);

export const getDashboardData = (token: string) => api.getDashboardData(token);
export const getLeaderboard = (token: string) => api.getLeaderboard(token);
export const getBlockedUsers = (token: string) => api.getBlockedUsers(token);

export const unblockUser = (token: string, blockedId: string) =>
  api.unblockUser(token, blockedId);
export const updateProfile = (token: string, payload: UpdateProfilePayload) =>
  api.updateProfile(token, payload);
export const toggleBuddy = (token: string, buddyId: string) =>
  api.toggleBuddy(token, buddyId);
export const getBuddies = (token: string) => api.getBuddies(token);
export const joinTribe = (token: string, tribeId: number) => api.joinTribe(token, tribeId);
export const callBuddy = (token: string, buddyId: string, topic?: string) =>
  api.callBuddy(token, buddyId, topic);
export const upgradeSubscription = (
  token: string,
  planTier: "FREE" | "PLUS" | "ELITE",
  billingCycle?: "monthly" | "annual"
) => api.upgradeSubscription(token, planTier, billingCycle);
export const consumeAiTokens = (token: string, amount: number, topicId?: string) =>
  api.consumeAiTokens(token, amount, topicId);
export const sendAiStudioTurn = (
  token: string,
  payload: { topicTitle: string; category?: string; userMessage: string; turnIndex?: number }
) => api.sendAiStudioTurn(token, payload);
export const updateAdminUserSubscription = (
  token: string,
  userId: string,
  payload: { planTier?: "FREE" | "PLUS" | "ELITE"; aiTokensBalance?: number; addTokens?: number }
) => api.updateAdminUserSubscription(token, userId, payload);

export const getAcademyProgressApi = (token: string) =>
  fetch(`${getApiBaseUrl()}/users/academy-progress`, {
    headers: { Authorization: `Bearer ${token}` },
  }).then((r) => (r.ok ? r.json() : { progress: null }));

export const saveAcademyProgressApi = (token: string, payload: any) =>
  fetch(`${getApiBaseUrl()}/users/academy-progress`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  }).then((r) => (r.ok ? r.json() : null));

export const translateWordApi = async (
  token: string,
  text: string
): Promise<{
  word: string;
  meaningAr: string;
  meaningEn: string;
  example: string;
  ipa: string;
  pos: string;
  level: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
  sourceLang: "ar" | "en";
}> => {
  const res = await fetch(`${getApiBaseUrl()}/users/translate-word`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ text }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.message || "Failed to translate word");
  }
  return data;
};

export const changePasswordApi = async (
  token: string,
  currentPassword: string,
  newPassword: string
) => {
  const res = await fetch(`${getApiBaseUrl()}/users/change-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.message || "Failed to update password");
  }
  return data;
};

export const deleteMyAccountApi = async (token: string) => {
  const res = await fetch(`${getApiBaseUrl()}/users/me`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.message || "Failed to delete account");
  }
  return data;
};