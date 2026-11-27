export type LevelFeedback = 'HIGHER' | 'SAME' | 'LOWER';
export type PartnerRating = 'LIKED' | 'NEUTRAL' | 'BLOCKED';
export type PlanTierId = 'FREE' | 'PLUS' | 'ELITE';

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
  planTier?: PlanTierId;
  aiTokensBalance?: number;
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
  compliments?: string[];
}

export interface UpdateProfilePayload {
  name?: string;
  country?: string;
  englishLevel?: string;
  bio?: string;
  avatarUrl?: string;
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
  contributionPoints?: number;
}

export interface UserDashboardData {
  user: {
    id: string;
    email: string | null;
    phone?: string | null;
    countryCode?: string | null;
    name: string | null;
    country: string | null;
    englishLevel: string | null;
    bio?: string | null;
    avatarUrl?: string | null;
    tribeId?: number | null;
    planTier?: PlanTierId;
    aiTokensBalance?: number;
  };
  tickets?: {
    ticketsLeft: number;
    maxTickets: number;
    resetsInSeconds: number;
    bonusTickets?: number;
  };
  tribe?: {
    userTribe: number | null;
    userTribeName?: string;
    currentActiveTribe: number;
    activeTribeName?: string;
    activeTribeWindow?: string;
    activeMembersCount?: number;
    isTribeActive: boolean;
  };
  stats: UserStats;

  streakWeek: StreakWeekDay[];
  recentPartners: RecentPartner[];
}

export interface BuddyUserItem {
  id: string;
  name: string;
  country: string | null;
  countryFlag?: string;
  englishLevel?: string | null;
  addedAt?: string;
}

export interface BlockedUserItem {
  id: string;
  blockedUser: {
    id: string;
    name: string;
    email: string | null;
    country: string | null;
    flag: string;
  };
  blockedAt: string;
}

export interface AdminUser {
  id: string;
  email: string | null;
  phone?: string | null;
  name: string | null;
  country: string | null;
  isAdmin: boolean;
  createdAt: string;
  sessionsCount?: number;
  planTier?: PlanTierId;
  aiTokensBalance?: number;
}

export interface AdminStats {
  totalUsers: number;
  totalSessions: number;
  totalFeedbacks: number;
  totalBlocks: number;
  totalAiSessions: number;
  activeAiSessions: number;
  totalRecordings: number;
  newUsersLast7d: number;
}

export interface AdminUserDetail {
  id: string;
  email: string | null;
  phone: string | null;
  name: string | null;
  country: string | null;
  englishLevel: string | null;
  isAdmin: boolean;
  ticketsLeft: number;
  createdAt: string;
  planTier: PlanTierId;
  aiTokensBalance: number;
  aiSessionsUsed: number;
  aiQuotaOffset: number;
  buddiesCount: number;
  blockedCount: number;
  feedbackGiven: number;
  feedbackReceived: number;
}

export interface AdminSessionItem {
  id: string;
  roomName: string;
  topic: string | null;
  createdAt: string;
  feedbackCount: number;
  participants: { id: string; name: string | null; email: string | null; country: string | null }[];
}

export interface AdminLiveOverview {
  liveRooms: {
    roomName: string;
    participants: { userId: string; userName: string; userCountry: string }[];
  }[];
  activeAiSessions: {
    id: string;
    userId: string;
    mode: string;
    personaId: string;
    level: string;
    startedAt: string;
    user: { name: string | null; email: string | null };
  }[];
}

export interface AdminAiSessionItem {
  id: string;
  userId: string;
  mode: string;
  personaId: string;
  level: string;
  status: string;
  startedAt: string;
  endedAt: string | null;
  durationSec: number;
  reportModel: string | null;
  user: { name: string | null; email: string | null };
  _count: { recordings: number };
}

export interface AdminAiSessionDetail {
  id: string;
  userId: string;
  mode: string;
  personaId: string;
  fieldId: string | null;
  lessonId: string | null;
  roleplayId: string | null;
  level: string;
  status: string;
  startedAt: string;
  endedAt: string | null;
  durationSec: number;
  transcript: unknown;
  facts: unknown;
  metrics: unknown;
  report: unknown;
  reportModel: string | null;
  createdAt: string;
  user: { id: string; name: string | null; email: string | null };
  recordings: AdminRecordingItem[];
}

export interface AdminRecordingItem {
  id: string;
  sessionId: string;
  userId: string;
  kind: string;
  status: string;
  storageKey: string | null;
  mimeType: string;
  bytes: number;
  durationMs: number;
  position: number;
  createdAt: string;
  session?: {
    id: string;
    mode: string;
    personaId: string;
    user: { name: string | null; email: string | null };
  };
}

export interface AdminFeedbackItem {
  id: string;
  sessionId: string;
  levelFeedback: string;
  partnerRating: string;
  compliments: string[];
  createdAt: string;
  giver: { id: string; name: string | null; email: string | null };
  receiver: { id: string; name: string | null; email: string | null };
}

export interface AdminAuditEntry {
  id: string;
  adminEmail: string;
  action: string;
  targetType: string;
  targetId: string | null;
  details: unknown;
  createdAt: string;
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



