import {
  AuthResponse,
  SignupPayload,
  LoginPayload,
  RoomDetails,
  QueueStatusResponse,
  AdminUser,
  AdminStats,
  UserDashboardData,
  BlockedUserItem,
  UpdateProfilePayload,
  LeaderboardData,
} from "../types";



const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
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

  async sendOtp(payload: { identifier: string; type?: 'email' | 'phone'; countryCode?: string }): Promise<{ success: boolean; message: string; identifier: string; devCode?: string; cooldownSeconds?: number }> {
    return this.request<{ success: boolean; message: string; identifier: string; devCode?: string; cooldownSeconds?: number }>("/auth/send-otp", {
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
    credential?: string;
    email?: string;
    name?: string;
    avatarUrl?: string;
    country?: string;
  }): Promise<AuthResponse & { message?: string }> {
    return this.request<AuthResponse & { message?: string }>("/auth/google", {
      method: "POST",
      body: JSON.stringify(payload),
    });
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

  async getBuddies(token: string): Promise<any[]> {
    return this.request<any[]>("/users/buddies", {
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
}

export const api = new ApiClient(API_BASE_URL);

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
  credential?: string;
  email?: string;
  name?: string;
  avatarUrl?: string;
  country?: string;
}) => api.googleAuth(payload);
export const joinQueue = (token: string, differentCountryOnly?: boolean) =>
  api.joinQueue(token, differentCountryOnly);
export const leaveQueue = (token: string) => api.leaveQueue(token);
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