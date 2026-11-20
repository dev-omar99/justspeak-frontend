import { PlanTierId } from "../types";

/**
 * Standalone AI Topic Speaking Studio Catalog
 * -------------------------------------------
 * Completely decoupled from live 1-on-1 human calls.
 * Paid subscribers spend AI Tokens to practice realistic scenarios with the AI model.
 */

export type AiTopicCategory =
  | "All Tracks"
  | "Daily & Travel"
  | "Career & Business"
  | "IELTS & Academic"
  | "Custom Scenario";

export interface AiPracticeTopic {
  id: string;
  title: string;
  category: Exclude<AiTopicCategory, "All Tracks">;
  level: "Beginner - Intermediate" | "Intermediate - Advanced" | "All Levels";
  requiredTier: Exclude<PlanTierId, "FREE">;
  tokenCostPerSession: number;
  icon: string;
  summary: string;
  samplePrompt: string;
  skillsFocused: string[];
}

export const AI_TOPIC_CATEGORIES: readonly AiTopicCategory[] = [
  "All Tracks",
  "Daily & Travel",
  "Career & Business",
  "IELTS & Academic",
  "Custom Scenario",
] as const;

export const AI_PRACTICE_TOPICS: readonly AiPracticeTopic[] = [
  {
    id: "airport-immigration",
    title: "Airport, Immigration & Hotel Check-In",
    category: "Daily & Travel",
    level: "Beginner - Intermediate",
    requiredTier: "PLUS",
    tokenCostPerSession: 20,
    icon: "✈️",
    summary: "Practice handling passport control, flight connections, luggage issues, and hotel upgrades smoothly.",
    samplePrompt: "Good afternoon! May I see your passport and return ticket? What is the purpose of your visit?",
    skillsFocused: ["Travel Vocabulary", "Polite Requests", "Quick Listening"],
  },
  {
    id: "daily-storytelling",
    title: "Natural Small Talk & Storytelling",
    category: "Daily & Travel",
    level: "All Levels",
    requiredTier: "PLUS",
    tokenCostPerSession: 20,
    icon: "☕",
    summary: "Build effortless everyday fluency discussing hobbies, weekend plans, movies, and cultural traditions.",
    samplePrompt: "Tell me about something memorable that happened to you recently—how did it start?",
    skillsFocused: ["Past Tenses", "Conversational Connectors", "Idioms"],
  },
  {
    id: "restaurant-shopping",
    title: "Dining Out, Ordering & Problem Solving",
    category: "Daily & Travel",
    level: "Beginner - Intermediate",
    requiredTier: "PLUS",
    tokenCostPerSession: 15,
    icon: "🍽️",
    summary: "Order confidently abroad, ask about ingredients, and politely resolve a wrong order or bill issue.",
    samplePrompt: "Welcome! Would you like to hear today's specials, or do you have any dietary preferences?",
    skillsFocused: ["Everyday Phrasing", "Natural Tone", "Confidence"],
  },
  {
    id: "tech-job-interview",
    title: "International Job Interview Simulator",
    category: "Career & Business",
    level: "Intermediate - Advanced",
    requiredTier: "ELITE",
    tokenCostPerSession: 30,
    icon: "💼",
    summary: "Answer behavioral & role-specific interview questions with instant STAR-method coaching and phrasing upgrades.",
    samplePrompt: "Walk me through a challenging project you led when priorities shifted unexpectedly.",
    skillsFocused: ["STAR Framework", "Executive Vocabulary", "Grammar Precision"],
  },
  {
    id: "business-standup",
    title: "Remote Team Meeting & Pitching Ideas",
    category: "Career & Business",
    level: "Intermediate - Advanced",
    requiredTier: "PLUS",
    tokenCostPerSession: 25,
    icon: "📊",
    summary: "Present project updates, persuade stakeholders, and handle follow-up questions in global meetings.",
    samplePrompt: "We have five minutes before the client joins—what are the top risks we should highlight?",
    skillsFocused: ["Persuasion", "Clear Structuring", "Business Idioms"],
  },
  {
    id: "ielts-speaking-full",
    title: "IELTS Speaking Parts 1, 2 & 3 Mock Examiner",
    category: "IELTS & Academic",
    level: "Intermediate - Advanced",
    requiredTier: "ELITE",
    tokenCostPerSession: 35,
    icon: "🎓",
    summary: "Full timed IELTS cue-card & follow-up discussion with estimated band score and lexical upgrade tips.",
    samplePrompt: "Part 2 Cue Card: Describe a skill you learned that required patience. You have 1 minute to prepare.",
    skillsFocused: ["Lexical Resource", "Coherence", "Band 7-8+ Structures"],
  },
  {
    id: "debate-critical-thinking",
    title: "Technology, AI & Global Trends Debate",
    category: "IELTS & Academic",
    level: "Intermediate - Advanced",
    requiredTier: "ELITE",
    tokenCostPerSession: 30,
    icon: "🧠",
    summary: "Sharpen advanced argumentation by defending nuanced viewpoints on modern society and innovation.",
    samplePrompt: "Do you believe remote work increases long-term productivity, or does it weaken team culture?",
    skillsFocused: ["Nuanced Argumentation", "Advanced Connectors", "Fluency Pace"],
  },
  {
    id: "custom-user-topic",
    title: "Create Your Own Custom AI Topic",
    category: "Custom Scenario",
    level: "All Levels",
    requiredTier: "ELITE",
    tokenCostPerSession: 25,
    icon: "✨",
    summary: "Type any real-life situation, presentation topic, or roleplay character and practice tailored to you.",
    samplePrompt: "Describe any scenario you want to rehearse, and your AI speaking partner will adapt immediately!",
    skillsFocused: ["Personalized Roleplay", "Targeted Vocabulary", "Instant Corrections"],
  },
] as const;
