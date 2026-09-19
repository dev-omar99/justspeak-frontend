export type LevelFeedback = 'HIGHER' | 'SAME' | 'LOWER';
export type PartnerRating = 'LIKED' | 'NEUTRAL' | 'BLOCKED';

export interface User {
  id: string;
  email?: string | null;
  phone?: string | null;
  countryCode?: string | null;
  country: string | null;
  name?: string | null;
  englishLevel?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  tribeId?: number | null;
  isAdmin?: boolean;
  createdAt?: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
}

export interface SignupPayload {
  email?: string;
  phone?: string;
  countryCode?: string;
  country?: string;
  password: string;
  name?: string;
}

export interface LoginPayload {
  identifier?: string;
  email?: string;
  phone?: string;
  password: string;
}

export interface SendOtpPayload {
  identifier: string;
  type?: 'email' | 'phone';
  countryCode?: string;
}

export interface SendOtpResponse {
  success: boolean;
  message: string;
  identifier: string;
  devCode?: string;
  cooldownSeconds?: number;
}

export interface VerifyOtpPayload {
  identifier: string;
  code: string;
  password?: string;
  name?: string;
  country?: string;
  countryCode?: string;
}

export interface GoogleAuthPayload {
  credential?: string;
  email?: string;
  name?: string;
  avatarUrl?: string;
  country?: string;
}



export interface RoomDetails {
  sessionId: string;
  roomName: string;
  roomUrl: string;
  topic: string;
  prompts?: string[];
  topicQuestions?: string[];
  partnerId: string;
  partnerName?: string;
  partnerCountry?: string;
}

export interface QueueStatusResponse {
  status: 'matched' | 'waiting';
  room?: RoomDetails;
}

export interface SubmitFeedbackPayload {
  sessionId: string;
  partnerId: string;
  levelFeedback: LevelFeedback;
  partnerRating: PartnerRating;
}

export interface UpdateProfilePayload {
  name?: string;
  country?: string;
  englishLevel?: string;
  bio?: string;
}

export interface RecentPartner {
  id: string;
  name: string;
  country: string | null;
  countryFlag?: string;
  lastMetDate: string;
  sessionCount: number;
  partnerRating?: string;
  isBuddy?: boolean;
}

export interface StreakWeekDay {
  dayNumber: number;
  completed: boolean;
  label: string;
}

export interface UserStats {
  streakDays: number;
  totalSessions: number;
  totalMinutes: number;
  countriesCount: number;
  lovedCount: number;
  blockedCount: number;
  buddiesCount?: number;
  liveRoomsCount: number;
}

export interface UserDashboardData {
  user: {
    id: string;
    email: string;
    name: string | null;
    country: string | null;
    englishLevel: string | null;
    bio?: string | null;
    avatarUrl?: string | null;
  };
  tickets?: {
    ticketsLeft: number;
    maxTickets: number;
    resetsInSeconds: number;
  };
  tribe?: {
    userTribe: number | null;
    currentActiveTribe: number;
    isTribeActive: boolean;
  };
  stats: UserStats;

  streakWeek: StreakWeekDay[];
  recentPartners: RecentPartner[];
}

export interface BlockedUserItem {
  id: string;
  blockedUser: {
    id: string;
    name: string;
    email: string;
    country: string | null;
    flag: string;
  };
  blockedAt: string;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  country: string | null;
  isAdmin: boolean;
  createdAt: string;
  sessionsCount?: number;
}

export interface AdminStats {
  totalUsers: number;
  totalSessions: number;
  totalFeedbacks: number;
  totalBlocks: number;
}

export interface UpdateProfilePayload {
  name?: string;
  country?: string;
  englishLevel?: string;
  bio?: string;
  avatarUrl?: string;
}

export interface LeaderboardUser {
  id: string;
  name: string;
  country: string;
  countryFlag?: string;
  avatarUrl?: string | null;
  englishLevel: string;
  tribeId: number;
  totalSessions: number;
  totalMinutes: number;
  streakDays: number;
  lovedCount: number;
  rank: number;
}

export interface TribeRanking {
  tribeId: number;
  label: string;
  totalMinutes: number;
  membersCount: number;
}

export interface LeaderboardData {
  topSpeakers: LeaderboardUser[];
  topStreaks: LeaderboardUser[];
  topLoved: LeaderboardUser[];
  tribeRankings: TribeRanking[];
  myRank: number;
}



