// JustSpeak Academy — Official CEFR (A1–C2) & Oxford-Aligned Learning Engine

export type CefrLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

export interface CefrLevelMeta {
  level: CefrLevel;
  title: string;
  titleAr: string;
  ieltsBand: string;
  nextLevel: CefrLevel | null;
  dailySpeakingGoalMins: number;
  dailyCallsTarget: number; // Based on 7-min live JustSpeak calls
  totalSpeakingMinsToAdvance: number; // Cumulative speaking hours needed to level up
  targetVocabCount: number;
  estimatedWeeks: number;
  colorClass: string;
  badgeBg: string;
  canDoSummary: string;
  canDoSummaryAr: string;
  dailyChecklist: {
    id: string;
    label: string;
    labelAr: string;
    href: string;
    icon: string;
  }[];
}

export const CEFR_LEVELS: Record<CefrLevel, CefrLevelMeta> = {
  A1: {
    level: "A1",
    title: "Beginner",
    titleAr: "مبتدئ (التأسيس)",
    ieltsBand: "2.5 – 3.5",
    nextLevel: "A2",
    dailySpeakingGoalMins: 14,
    dailyCallsTarget: 2,
    totalSpeakingMinsToAdvance: 420, // ~7 hours of real 1-on-1 speaking
    targetVocabCount: 500,
    estimatedWeeks: 4,
    colorClass: "from-emerald-500 to-teal-600",
    badgeBg: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
    canDoSummary:
      "Understand and use everyday expressions, introduce yourself, and hold simple slow-paced conversations.",
    canDoSummaryAr:
      "فهم واستخدام العبارات اليومية الأساسية، التعريف بالنفس، وإجراء محادثات بسيطة وواضحة.",
    dailyChecklist: [
      { id: "speak", label: "Complete 2 Live Calls (14 mins)", labelAr: "إتمام مكالمتين حيتين (14 دقيقة)", href: "/queue", icon: "🎙️" },
      { id: "vocab", label: "Learn 5 A1 Core Words", labelAr: "حفظ 5 كلمات أساسية لمستوى A1", href: "/learn/vocabulary", icon: "📚" },
      { id: "reading", label: "Read 1 A1 Graded Story", labelAr: "قراءة قطعة متدرجة لمستوى A1", href: "/learn/reading", icon: "📖" },
      { id: "pron", label: "Practice 1 Phonetic Drill (P/B, TH)", labelAr: "تمرين نطق واحد (P/B أو TH)", href: "/learn/pronunciation", icon: "🗣️" },
    ],
  },
  A2: {
    level: "A2",
    title: "Elementary",
    titleAr: "أساسي (ما قبل المتوسط)",
    ieltsBand: "3.5 – 4.5",
    nextLevel: "B1",
    dailySpeakingGoalMins: 14,
    dailyCallsTarget: 2,
    totalSpeakingMinsToAdvance: 600, // ~10 hours
    targetVocabCount: 1000,
    estimatedWeeks: 6,
    colorClass: "from-teal-500 to-cyan-600",
    badgeBg: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
    canDoSummary:
      "Communicate in routine daily tasks, describe your background, travel plans, and immediate surroundings.",
    canDoSummaryAr:
      "التواصل في المواقف اليومية الروتينية، وصف خلفيتك، خطط السفر، والتحدث عن حياتك اليومية بثقة.",
    dailyChecklist: [
      { id: "speak", label: "Complete 2 Live Calls (14 mins)", labelAr: "إتمام مكالمتين حيتين (14 دقيقة)", href: "/queue", icon: "🎙️" },
      { id: "vocab", label: "Master 6 A2 Oxford Words", labelAr: "إتقان 6 كلمات لمستوى A2", href: "/learn/vocabulary", icon: "📚" },
      { id: "listening", label: "Listen to 1 Graded Audio Story", labelAr: "الاستماع لقصة مسموعة متدرجة", href: "/learn/listening", icon: "🎧" },
      { id: "shadowing", label: "Shadow 1 Short Movie Clip", labelAr: "تقليد مشهد قصير (Shadowing)", href: "/learn/shadowing", icon: "🎬" },
    ],
  },
  B1: {
    level: "B1",
    title: "Intermediate",
    titleAr: "متوسط (الاستقلالية)",
    ieltsBand: "5.0 – 5.5",
    nextLevel: "B2",
    dailySpeakingGoalMins: 21,
    dailyCallsTarget: 3,
    totalSpeakingMinsToAdvance: 900, // ~15 hours
    targetVocabCount: 2000,
    estimatedWeeks: 8,
    colorClass: "from-blue-500 to-indigo-600",
    badgeBg: "bg-blue-500/20 text-blue-300 border-blue-500/40",
    canDoSummary:
      "Handle most travel and work conversations, express opinions, explain experiences, dreams, and ambitions.",
    canDoSummaryAr:
      "إدارة أغلب محادثات السفر والعمل، التعبير عن الآراء، وشرح التجارب والأهداف بطلاقة متوسطة.",
    dailyChecklist: [
      { id: "speak", label: "Complete 3 Live Calls (21 mins)", labelAr: "إتمام 3 مكالمات حية (21 دقيقة)", href: "/queue", icon: "🎙️" },
      { id: "vocab", label: "Learn 8 B1 Intermediate Words", labelAr: "إتقان 8 كلمات لمستوى B1", href: "/learn/vocabulary", icon: "📚" },
      { id: "reading", label: "Read 1 B1 Article + Quiz", labelAr: "قراءة مقال B1 وحل الاختبار", href: "/learn/reading", icon: "📖" },
      { id: "shadowing", label: "Shadow 1 Movie Scene (Auto-Pause)", labelAr: "جلسة شادوينج لمشهد فيلم", href: "/learn/shadowing", icon: "🎬" },
    ],
  },
  B2: {
    level: "B2",
    title: "Upper-Intermediate",
    titleAr: "فوق المتوسط (الطلاقة العملية)",
    ieltsBand: "6.0 – 6.5",
    nextLevel: "C1",
    dailySpeakingGoalMins: 21,
    dailyCallsTarget: 3,
    totalSpeakingMinsToAdvance: 1200, // ~20 hours
    targetVocabCount: 3000,
    estimatedWeeks: 10,
    colorClass: "from-indigo-500 to-violet-600",
    badgeBg: "bg-violet-500/20 text-violet-300 border-violet-500/40",
    canDoSummary:
      "Interact with a degree of fluency and spontaneity that makes regular interaction with native speakers effortless.",
    canDoSummaryAr:
      "التفاعل بطلاقة وتلقائية عالية تجعل المحادثة مع المتحدثين الأصليين سلسة وواضحة في مواضيع متنوعة.",
    dailyChecklist: [
      { id: "speak", label: "Complete 3 Live Calls (21 mins)", labelAr: "إتمام 3 مكالمات حية (21 دقيقة)", href: "/queue", icon: "🎙️" },
      { id: "vocab", label: "Master 10 B2 Oxford 3000 Words", labelAr: "إتقان 10 كلمات لمستوى B2", href: "/learn/vocabulary", icon: "📚" },
      { id: "shadowing", label: "Shadow 1 Fast-Paced Scene", labelAr: "شادوينج لمشهد سريع الإيقاع", href: "/learn/shadowing", icon: "🎬" },
      { id: "pron", label: "Master 1 Tongue Twister Challenge", labelAr: "اجتياز تحدي نطق (Tongue Twister)", href: "/learn/pronunciation", icon: "🗣️" },
    ],
  },
  C1: {
    level: "C1",
    title: "Advanced",
    titleAr: "متقدم (الاحترافية)",
    ieltsBand: "7.0 – 8.0",
    nextLevel: "C2",
    dailySpeakingGoalMins: 28,
    dailyCallsTarget: 4,
    totalSpeakingMinsToAdvance: 1500, // ~25 hours
    targetVocabCount: 5000,
    estimatedWeeks: 12,
    colorClass: "from-amber-500 to-orange-600",
    badgeBg: "bg-amber-500/20 text-amber-300 border-amber-500/40",
    canDoSummary:
      "Express yourself fluently and spontaneously without obvious searching for expressions in academic and executive contexts.",
    canDoSummaryAr:
      "التعبير عن نفسك بطلاقة وعفوية تامة في السياقات المهنية والأكاديمية المعقدة بدقة لغوية عالية.",
    dailyChecklist: [
      { id: "speak", label: "Complete 4 Live Calls (28 mins)", labelAr: "إتمام 4 مكالمات حية (28 دقيقة)", href: "/queue", icon: "🎙️" },
      { id: "vocab", label: "Master 10 C1 Oxford 5000 Words", labelAr: "إتقان 10 كلمات متقدمة C1", href: "/learn/vocabulary", icon: "📚" },
      { id: "listening", label: "Listen to 1 Classic Novel Chapter", labelAr: "الاستماع لفصل من رواية كلاسيكية", href: "/learn/listening", icon: "🎧" },
      { id: "shadowing", label: "Shadow Executive Speech / TED", labelAr: "شادوينج لخطاب TED أو مشهد متقدم", href: "/learn/shadowing", icon: "🎬" },
    ],
  },
  C2: {
    level: "C2",
    title: "Mastery",
    titleAr: "إتقان تام (مستوى متحدث أصلي)",
    ieltsBand: "8.5 – 9.0",
    nextLevel: null,
    dailySpeakingGoalMins: 28,
    dailyCallsTarget: 4,
    totalSpeakingMinsToAdvance: 2000,
    targetVocabCount: 6000,
    estimatedWeeks: 12,
    colorClass: "from-rose-500 to-amber-500",
    badgeBg: "bg-rose-500/20 text-rose-300 border-rose-500/40",
    canDoSummary:
      "Understand with ease virtually everything heard or read and convey finer shades of meaning precisely.",
    canDoSummaryAr:
      "فهم كل ما يُسمع أو يُقرأ بسهولة تامة والتعبير عن أدق الفروق المعنوية بثقة المتحدث الأصلي.",
    dailyChecklist: [
      { id: "speak", label: "Lead 4 Live Debates (28 mins)", labelAr: "قيادة 4 نقاشات حية (28 دقيقة)", href: "/queue", icon: "🎙️" },
      { id: "shadowing", label: "Shadow Native Idiomatic Clips", labelAr: "شادوينج للتعبيرات الاصطلاحية", href: "/learn/shadowing", icon: "🎬" },
      { id: "reading", label: "Read Advanced Editorial + Nuance", labelAr: "قراءة مقال متقدم وتحليل الأسلوب", href: "/learn/reading", icon: "📖" },
      { id: "pron", label: "Accent & Intonation Refinement", labelAr: "صقل النغمة ومخارج الحروف", href: "/learn/pronunciation", icon: "🗣️" },
    ],
  },
};

export const CEFR_ORDER: CefrLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"];

export interface PlacementQuestion {
  id: string;
  level: CefrLevel;
  skill: "grammar" | "vocabulary" | "comprehension";
  question: string;
  context?: string;
  options: string[];
  correctIndex: number;
  weight: number;
}

export const PLACEMENT_QUESTIONS: PlacementQuestion[] = [
  {
    id: "q1",
    level: "A1",
    skill: "grammar",
    question: "She _____ from Egypt, and she speaks Arabic and English.",
    options: ["am", "is", "are", "be"],
    correctIndex: 1,
    weight: 1,
  },
  {
    id: "q2",
    level: "A1",
    skill: "vocabulary",
    question: "I usually drink a cup of coffee in the _____ before work.",
    options: ["morning", "tomorrow", "yesterday", "clock"],
    correctIndex: 0,
    weight: 1,
  },
  {
    id: "q3",
    level: "A2",
    skill: "grammar",
    question: "We _____ to Alexandria last weekend and visited the library.",
    options: ["go", "going", "went", "gone"],
    correctIndex: 2,
    weight: 1.5,
  },
  {
    id: "q4",
    level: "A2",
    skill: "comprehension",
    context: "Notice: 'The café is closed on Mondays. Open Tue–Sun from 8 AM to 10 PM.'",
    question: "When can you buy coffee at this café?",
    options: [
      "Monday at 9 AM",
      "Wednesday at 11 PM",
      "Friday at 9 AM",
      "Monday at 8 PM",
    ],
    correctIndex: 2,
    weight: 1.5,
  },
  {
    id: "q5",
    level: "B1",
    skill: "grammar",
    question: "If I _____ more free time this month, I would practice speaking every evening.",
    options: ["have", "had", "will have", "having"],
    correctIndex: 1,
    weight: 2,
  },
  {
    id: "q6",
    level: "B1",
    skill: "vocabulary",
    question: "Speaking with real partners helped me _____ my fear of making mistakes.",
    options: ["overcome", "overtake", "overlook", "overflow"],
    correctIndex: 0,
    weight: 2,
  },
  {
    id: "q7",
    level: "B2",
    skill: "grammar",
    question: "By the time the conference starts tomorrow, the team _____ all the presentation slides.",
    options: [
      "finishes",
      "will have finished",
      "has finished",
      "is finishing",
    ],
    correctIndex: 1,
    weight: 2.5,
  },
  {
    id: "q8",
    level: "B2",
    skill: "comprehension",
    context:
      "Research shows that active speaking for 15 minutes daily outperforms passive grammar study for 2 hours when building real-time fluency.",
    question: "What is the main takeaway of the research?",
    options: [
      "Grammar study is completely useless.",
      "Short, consistent speaking practice builds fluency faster than long passive study.",
      "You must study for 2 hours daily to become fluent.",
      "Passive reading is better than speaking.",
    ],
    correctIndex: 1,
    weight: 2.5,
  },
  {
    id: "q9",
    level: "C1",
    skill: "grammar",
    question: "Not only _____ the deadline, but she also delivered a remarkably persuasive pitch.",
    options: [
      "she met",
      "did she meet",
      "she did meet",
      "had she meeting",
    ],
    correctIndex: 1,
    weight: 3,
  },
  {
    id: "q10",
    level: "C1",
    skill: "vocabulary",
    question: "The speaker's explanation was so _____ that even complex economic concepts felt effortless to grasp.",
    options: ["ambiguous", "lucid", "redundant", "tedious"],
    correctIndex: 1,
    weight: 3,
  },
  {
    id: "q11",
    level: "C2",
    skill: "vocabulary",
    question: "Despite the _____ of his remarks, the committee appreciated his candid assessment of the risks.",
    options: ["brevity", "redundancy", "complacency", "ambiguity"],
    correctIndex: 0,
    weight: 3.5,
  },
  {
    id: "q12",
    level: "C2",
    skill: "grammar",
    question: "Were the company _____ its global expansion earlier, it might have captured the emerging market.",
    options: [
      "to have initiated",
      "initiating",
      "initiated",
      "has initiated",
    ],
    correctIndex: 0,
    weight: 3.5,
  },
];

export interface AcademyProgress {
  cefrLevel: CefrLevel;
  placementCompleted: boolean;
  dailySpeakingGoalMins: number;
  learnedWordIds: string[];
  completedReadingIds: string[];
  completedListeningIds: string[];
  completedShadowingIds: string[];
  completedPronunciationIds: string[];
  dailyCompletedTaskIds: string[];
  dailyDateKey: string;
  scores: {
    fluency: number;
    pronunciation: number;
    vocabulary: number;
    grammar: number;
  };
}

const STORAGE_KEY = "justspeak_academy_progress_v1";

function getTodayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export function getDefaultAcademyProgress(): AcademyProgress {
  return {
    cefrLevel: "B1",
    placementCompleted: false,
    dailySpeakingGoalMins: 21,
    learnedWordIds: [],
    completedReadingIds: [],
    completedListeningIds: [],
    completedShadowingIds: [],
    completedPronunciationIds: [],
    dailyCompletedTaskIds: [],
    dailyDateKey: getTodayKey(),
    scores: {
      fluency: 68,
      pronunciation: 65,
      vocabulary: 70,
      grammar: 66,
    },
  };
}

export function getAcademyProgress(): AcademyProgress {
  if (typeof window === "undefined") return getDefaultAcademyProgress();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultAcademyProgress();
    const parsed = JSON.parse(raw) as Partial<AcademyProgress>;
    const today = getTodayKey();
    const sameDay = parsed.dailyDateKey === today;
    return {
      ...getDefaultAcademyProgress(),
      ...parsed,
      dailyCompletedTaskIds: sameDay ? parsed.dailyCompletedTaskIds || [] : [],
      dailyDateKey: today,
      scores: {
        ...getDefaultAcademyProgress().scores,
        ...(parsed.scores || {}),
      },
    };
  } catch {
    return getDefaultAcademyProgress();
  }
}

export function saveAcademyProgress(progress: AcademyProgress): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    window.dispatchEvent(new Event("justspeak-academy-updated"));
  } catch {}
}

export function setAcademyLevel(
  level: CefrLevel,
  placementCompleted = true,
  customScores?: Partial<AcademyProgress["scores"]>
): AcademyProgress {
  const current = getAcademyProgress();
  const meta = CEFR_LEVELS[level];
  const baseScoreByLevel: Record<CefrLevel, number> = {
    A1: 35,
    A2: 48,
    B1: 62,
    B2: 75,
    C1: 86,
    C2: 94,
  };
  const base = baseScoreByLevel[level];
  const updated: AcademyProgress = {
    ...current,
    cefrLevel: level,
    placementCompleted,
    dailySpeakingGoalMins: meta.dailySpeakingGoalMins,
    scores: {
      fluency: customScores?.fluency ?? base,
      pronunciation: customScores?.pronunciation ?? base,
      vocabulary: customScores?.vocabulary ?? base,
      grammar: customScores?.grammar ?? base,
    },
  };
  saveAcademyProgress(updated);
  return updated;
}

export function evaluatePlacementAnswers(answers: Record<string, number>): {
  level: CefrLevel;
  percentage: number;
  correctCount: number;
  totalCount: number;
  grammarScore: number;
  vocabularyScore: number;
  comprehensionScore: number;
} {
  let earnedWeight = 0;
  let totalWeight = 0;
  let correctCount = 0;

  const skillStats = {
    grammar: { earned: 0, total: 0 },
    vocabulary: { earned: 0, total: 0 },
    comprehension: { earned: 0, total: 0 },
  };

  for (const q of PLACEMENT_QUESTIONS) {
    totalWeight += q.weight;
    skillStats[q.skill].total += q.weight;
    if (answers[q.id] === q.correctIndex) {
      earnedWeight += q.weight;
      correctCount += 1;
      skillStats[q.skill].earned += q.weight;
    }
  }

  const percentage = Math.round((earnedWeight / totalWeight) * 100);
  let level: CefrLevel = "A1";
  if (percentage >= 90) level = "C2";
  else if (percentage >= 75) level = "C1";
  else if (percentage >= 58) level = "B2";
  else if (percentage >= 40) level = "B1";
  else if (percentage >= 22) level = "A2";
  else level = "A1";

  const grammarScore = Math.max(
    30,
    Math.round((skillStats.grammar.earned / (skillStats.grammar.total || 1)) * 100)
  );
  const vocabularyScore = Math.max(
    30,
    Math.round((skillStats.vocabulary.earned / (skillStats.vocabulary.total || 1)) * 100)
  );
  const comprehensionScore = Math.max(
    30,
    Math.round((skillStats.comprehension.earned / (skillStats.comprehension.total || 1)) * 100)
  );

  return {
    level,
    percentage,
    correctCount,
    totalCount: PLACEMENT_QUESTIONS.length,
    grammarScore,
    vocabularyScore,
    comprehensionScore,
  };
}

export function estimateIeltsBand(scores: AcademyProgress["scores"]): string {
  const avg =
    (scores.fluency + scores.pronunciation + scores.vocabulary + scores.grammar) / 4;
  if (avg >= 92) return "8.5";
  if (avg >= 85) return "8.0";
  if (avg >= 78) return "7.5";
  if (avg >= 72) return "7.0";
  if (avg >= 65) return "6.5";
  if (avg >= 58) return "6.0";
  if (avg >= 50) return "5.5";
  if (avg >= 42) return "5.0";
  if (avg >= 34) return "4.5";
  return "4.0";
}
