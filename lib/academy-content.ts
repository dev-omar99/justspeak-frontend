import { CefrLevel } from "./academy";

// ============================================================================
// 1. CEFR VOCABULARY VAULT (Oxford 3000 / 5000 & NGSL Aligned)
// ============================================================================
export interface VocabItem {
  id: string;
  word: string;
  level: CefrLevel;
  pos: string;
  ipa: string;
  meaningEn: string;
  meaningAr: string;
  example: string;
}

export const VOCAB_ITEMS: VocabItem[] = [
  // A1
  { id: "v-a1-1", word: "morning", level: "A1", pos: "noun", ipa: "/ˈmɔːrnɪŋ/", meaningEn: "The early part of the day before noon.", meaningAr: "الصباح", example: "I practice English every morning for ten minutes." },
  { id: "v-a1-2", word: "travel", level: "A1", pos: "verb", ipa: "/ˈtrævəl/", meaningEn: "To go from one place to another, especially over a distance.", meaningAr: "يسافر", example: "She loves to travel to new countries every summer." },
  { id: "v-a1-3", word: "friendly", level: "A1", pos: "adj", ipa: "/ˈfrendli/", meaningEn: "Kind and pleasant to other people.", meaningAr: "ودود / لطيف", example: "My speaking partner from Brazil was very friendly." },
  { id: "v-a1-4", word: "habit", level: "A1", pos: "noun", ipa: "/ˈhæbɪt/", meaningEn: "Something you do regularly, often without thinking.", meaningAr: "عادة يومية", example: "Reading one short story daily is a great habit." },
  { id: "v-a1-5", word: "listen", level: "A1", pos: "verb", ipa: "/ˈlɪsən/", meaningEn: "To pay attention to someone or something in order to hear them.", meaningAr: "يستمع", example: "Listen carefully to how native speakers connect words." },
  // A2
  { id: "v-a2-1", word: "improve", level: "A2", pos: "verb", ipa: "/ɪmˈpruːv/", meaningEn: "To become or make something better.", meaningAr: "يحسّن / يطوّر", example: "Daily conversations will quickly improve your fluency." },
  { id: "v-a2-2", word: "culture", level: "A2", pos: "noun", ipa: "/ˈkʌltʃər/", meaningEn: "The customs, arts, and social traditions of a group or country.", meaningAr: "ثقافة", example: "Talking with global learners teaches you about different cultures." },
  { id: "v-a2-3", word: "confident", level: "A2", pos: "adj", ipa: "/ˈkɒnfɪdənt/", meaningEn: "Feeling sure about your own ability to do things well.", meaningAr: "واثق من نفسه", example: "After two weeks of practice, I feel much more confident." },
  { id: "v-a2-4", word: "describe", level: "A2", pos: "verb", ipa: "/dɪˈskraɪb/", meaningEn: "To say what someone or something is like.", meaningAr: "يصف", example: "Can you describe your hometown in three sentences?" },
  { id: "v-a2-5", word: "schedule", level: "A2", pos: "noun", ipa: "/ˈskedʒuːl/", meaningEn: "A plan of activities or events and the times they will happen.", meaningAr: "جدول مواعيد", example: "I added a 15-minute speaking call to my daily schedule." },
  // B1
  { id: "v-b1-1", word: "overcome", level: "B1", pos: "verb", ipa: "/ˌoʊvərˈkʌm/", meaningEn: "To succeed in dealing with or controlling a problem or fear.", meaningAr: "يتغلب على", example: "The best way to overcome speaking anxiety is regular practice." },
  { id: "v-b1-2", word: "fluent", level: "B1", pos: "adj", ipa: "/ˈfluːənt/", meaningEn: "Able to speak or write a language easily and accurately.", meaningAr: "طلق اللسان / فصيح", example: "Consistency is the secret to becoming fluent in English." },
  { id: "v-b1-3", word: "perspective", level: "B1", pos: "noun", ipa: "/pərˈspektɪv/", meaningEn: "A particular attitude toward or way of regarding something.", meaningAr: "وجهة نظر / منظور", example: "Meeting people from abroad gives you a fresh perspective." },
  { id: "v-b1-4", word: "encourage", level: "B1", pos: "verb", ipa: "/ɪnˈkɜːrɪdʒ/", meaningEn: "To give someone support, confidence, or hope.", meaningAr: "يشجع", example: "Good partners always encourage each other to keep talking." },
  { id: "v-b1-5", word: "essential", level: "B1", pos: "adj", ipa: "/ɪˈsenʃəl/", meaningEn: "Completely necessary; extremely important.", meaningAr: "أساسي / ضروري للغاية", example: "Active listening is essential for natural conversations." },
  // B2
  { id: "v-b2-1", word: "spontaneous", level: "B2", pos: "adj", ipa: "/spɒnˈteɪniəs/", meaningEn: "Happening naturally without being planned in advance.", meaningAr: "عفوي / تلقائي", example: "Live calls train your brain for spontaneous real-world speech." },
  { id: "v-b2-2", word: "articulate", level: "B2", pos: "verb", ipa: "/ɑːrˈtɪkjuleɪt/", meaningEn: "To express an idea or feeling clearly and effectively.", meaningAr: "يعبّر بوضوح وفصاحة", example: "She can articulate complex technical ideas in simple English." },
  { id: "v-b2-3", word: "resilience", level: "B2", pos: "noun", ipa: "/rɪˈzɪliəns/", meaningEn: "The capacity to recover quickly from difficulties.", meaningAr: "المرونة / القدرة على التعافي", example: "Language learners build resilience by learning from every mistake." },
  { id: "v-b2-4", word: "persuasive", level: "B2", pos: "adj", ipa: "/pərˈsweɪsɪv/", meaningEn: "Good at convincing someone to do or believe something.", meaningAr: "مُقنع", example: "He gave a persuasive presentation during the job interview." },
  { id: "v-b2-5", word: "nuance", level: "B2", pos: "noun", ipa: "/ˈnjuːɑːns/", meaningEn: "A subtle difference in meaning, expression, or tone.", meaningAr: "فارق دقيق في المعنى", example: "Movie shadowing helps you catch the subtle nuance of tone." },
  // C1
  { id: "v-c1-1", word: "lucid", level: "C1", pos: "adj", ipa: "/ˈluːsɪd/", meaningEn: "Expressed clearly and easy to understand.", meaningAr: "واضح وسلس للغاية", example: "Her lucid explanation made the difficult topic effortless to follow." },
  { id: "v-c1-2", word: "eloquent", level: "C1", pos: "adj", ipa: "/ˈeləkwənt/", meaningEn: "Fluent, persuasive, and graceful in speaking or writing.", meaningAr: "بليغ / فصيح", example: "An eloquent speaker connects with both the mind and emotions." },
  { id: "v-c1-3", word: "pragmatic", level: "C1", pos: "adj", ipa: "/præɡˈmætɪk/", meaningEn: "Dealing with things sensibly and realistically.", meaningAr: "عملي / واقعي", example: "We need a pragmatic strategy to grow our speaking confidence." },
  { id: "v-c1-4", word: "ubiquitous", level: "C1", pos: "adj", ipa: "/juːˈbɪkwɪtəs/", meaningEn: "Present, appearing, or found everywhere.", meaningAr: "منتشر في كل مكان", example: "English has become ubiquitous in international business and tech." },
  // C2
  { id: "v-c2-1", word: "brevity", level: "C2", pos: "noun", ipa: "/ˈbrevəti/", meaningEn: "Concise and exact use of words in writing or speech.", meaningAr: "الإيجاز والبلاغة", example: "Great leaders value brevity when delivering executive updates." },
  { id: "v-c2-2", word: "candid", level: "C2", pos: "adj", ipa: "/ˈkændɪd/", meaningEn: "Truthful and straightforward; frank.", meaningAr: "صريح وواضح", example: "Thank you for your candid feedback on my pronunciation." },
  { id: "v-c2-3", word: "quintessential", level: "C2", pos: "adj", ipa: "/ˌkwɪntɪˈsenʃəl/", meaningEn: "Representing the most perfect or typical example of a quality.", meaningAr: "نموذجي / جوهر الشيء", example: "A rainy afternoon in a cozy bookshop is the quintessential London experience." },
];

// ============================================================================
// 2. GRADED READING PASSAGES (Linked with CEFR Vocabulary)
// ============================================================================
export interface ReadingPassage {
  id: string;
  level: CefrLevel;
  title: string;
  sourceLabel: string;
  readingTimeMins: number;
  targetWords: string[]; // Automatically highlighted from VOCAB_ITEMS
  paragraphs: string[];
  quiz: {
    question: string;
    options: string[];
    correctIndex: number;
  }[];
}

export const READING_PASSAGES: ReadingPassage[] = [
  {
    id: "r-a1-1",
    level: "A1",
    title: "A New Morning Habit",
    sourceLabel: "CEFR A1 Graded Reader",
    readingTimeMins: 2,
    targetWords: ["morning", "habit", "friendly", "listen", "travel"],
    paragraphs: [
      "Every morning, Omar wakes up at seven o'clock and makes a warm cup of tea. He has a simple new habit: he speaks English for ten minutes before he goes to work.",
      "At first, Omar was shy. Then he met a friendly partner online from Spain. They listen to each other carefully and talk about food, family, and plans to travel.",
      "After one month, Omar smiles when he speaks English. Small daily steps make big dreams possible.",
    ],
    quiz: [
      { question: "What is Omar's new morning habit?", options: ["Running for an hour", "Speaking English for ten minutes", "Watching TV at night", "Sleeping late"], correctIndex: 1 },
      { question: "Where is Omar's speaking partner from?", options: ["Japan", "Brazil", "Spain", "Canada"], correctIndex: 2 },
    ],
  },
  {
    id: "r-a2-1",
    level: "A2",
    title: "Exploring Cultures Through Conversation",
    sourceLabel: "CEFR A2 Graded Reader",
    readingTimeMins: 3,
    targetWords: ["improve", "culture", "confident", "describe", "schedule"],
    paragraphs: [
      "Many students want to improve their spoken English, yet they spend hours only reading grammar rules. When Sara added a 15-minute call to her daily schedule, everything changed.",
      "Each evening, she met someone from a different country. She learned how to describe her city, her favorite dishes, and her weekend plans.",
      "Exploring a new culture through real people made her much more confident. She realized that making small mistakes is simply part of learning.",
    ],
    quiz: [
      { question: "What did Sara add to her daily schedule?", options: ["A 15-minute speaking call", "A 3-hour grammar exam", "A cooking class", "A math lesson"], correctIndex: 0 },
      { question: "How did talking with people from other countries help Sara?", options: ["She stopped reading", "She became more confident", "She moved abroad", "She forgot grammar"], correctIndex: 1 },
    ],
  },
  {
    id: "r-b1-1",
    level: "B1",
    title: "How to Overcome Speaking Anxiety",
    sourceLabel: "Oxford-Style B1 Article",
    readingTimeMins: 4,
    targetWords: ["overcome", "fluent", "perspective", "encourage", "essential"],
    paragraphs: [
      "Almost every English learner knows the feeling: you understand what you read, yet your mind goes blank the moment you try to speak. To overcome this barrier, you need a safe environment where partners encourage you instead of judging you.",
      "Becoming fluent is not about memorizing a dictionary. Instead, it is essential to activate the words you already know in real-time dialogue.",
      "When you speak with global learners, you also gain a fresh perspective on life, work, and traditions across the globe. Within weeks, hesitation turns into natural flow.",
    ],
    quiz: [
      { question: "According to the passage, what is essential for fluency?", options: ["Memorizing the entire dictionary", "Activating words you know in real-time dialogue", "Never making a single mistake", "Studying silently alone"], correctIndex: 1 },
      { question: "What extra benefit comes from speaking with global learners?", options: ["Free flights", "A fresh perspective on life and traditions", "Faster typing speed", "Less homework"], correctIndex: 1 },
    ],
  },
  {
    id: "r-b2-1",
    level: "B2",
    title: "The Science of Spontaneous Fluency",
    sourceLabel: "Oxford-Style B2 Feature",
    readingTimeMins: 4,
    targetWords: ["spontaneous", "articulate", "resilience", "persuasive", "nuance"],
    paragraphs: [
      "Why can some professionals articulate complex ideas effortlessly during high-stakes meetings while others freeze? Psycholinguists point to the difference between rehearsed knowledge and spontaneous retrieval.",
      "When you engage in unscripted 7-minute conversations, your brain builds communicative resilience. You learn to pick up the subtle nuance in tone, pace, and phrasing that textbooks rarely capture.",
      "Over time, this daily workout transforms hesitant learners into persuasive communicators capable of thriving in international teams.",
    ],
    quiz: [
      { question: "What do unscripted 7-minute conversations build according to the text?", options: ["Communicative resilience", "Handwriting speed", "Memorization of dates", "Silent reading habits"], correctIndex: 0 },
      { question: "What do textbooks rarely capture?", options: ["Alphabet letters", "Subtle nuance in tone, pace, and phrasing", "Page numbers", "Verb tables"], correctIndex: 1 },
    ],
  },
  {
    id: "r-c1-1",
    level: "C1",
    title: "Why English Became Ubiquitous in Modern Innovation",
    sourceLabel: "CEFR C1 Academic Essay",
    readingTimeMins: 5,
    targetWords: ["lucid", "eloquent", "pragmatic", "ubiquitous", "brevity", "candid"],
    paragraphs: [
      "In today's interconnected economy, English has become ubiquitous across software engineering, scientific research, and global diplomacy. Adopting a pragmatic approach to mastery means prioritizing clarity over unnecessary complexity.",
      "The most eloquent speakers rarely rely on obscure jargon; instead, they deliver lucid arguments marked by brevity and candid insight. Whether pitching investors or mentoring peers, precision of expression remains an unmatched career multiplier.",
    ],
    quiz: [
      { question: "What do the most eloquent speakers prioritize?", options: ["Obscure jargon", "Lucid arguments marked by brevity", "Speaking as loudly as possible", "Avoiding feedback"], correctIndex: 1 },
    ],
  },
  {
    id: "r-c2-1",
    level: "C2",
    title: "The Quintessential Art of Candid Leadership",
    sourceLabel: "CEFR C2 Executive Editorial",
    readingTimeMins: 5,
    targetWords: ["quintessential", "candid", "brevity", "eloquent", "nuance"],
    paragraphs: [
      "What distinguishes a merely competent manager from a quintessential global leader? Often, it is the discipline of pairing candid honesty with refined emotional nuance.",
      "Rather than hiding behind vague corporate slogans, eloquent executives practice brevity: they name challenges plainly, invite dissenting viewpoints, and align multicultural teams around a lucid vision.",
    ],
    quiz: [
      { question: "How do eloquent executives communicate according to the editorial?", options: ["Through vague slogans", "With brevity, candid honesty, and clear vision", "By avoiding dissenting viewpoints", "By writing lengthy reports"], correctIndex: 1 },
    ],
  },
];

// ============================================================================
// 3. PRONUNCIATION LAB (Problematic Sounds + Minimal Pairs + Tongue Twisters)
// ============================================================================
export interface PronunciationDrill {
  id: string;
  soundPair: string;
  ipa: string;
  title: string;
  titleAr: string;
  tipEn: string;
  tipAr: string;
  minimalPairs: { wordA: string; ipaA: string; wordB: string; ipaB: string }[];
  practiceSentence: string;
}

export const PRONUNCIATION_DRILLS: PronunciationDrill[] = [
  {
    id: "p-th",
    soundPair: "TH (θ vs ð)",
    ipa: "/θ/ vs /ð/",
    title: "Mastering Voiceless & Voiced TH",
    titleAr: "إتقان حرفي TH (ث / ذ) بدلاً من S و Z",
    tipEn: "Gently place the tip of your tongue between your front teeth and blow air softly. Never replace TH with S or Z!",
    tipAr: "ضع طرف لسانك بلطف بين أسنانك الأمامية وأخرج الهواء. في think (ث) بدون اهتزاز للحنجرة، وفي this (ذ) مع اهتزاز خفيف.",
    minimalPairs: [
      { wordA: "think", ipaA: "/θɪŋk/", wordB: "sink", ipaB: "/sɪŋk/" },
      { wordA: "three", ipaA: "/θriː/", wordB: "tree", ipaB: "/triː/" },
      { wordA: "this", ipaA: "/ðɪs/", wordB: "dis", ipaB: "/dɪs/" },
      { wordA: "breathe", ipaA: "/briːð/", wordB: "breeze", ipaB: "/briːz/" },
    ],
    practiceSentence: "I think that these three things are worth thinking through.",
  },
  {
    id: "p-pb",
    soundPair: "P vs B",
    ipa: "/p/ vs /b/",
    title: "Aspirated P vs Voiced B",
    titleAr: "الفرق الحاسم بين P (بنفخة هواء) و B",
    tipEn: "Hold a piece of paper in front of your mouth: when you say P (park, pen, paper), a burst of air should push the paper!",
    tipAr: "عند نطق P (مثل park, people) يجب أن تخرج دفعة هواء قوية من الشفتين (Aspiration)؛ أما B فتُخرج صوتاً من الحنجرة دون دفعة هواء.",
    minimalPairs: [
      { wordA: "park", ipaA: "/pɑːrk/", wordB: "bark", ipaB: "/bɑːrk/" },
      { wordA: "pay", ipaA: "/peɪ/", wordB: "bay", ipaB: "/beɪ/" },
      { wordA: "cup", ipaA: "/kʌp/", wordB: "cub", ipaB: "/kʌb/" },
      { wordA: "pat", ipaA: "/pæt/", wordB: "bat", ipaB: "/bæt/" },
    ],
    practiceSentence: "Please put the purple paper back in the big brown bag.",
  },
  {
    id: "p-rl",
    soundPair: "R vs L",
    ipa: "/r/ vs /l/",
    title: "American/British R vs Clear L",
    titleAr: "التمييز الدقيق بين R (بدون لمس سقف الفم) و L",
    tipEn: "For L, your tongue tip touches the ridge behind your top teeth. For English R, curl your tongue back slightly without touching the roof of your mouth.",
    tipAr: "في L يلمس طرف اللسان اللثة خلف الأسنان العليا. أما في R الإنجليزية فيرتفع اللسان للخلف قليلاً دون أن يلمس سقف الفم أبداً.",
    minimalPairs: [
      { wordA: "right", ipaA: "/raɪt/", wordB: "light", ipaB: "/laɪt/" },
      { wordA: "pray", ipaA: "/preɪ/", wordB: "play", ipaB: "/pleɪ/" },
      { wordA: "grass", ipaA: "/ɡræs/", wordB: "glass", ipaB: "/ɡlæs/" },
      { wordA: "read", ipaA: "/riːd/", wordB: "lead", ipaB: "/liːd/" },
    ],
    practiceSentence: "Larry really likes reading bright red letters late at night.",
  },
  {
    id: "p-vf",
    soundPair: "V vs F",
    ipa: "/v/ vs /f/",
    title: "Voiced V vs Voiceless F",
    titleAr: "إتقان حرف V بالاهتزاز مقابل F",
    tipEn: "Place your top teeth lightly on your bottom lip. For F, just blow air. For V, turn your voice box ON so your lip vibrates.",
    tipAr: "ضع أسنانك العليا برفق على شفتك السفلى. في F يخرج هواء فقط، وفي V شغّل صوت الحنجرة لتشعر باهتزاز واضح في الشفة.",
    minimalPairs: [
      { wordA: "very", ipaA: "/ˈveri/", wordB: "ferry", ipaB: "/ˈferi/" },
      { wordA: "van", ipaA: "/væn/", wordB: "fan", ipaB: "/fæn/" },
      { wordA: "save", ipaA: "/seɪv/", wordB: "safe", ipaB: "/seɪf/" },
      { wordA: "vine", ipaA: "/vaɪn/", wordB: "fine", ipaB: "/faɪn/" },
    ],
    practiceSentence: "Five very fine vans drove past the peaceful village.",
  },
  {
    id: "p-vowels",
    soundPair: "ɪ vs iː",
    ipa: "/ɪ/ vs /iː/",
    title: "Short I (ship) vs Long EE (sheep)",
    titleAr: "الفرق بين الكسرة القصيرة (ship) والطويلة (sheep)",
    tipEn: "Smile wide and hold the sound longer for /iː/ (sheep, leave). Keep your mouth relaxed and quick for /ɪ/ (ship, live).",
    tipAr: "في الصوت الطويل (sheep, leave) ابتسم ومد الصوت بوضوح. في القصير (ship, live) اجعل الفم مرتخياً والصوت سريعاً وخفيفاً.",
    minimalPairs: [
      { wordA: "ship", ipaA: "/ʃɪp/", wordB: "sheep", ipaB: "/ʃiːp/" },
      { wordA: "live", ipaA: "/lɪv/", wordB: "leave", ipaB: "/liːv/" },
      { wordA: "sit", ipaA: "/sɪt/", wordB: "seat", ipaB: "/siːt/" },
      { wordA: "fill", ipaA: "/fɪl/", wordB: "feel", ipaB: "/fiːl/" },
    ],
    practiceSentence: "Please sit in this seat before the big ship leaves.",
  },
];

export interface TongueTwister {
  id: string;
  targetSound: string;
  difficulty: "Easy" | "Medium" | "Hard";
  text: string;
  tipAr: string;
}

export const TONGUE_TWISTERS: TongueTwister[] = [
  {
    id: "tt-1",
    targetSound: "P / B",
    difficulty: "Medium",
    text: "Peter Piper picked a peck of pickled peppers.",
    tipAr: "ركّز على نفخة الهواء في كل حرف P!",
  },
  {
    id: "tt-2",
    targetSound: "S / SH",
    difficulty: "Medium",
    text: "She sells seashells by the seashore.",
    tipAr: "فرّق بوضوح بين صوت SH (ش) و S (س).",
  },
  {
    id: "tt-3",
    targetSound: "TH",
    difficulty: "Hard",
    text: "Thirty-three thousand feathers on a thrush's throat.",
    tipAr: "أخرج طرف لسانك في كل TH بثبات وهدوء.",
  },
  {
    id: "tt-4",
    targetSound: "R / L",
    difficulty: "Hard",
    text: "Red lorry yellow lorry red lorry yellow lorry.",
    tipAr: "ابدأ ببطء ثم زِد السرعة تدريجياً مع الفصل بين R و L.",
  },
];

// ============================================================================
// 4. INTERACTIVE AUTO-PAUSE SHADOWING CLIPS (YouTube Official Embeds)
// ============================================================================
export interface ShadowingLine {
  id: string;
  start: number; // seconds
  end: number;   // seconds
  speaker: string;
  text: string;
  translationAr: string;
}

export interface ShadowingClip {
  id: string;
  title: string;
  source: string;
  level: CefrLevel;
  youtubeId: string;
  description: string;
  lines: ShadowingLine[];
}

export const SHADOWING_CLIPS: ShadowingClip[] = [
  {
    id: "sh-1",
    title: "The Pursuit of Happyness — Protect Your Dream",
    source: "Classic Cinema Dialogue",
    level: "B1",
    youtubeId: "UZb2NOHPA2A",
    description: "Iconic motivational dialogue — slow, emotional pacing ideal for natural rhythm and intonation shadowing.",
    lines: [
      { id: "l1", start: 68, end: 73, speaker: "Chris", text: "Don't ever let somebody tell you you can't do something.", translationAr: "لا تدع أحداً يخبرك أبداً أنك لا تستطيع فعل شيء ما." },
      { id: "l2", start: 74, end: 78, speaker: "Chris", text: "Not even me. All right?", translationAr: "ولا حتى أنا. حسناً؟" },
      { id: "l3", start: 80, end: 85, speaker: "Chris", text: "You got a dream, you gotta protect it.", translationAr: "إذا كان لديك حلم، عليك أن تحميه." },
      { id: "l4", start: 86, end: 93, speaker: "Chris", text: "People can't do something themselves, they wanna tell you you can't do it.", translationAr: "الناس حين يعجزون عن فعل شيء بأنفسهم، يريدون إخبارك أنك لا تستطيع فعله." },
      { id: "l5", start: 94, end: 98, speaker: "Chris", text: "If you want something, go get it. Period.", translationAr: "إذا أردت شيئاً، اذهب واحصل عليه. انتهى." },
    ],
  },
  {
    id: "sh-2",
    title: "Steve Jobs — Stay Hungry, Stay Foolish (Stanford)",
    source: "Stanford Official Commencement Speech",
    level: "B2",
    youtubeId: "UF8uR6Z6KLc",
    description: "Crystal-clear American pronunciation and executive pausing — gold standard for B2/C1 shadowing.",
    lines: [
      { id: "s1", start: 816, end: 822, speaker: "Steve Jobs", text: "Your time is limited, so don't waste it living someone else's life.", translationAr: "وقتك محدود، لذا لا تضيعه في عيش حياة شخص آخر." },
      { id: "s2", start: 823, end: 830, speaker: "Steve Jobs", text: "Don't let the noise of others' opinions drown out your own inner voice.", translationAr: "لا تدع ضجيج آراء الآخرين يطغى على صوتك الداخلي." },
      { id: "s3", start: 831, end: 838, speaker: "Steve Jobs", text: "And most important, have the courage to follow your heart and intuition.", translationAr: "والأهم من ذلك، تحلّ بالشجاعة لتتبع قلبك وحدسك." },
    ],
  },
  {
    id: "sh-3",
    title: "Everyday Natural Coffee Shop & Travel Phrases",
    source: "BBC Learning English Style",
    level: "A2",
    youtubeId: "f1b3f0c2e6Q",
    description: "Short, practical everyday sentences with clear articulation — perfect for A1/A2 learners (also supports built-in native voice mode).",
    lines: [
      { id: "a1", start: 0, end: 4, speaker: "Barista", text: "Good morning! What can I get started for you today?", translationAr: "صباح الخير! ماذا تحب أن أجهز لك اليوم؟" },
      { id: "a2", start: 4, end: 8, speaker: "Customer", text: "Hi, could I please have a medium iced latte with oat milk?", translationAr: "مرحباً، هل يمكنني الحصول على لاتيه مثلج متوسط بحليب الشوفان من فضلك؟" },
      { id: "a3", start: 8, end: 12, speaker: "Barista", text: "Sure thing! Would you like anything to eat with that?", translationAr: "بكل تأكيد! هل تود أي شيء للأكل معه؟" },
      { id: "a4", start: 12, end: 16, speaker: "Customer", text: "No thank you, that will be all for now.", translationAr: "لا شكراً لك، هذا كل شيء حالياً." },
    ],
  },
];

// ============================================================================
// 5. GRADED AUDIOBOOKS & LISTENING STORIES (Public Domain / Classic Adapted)
// ============================================================================
export interface ListeningStory {
  id: string;
  title: string;
  author: string;
  sourceLabel: string;
  level: CefrLevel;
  durationLabel: string;
  coverEmoji: string;
  summary: string;
  segments: {
    text: string;
    translationAr: string;
  }[];
  comprehensionQuestion: {
    question: string;
    options: string[];
    correctIndex: number;
  };
}

export const LISTENING_STORIES: ListeningStory[] = [
  {
    id: "l-a1-1",
    title: "The Fisherman and the Golden Fish",
    author: "Classic Folk Tale (Graded A1)",
    sourceLabel: "Public Domain Graded Audio",
    level: "A1",
    durationLabel: "2 min",
    coverEmoji: "🐟",
    summary: "A gentle, clear classic story told in simple present and past tense for beginner listening.",
    segments: [
      { text: "An old fisherman lived in a small wooden house near the blue sea.", translationAr: "عاش صياد عجوز في بيت خشبي صغير قرب البحر الأزرق." },
      { text: "Every morning, he took his boat and threw his net into the water.", translationAr: "كل صباح، كان يأخذ قاربه ويرمي شبكته في الماء." },
      { text: "One sunny day, he caught a tiny golden fish that could speak!", translationAr: "في يوم مشمس، اصطاد سمكة ذهبية صغيرة تستطيع الكلام!" },
      { text: "Please let me go, kind man, said the fish, and I will grant you one wish.", translationAr: "قالَت السمكة: أرجوك أطلق سراحي أيها الرجل الطيب، وسأحقق لك أمنية واحدة." },
      { text: "The fisherman smiled and gently put the golden fish back into the ocean.", translationAr: "ابتسم الصياد وأعاد السمكة الذهبية بلطف إلى المحيط." },
    ],
    comprehensionQuestion: {
      question: "What did the fisherman do with the golden fish?",
      options: ["He cooked it for dinner", "He gently put it back into the ocean", "He sold it at the market", "He kept it in a glass bowl"],
      correctIndex: 1,
    },
  },
  {
    id: "l-a2-1",
    title: "Around the World in Eighty Days — A Bold Wager",
    author: "Jules Verne (Graded A2 Adaptation)",
    sourceLabel: "Project Gutenberg Classic • A2",
    level: "A2",
    durationLabel: "2 min",
    coverEmoji: "🌍",
    summary: "Phileas Fogg decides to travel around the entire world in eighty days — clear elementary storytelling.",
    segments: [
      { text: "Phileas Fogg lived in London and followed the exact same daily schedule every single day.", translationAr: "عاش فيلياس فوج في لندن واتّبع نفس الجدول اليومي بالضبط كل يوم." },
      { text: "One evening at his club, his friends read an article saying you could travel around the world in eighty days.", translationAr: "في إحدى الأمسيات بناديه، قرأ أصدقاؤه مقالاً يقول إنه يمكن السفر حول العالم في ثمانين يوماً." },
      { text: "That is impossible! his friends laughed, because trains and ships are often late.", translationAr: "ضحك أصدقاؤه: هذا مستحيل! لأن القطارات والسفن غالباً ما تتأخر." },
      { text: "I will prove it is possible, said Fogg calmly, and he packed a small bag that very night.", translationAr: "قال فوج بهدوء: سأثبت أن ذلك ممكن، وحزم حقيبة صغيرة في تلك الليلة بالذات." },
    ],
    comprehensionQuestion: {
      question: "Why did Fogg's friends think the trip was impossible?",
      options: ["Maps were missing", "Trains and ships are often late", "He had no passport", "It was winter"],
      correctIndex: 1,
    },
  },
  {
    id: "l-b1-1",
    title: "Alice's Adventures in Wonderland — Down the Rabbit-Hole",
    author: "Lewis Carroll (LibriVox / Gutenberg Adapted)",
    sourceLabel: "Project Gutenberg Classic • B1",
    level: "B1",
    durationLabel: "3 min",
    coverEmoji: "🐇",
    summary: "The iconic opening chapter of Alice in Wonderland adapted for clear intermediate listening and rhythm.",
    segments: [
      { text: "Alice was beginning to get very tired of sitting by her sister on the riverbank and having nothing to do.", translationAr: "بدأت أليس تشعر بالملل الشديد من الجلوس بجانب أختها على ضفة النهر دون فعل أي شيء." },
      { text: "Suddenly, a White Rabbit with pink eyes ran close by her.", translationAr: "وفجأة، ركض أرنب أبيض ذو عينين ورديتين بالقرب منها." },
      { text: "There was nothing so very remarkable in that, until the Rabbit actually took a watch out of its waistcoat pocket.", translationAr: "لم يكن في ذلك شيء غريب جداً، حتى أخرج الأرنب ساعة بالفعل من جيب سترته." },
      { text: "Oh dear! Oh dear! I shall be too late! the Rabbit cried as it hurried across the field.", translationAr: "يا إلهي! سأتأخر كثيراً! صاح الأرنب وهو يسرع عبر الحقل." },
      { text: "Burning with curiosity, Alice jumped to her feet and ran across the field right after it.", translationAr: "واشتعل الفضول في قلب أليس، فقفزت على قدميها وركضت خلفه مباشرة عبر الحقل." },
    ],
    comprehensionQuestion: {
      question: "What surprised Alice most about the White Rabbit?",
      options: ["It was wearing sunglasses", "It took a watch out of its pocket and spoke", "It was swimming in the river", "It was reading a book"],
      correctIndex: 1,
    },
  },
  {
    id: "l-b2-1",
    title: "The Adventures of Sherlock Holmes — A Scandal in Bohemia",
    author: "Arthur Conan Doyle (Project Gutenberg)",
    sourceLabel: "Project Gutenberg Classic • B2/C1",
    level: "B2",
    durationLabel: "3 min",
    coverEmoji: "🕵️‍♂️",
    summary: "Sharpen upper-intermediate listening with Sherlock Holmes' legendary observation method.",
    segments: [
      { text: "You see, Watson, but you do not observe. The distinction is clear.", translationAr: "أنت ترى يا واتسون، لكنك لا تلاحظ. الفرق واضح تماماً." },
      { text: "For example, you have frequently seen the steps which lead up from the hall to this room.", translationAr: "على سبيل المثال، لقد رأيت مراراً الدرجات التي تصعد من الردهة إلى هذه الغرفة." },
      { text: "How many steps are there? I asked, realizing I had never truly counted them.", translationAr: "كم عدد الدرجات؟ سألتُ، مدركاً أنني لم أعدّها حقاً من قبل." },
      { text: "There are seventeen steps, Holmes replied calmly, because I have both seen and observed.", translationAr: "أجاب هولمز بهدوء: هناك سبع عشرة درجة، لأنني رأيتُ ولاحظتُ معاً." },
    ],
    comprehensionQuestion: {
      question: "What distinction does Sherlock Holmes emphasize to Watson?",
      options: ["Reading vs writing", "Seeing vs truly observing", "Running vs walking", "Speaking vs shouting"],
      correctIndex: 1,
    },
  },
  {
    id: "l-c1-1",
    title: "The Great Gatsby — Echoes Across the Bay",
    author: "F. Scott Fitzgerald (Public Domain Classic)",
    sourceLabel: "Project Gutenberg Classic • C1",
    level: "C1",
    durationLabel: "3 min",
    coverEmoji: "✨",
    summary: "Rich descriptive prose ideal for C1 listening nuance, cadence, and literary vocabulary.",
    segments: [
      { text: "In my younger and more vulnerable years my father gave me some advice that I've been turning over in my mind ever since.", translationAr: "في سنوات شبابي الأكثر حساسية، أعطاني والدي نصيحة ما زلت أتفكر فيها منذ ذلك الحين." },
      { text: "Whenever you feel like criticizing anyone, he told me, just remember that all the people in this world haven't had the advantages that you've had.", translationAr: "قال لي: كلما شعرت برغبة في انتقاد أي شخص، تذكر فقط أن ليس كل الناس في هذا العالم قد حظوا بالمزايا التي حظيتَ بها." },
      { text: "In consequence, I'm inclined to reserve all judgments, a habit that has opened up many curious natures to me.", translationAr: "ونتيجة لذلك، أميل إلى التحفظ عن إصدار الأحكام، وهي عادة كشفت لي عن شخصيات كثيرة مثيرة للفضول." },
    ],
    comprehensionQuestion: {
      question: "What habit did the narrator develop from his father's advice?",
      options: ["Traveling every winter", "Reserving judgments about other people", "Writing daily newspapers", "Collecting antique clocks"],
      correctIndex: 1,
    },
  },
  {
    id: "l-c2-1",
    title: "Pride and Prejudice — First Impressions",
    author: "Jane Austen (Public Domain Classic)",
    sourceLabel: "Project Gutenberg Classic • C2",
    level: "C2",
    durationLabel: "3 min",
    coverEmoji: "📜",
    summary: "Master subtle British irony, sophisticated syntax, and C2 rhetorical precision.",
    segments: [
      { text: "It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife.", translationAr: "إنها حقيقة معترف بها عالمياً، أن الرجل الأعزب الذي يمتلك ثروة طيبة لا بد أنه يبحث عن زوجة." },
      { text: "However little known the feelings or views of such a man may be on his first entering a neighbourhood, this truth is so well fixed in the minds of the surrounding families.", translationAr: "مهما كانت مشاعر أو آراء هذا الرجل غير معروفة عند دخوله الحي لأول مرة، فإن هذه الحقيقة راسخة تماماً في أذهان العائلات المحيطة." },
      { text: "My dear Mr. Bennet, said his lady to him one day, have you heard that Netherfield Park is let at last?", translationAr: "قالت له زوجته يوماً: عزيزي السيد بينيت، هل سمعت أن نذرفيلد بارك قد أُجِّر أخيراً؟" },
    ],
    comprehensionQuestion: {
      question: "What literary tone is Jane Austen famously using in the opening sentence?",
      options: ["Technical instruction", "Witty social irony", "Horror suspense", "Scientific reporting"],
      correctIndex: 1,
    },
  },
];
