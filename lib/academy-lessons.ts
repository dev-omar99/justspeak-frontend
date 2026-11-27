import { CefrLevel } from "./academy";
import { VocabItem } from "./academy-content";

export interface StructuredLesson {
  id: string;
  level: CefrLevel;
  unitNumber: number;
  title: string;
  titleAr: string;
  durationMins: number;
  objective: string;
  objectiveAr: string;
  sourceRef: string;
  vocabulary: VocabItem[];
  listening: {
    title: string;
    context: string;
    lines: { speaker: string; text: string; translationAr: string }[];
  };
  reading: {
    title: string;
    paragraphs: string[];
    quiz: {
      question: string;
      options: string[];
      correctIndex: number;
    }[];
  };
  pronunciation: {
    focusSound: string;
    tipEn: string;
    tipAr: string;
    shadowSentence: string;
  };
  speakingMission: {
    promptEn: string;
    promptAr: string;
    targetMinutes: number;
    keyPhrases: string[];
  };
}

export const STRUCTURED_LESSONS: StructuredLesson[] = [
  // =========================================================================
  // LEVEL A1 — BEGINNER (2 Complete Lessons • 12 Oxford 3000 Core Words)
  // =========================================================================
  {
    id: "a1-lesson-1",
    level: "A1",
    unitNumber: 1,
    title: "Meeting People & Daily Routines",
    titleAr: "التعارف والروتين اليومي",
    durationMins: 12,
    objective: "Introduce yourself naturally, describe your morning routine, and ask simple friendly questions.",
    objectiveAr: "عرّف بنفسك بطبيعية، وتحدث عن روتينك الصباحي، واطرح أسئلة تعارف بسيطة.",
    sourceRef: "CEFR A1 • Unit 1",
    vocabulary: [
      { id: "l-a1-1-1", word: "morning", level: "A1", pos: "noun", ipa: "/ˈmɔːrnɪŋ/", meaningEn: "The early part of the day before noon.", meaningAr: "الصباح", example: "Good morning! How are you today?" },
      { id: "l-a1-1-2", word: "friendly", level: "A1", pos: "adj", ipa: "/ˈfrendli/", meaningEn: "Kind, warm, and pleasant to others.", meaningAr: "ودود / لطيف", example: "Everyone in my English group is very friendly." },
      { id: "l-a1-1-3", word: "routine", level: "A1", pos: "noun", ipa: "/ruːˈtiːn/", meaningEn: "The usual order of things you do every day.", meaningAr: "روتين يومي", example: "Speaking for ten minutes is part of my morning routine." },
      { id: "l-a1-1-4", word: "listen", level: "A1", pos: "verb", ipa: "/ˈlɪsən/", meaningEn: "To pay attention with your ears to hear clearly.", meaningAr: "يستمع", example: "I listen to simple English stories on the bus." },
      { id: "l-a1-1-5", word: "practice", level: "A1", pos: "verb", ipa: "/ˈpræktɪs/", meaningEn: "To do something regularly so you become better at it.", meaningAr: "يتدرّب / يمارس", example: "We practice speaking English every evening." },
      { id: "l-a1-1-6", word: "together", level: "A1", pos: "adv", ipa: "/təˈɡeðər/", meaningEn: "With each other in the same place or call.", meaningAr: "معاً / سوياً", example: "Let's learn new words together today." },
    ],
    listening: {
      title: "First Hello in a Live Call",
      context: "Omar from Egypt meets Sofia from Spain for the first time.",
      lines: [
        { speaker: "Sofia", text: "Good morning! My name is Sofia. Nice to meet you.", translationAr: "صباح الخير! اسمي صوفيا. تشرفت بلقائك." },
        { speaker: "Omar", text: "Hi Sofia! I'm Omar from Cairo. You sound very friendly.", translationAr: "أهلاً صوفيا! أنا عمر من القاهرة. تبدين ودودة جداً." },
        { speaker: "Sofia", text: "Thank you! What is your daily routine for learning English?", translationAr: "شكراً لك! ما هو روتينك اليومي لتعلم الإنجليزية؟" },
        { speaker: "Omar", text: "I listen to one short story and practice speaking for ten minutes.", translationAr: "أستمع لقصة قصيرة واحدة وأتدرب على التحدث لعشر دقائق." },
        { speaker: "Sofia", text: "That's a great routine! Let's practice together right now.", translationAr: "هذا روتين رائع! لنتدرب معاً الآن." },
      ],
    },
    reading: {
      title: "Ten Minutes Every Morning",
      paragraphs: [
        "Every morning, Nadia wakes up early and makes a cup of tea. She has a simple routine that helps her learn English without stress.",
        "First, she likes to listen to a short story for three minutes. Then she joins a friendly partner online so they can practice speaking together.",
        "Nadia knows that ten minutes every day is much better than two hours once a month. Small steps build real confidence.",
      ],
      quiz: [
        { question: "What does Nadia do first in her morning routine?", options: ["She goes shopping", "She listens to a short story", "She writes a long book", "She sleeps again"], correctIndex: 1 },
        { question: "Why does Nadia speak for ten minutes every day?", options: ["Because small daily steps build confidence", "Because she has a test tomorrow", "Because her teacher told her to stop", "Because she dislikes tea"], correctIndex: 0 },
      ],
    },
    pronunciation: {
      focusSound: "P vs B (/p/ vs /b/)",
      tipEn: "Push a clear puff of air out of your lips when saying 'practice' and 'partner' so P never sounds like B.",
      tipAr: "أخرج نفخة هواء واضحة عند نطق حرف P في كلمتي practice و partner حتى لا يبدو مثل B.",
      shadowSentence: "Please practice speaking with a friendly partner every morning.",
    },
    speakingMission: {
      promptEn: "Introduce yourself to a real partner: share your name, city, and one thing in your morning routine.",
      promptAr: "عرّف بنفسك لشريك حقيقي: اذكر اسمك، مدينتك، وشيئاً واحداً في روتينك الصباحي.",
      targetMinutes: 7,
      keyPhrases: ["Good morning, my name is...", "My daily routine is...", "I like to practice together."],
    },
  },
  {
    id: "a1-lesson-2",
    level: "A1",
    unitNumber: 2,
    title: "Food, Cafés & Polite Ordering",
    titleAr: "الطعام والمقاهي والطلب بأدب",
    durationMins: 12,
    objective: "Order food and drinks politely, talk about favorite dishes, and ask simple questions in a café.",
    objectiveAr: "اطلب الطعام والمشروبات بأدب وتحدث عن أطباقك المفضلة في المقهى والمطعم.",
    sourceRef: "CEFR A1 • Unit 2",
    vocabulary: [
      { id: "l-a1-2-1", word: "menu", level: "A1", pos: "noun", ipa: "/ˈmenjuː/", meaningEn: "A list of food and drinks you can order.", meaningAr: "قائمة الطعام", example: "Could I see the menu, please?" },
      { id: "l-a1-2-2", word: "delicious", level: "A1", pos: "adj", ipa: "/dɪˈlɪʃəs/", meaningEn: "Having a very pleasant taste.", meaningAr: "لذيذ جداً", example: "Egyptian koshari is really delicious." },
      { id: "l-a1-2-3", word: "order", level: "A1", pos: "verb", ipa: "/ˈɔːrdər/", meaningEn: "To ask for food or drinks in a restaurant or café.", meaningAr: "يطلب (طعاماً)", example: "I would like to order a hot coffee." },
      { id: "l-a1-2-4", word: "favorite", level: "A1", pos: "adj", ipa: "/ˈfeɪvərɪt/", meaningEn: "Liked more than any other of the same kind.", meaningAr: "مفضّل", example: "What is your favorite dish from your country?" },
      { id: "l-a1-2-5", word: "fresh", level: "A1", pos: "adj", ipa: "/freʃ/", meaningEn: "Recently made, picked, or cooked; not old.", meaningAr: "طازج", example: "This café serves fresh orange juice every day." },
      { id: "l-a1-2-6", word: "table", level: "A1", pos: "noun", ipa: "/ˈteɪbəl/", meaningEn: "A piece of furniture where people sit to eat.", meaningAr: "طاولة", example: "We found a quiet table near the window." },
    ],
    listening: {
      title: "Ordering at a Sunny Café",
      context: "Adam orders breakfast at a small local café.",
      lines: [
        { speaker: "Waiter", text: "Welcome! Here is a table by the window and the menu.", translationAr: "أهلاً بك! إليك طاولة بجانب النافذة وقائمة الطعام." },
        { speaker: "Adam", text: "Thank you! I would like to order fresh orange juice and a cheese sandwich.", translationAr: "شكراً! أود أن أطلب عصير برتقال طازج وساندويتش جبن." },
        { speaker: "Waiter", text: "Great choice! Our warm bread is very delicious today.", translationAr: "اختيار رائع! خبزنا الدافئ لذيذ جداً اليوم." },
        { speaker: "Adam", text: "Wonderful! That is my favorite breakfast.", translationAr: "رائع! هذا هو فطوري المفضل." },
      ],
    },
    reading: {
      title: "The Corner Café",
      paragraphs: [
        "On Saturday mornings, Karim walks to a small café near his home. He sits at a wooden table by the window and reads the menu.",
        "He always likes to order fresh mint tea and warm bread with honey. For Karim, this simple breakfast is delicious and makes him feel happy.",
        "Sometimes he chats with travelers from other cities and asks them about their favorite local food.",
      ],
      quiz: [
        { question: "What does Karim usually order at the café?", options: ["Cold pizza", "Fresh mint tea and warm bread with honey", "Ice cream", "Fish soup"], correctIndex: 1 },
        { question: "Where does Karim sit?", options: ["Outside in the rain", "At a wooden table by the window", "In the kitchen", "In his car"], correctIndex: 1 },
      ],
    },
    pronunciation: {
      focusSound: "Short I vs Long EE (/ɪ/ vs /iː/)",
      tipEn: "Keep 'delicious' crisp and smile longer on the 'ee' sound in 'tea' and 'please'.",
      tipAr: "مدّ الصوت بابتسامة خفيفة في tea و please، واجعل الصوت خفيفاً وسريعاً في dish و sit.",
      shadowSentence: "Could I please order fresh tea and a delicious dish?",
    },
    speakingMission: {
      promptEn: "Describe your favorite meal from your country to a partner and ask what they love to eat.",
      promptAr: "صِف وجبتك المفضلة في بلدك لشريكك واسأله عن طعامه المفضل.",
      targetMinutes: 7,
      keyPhrases: ["My favorite dish is...", "It tastes really delicious.", "When I go to a café, I usually order..."],
    },
  },

  // =========================================================================
  // LEVEL A2 — ELEMENTARY (2 Complete Lessons • 12 Oxford 3000 Words)
  // =========================================================================
  {
    id: "a2-lesson-1",
    level: "A2",
    unitNumber: 1,
    title: "Travel Plans & Airport Conversations",
    titleAr: "خطط السفر ومحادثات المطار",
    durationMins: 14,
    objective: "Talk about past trips and future travel plans, check in at airports, and ask for directions.",
    objectiveAr: "تحدث عن رحلاتك السابقة وخطط سفرك القادمة وتعامل بثقة في المطار.",
    sourceRef: "CEFR A2 • Unit 1",
    vocabulary: [
      { id: "l-a2-1-1", word: "destination", level: "A2", pos: "noun", ipa: "/ˌdestɪˈneɪʃən/", meaningEn: "The place to which someone is going.", meaningAr: "وجهة السفر", example: "Istanbul is a popular destination for travelers." },
      { id: "l-a2-1-2", word: "luggage", level: "A2", pos: "noun", ipa: "/ˈlʌɡɪdʒ/", meaningEn: "Suitcases and bags you carry when traveling.", meaningAr: "أمتعة السفر", example: "Please keep your hand luggage close to you." },
      { id: "l-a2-1-3", word: "schedule", level: "A2", pos: "noun", ipa: "/ˈskedʒuːl/", meaningEn: "A plan of times when flights or events happen.", meaningAr: "جدول مواعيد", example: "Our flight is right on schedule." },
      { id: "l-a2-1-4", word: "explore", level: "A2", pos: "verb", ipa: "/ɪkˈsplɔːr/", meaningEn: "To travel around a new place to learn about it.", meaningAr: "يستكشف", example: "We walked for hours to explore the old city." },
      { id: "l-a2-1-5", word: "culture", level: "A2", pos: "noun", ipa: "/ˈkʌltʃər/", meaningEn: "The traditions, food, and lifestyle of a country.", meaningAr: "ثقافة", example: "Traveling helps you understand another culture." },
      { id: "l-a2-1-6", word: "confident", level: "A2", pos: "adj", ipa: "/ˈkɒnfɪdənt/", meaningEn: "Feeling sure about your ability to succeed.", meaningAr: "واثق من نفسه", example: "She felt confident speaking English at the hotel." },
    ],
    listening: {
      title: "Checking In for a Dream Trip",
      context: "Youssef checks in at the airport counter for a trip to Rome.",
      lines: [
        { speaker: "Agent", text: "Good afternoon! May I see your passport and luggage, please?", translationAr: "مساء الخير! هل يمكنني رؤية جواز سفرك وأمتعتك من فضلك؟" },
        { speaker: "Youssef", text: "Sure, here you go. Is the flight to Rome on schedule?", translationAr: "بالتأكيد، تفضل. هل الرحلة إلى روما في موعدها؟" },
        { speaker: "Agent", text: "Yes, boarding starts at gate twelve. Is Rome your final destination?", translationAr: "نعم، الصعود يبدأ من البوابة 12. هل روما هي وجهتك النهائية؟" },
        { speaker: "Youssef", text: "Yes! I can't wait to explore the museums and learn about Italian culture.", translationAr: "نعم! لا أطيق الانتظار لاستكشاف المتاحف والتعرف على الثقافة الإيطالية." },
      ],
    },
    reading: {
      title: "A Weekend That Changed Everything",
      paragraphs: [
        "Last spring, Lina packed her small luggage and flew to her dream destination: Lisbon. Before the trip, she was worried about speaking English with strangers.",
        "On her first day, she checked the train schedule and went to explore the historic streets. People were warm and patient, and she loved discovering the local culture.",
        "By the end of the weekend, Lina felt much more confident. She realized that real travel is the best classroom in the world.",
      ],
      quiz: [
        { question: "What was Lina worried about before her trip?", options: ["Losing her shoes", "Speaking English with strangers", "Cold weather", "Missing breakfast"], correctIndex: 1 },
        { question: "How did Lina feel by the end of the weekend?", options: ["Much more confident", "Very bored", "Ready to quit English", "Angry at the train"], correctIndex: 0 },
      ],
    },
    pronunciation: {
      focusSound: "TH (/θ/ vs /ð/)",
      tipEn: "Put your tongue tip gently between your teeth in 'this', 'the', and 'thank' — avoid saying 'dis' or 'sank'.",
      tipAr: "ضع طرف لسانك بلطف بين أسنانك في this و the و thank حتى لا تخرج مثل s أو d.",
      shadowSentence: "Thank you! This destination has the richest culture I have ever explored.",
    },
    speakingMission: {
      promptEn: "Tell your speaking partner about a city you want to explore and what you would love to see there.",
      promptAr: "أخبر شريكك عن مدينة تتمنى استكشافها وما الذي تود رؤيته هناك.",
      targetMinutes: 7,
      keyPhrases: ["My dream destination is...", "I would love to explore...", "Learning about a new culture makes me..."],
    },
  },
  {
    id: "a2-lesson-2",
    level: "A2",
    unitNumber: 2,
    title: "Hobbies, Weekend Plans & Improving Skills",
    titleAr: "الهوايات وخطط نهاية الأسبوع وتطوير المهارات",
    durationMins: 14,
    objective: "Describe hobbies, compare weekend activities, and explain how you improve a new skill.",
    objectiveAr: "تحدث عن هواياتك، وقارن بين أنشطة الإجازة، واشرح كيف تطور مهاراتك.",
    sourceRef: "CEFR A2 • Unit 2",
    vocabulary: [
      { id: "l-a2-2-1", word: "improve", level: "A2", pos: "verb", ipa: "/ɪmˈpruːv/", meaningEn: "To get better at something over time.", meaningAr: "يحسّن / يطوّر", example: "Daily speaking calls improve your listening fast." },
      { id: "l-a2-2-2", word: "describe", level: "A2", pos: "verb", ipa: "/dɪˈskraɪb/", meaningEn: "To explain what something looks or feels like.", meaningAr: "يصف", example: "Can you describe your favorite weekend hobby?" },
      { id: "l-a2-2-3", word: "relax", level: "A2", pos: "verb", ipa: "/rɪˈlæks/", meaningEn: "To rest and become calm after work or study.", meaningAr: "يسترخي", example: "I like to relax by walking near the sea." },
      { id: "l-a2-2-4", word: "creative", level: "A2", pos: "adj", ipa: "/kriˈeɪtɪv/", meaningEn: "Using imagination to make original ideas or art.", meaningAr: "مبدع / إبداعي", example: "Photography is a very creative hobby." },
      { id: "l-a2-2-5", word: "energy", level: "A2", pos: "noun", ipa: "/ˈenərdʒi/", meaningEn: "The physical and mental strength to do activities.", meaningAr: "طاقة / نشاط", example: "Morning exercise gives me great energy all day." },
      { id: "l-a2-2-6", word: "prefer", level: "A2", pos: "verb", ipa: "/prɪˈfɜːr/", meaningEn: "To like one thing or activity more than another.", meaningAr: "يفضّل", example: "Do you prefer reading books or watching movies?" },
    ],
    listening: {
      title: "How Do You Unwind?",
      context: "Two learners share their favorite weekend habits.",
      lines: [
        { speaker: "Maya", text: "What do you usually do to relax on the weekend?", translationAr: "ماذا تفعل عادةً للاسترخاء في عطلة نهاية الأسبوع؟" },
        { speaker: "Tarek", text: "I prefer playing football with friends because it gives me energy.", translationAr: "أفضّل لعب كرة القدم مع الأصدقاء لأنها تمنحني طاقة." },
        { speaker: "Maya", text: "Nice! I love creative hobbies like painting and listening to audiobooks.", translationAr: "جميل! أنا أحب الهوايات الإبداعية مثل الرسم والاستماع للكتب الصوتية." },
        { speaker: "Tarek", text: "That's awesome—listening to stories also helps you improve your English!", translationAr: "هذا رائع — الاستماع للقصص يساعدك أيضاً على تحسين إنجليزيتك!" },
      ],
    },
    reading: {
      title: "Why Hobbies Matter",
      paragraphs: [
        "After a busy week of work or study, everyone needs a healthy way to relax. Some people prefer outdoor sports for fresh energy, while others enjoy creative hobbies like cooking, photography, or music.",
        "When you learn to describe your hobbies in English, conversations become much easier and more fun. Talking about what you genuinely love helps you improve your vocabulary naturally.",
      ],
      quiz: [
        { question: "Why do conversations become easier when you talk about hobbies?", options: ["Because you talk about what you genuinely love", "Because hobbies need no words", "Because everyone has the same hobby", "Because sports are quiet"], correctIndex: 0 },
      ],
    },
    pronunciation: {
      focusSound: "R vs L (/r/ vs /l/)",
      tipEn: "Touch your ridge behind top teeth for L in 'relax', and curl your tongue back without touching for R in 'prefer' and 'creative'.",
      tipAr: "في L المس اللثة خلف الأسنان العليا (relax)، وفي R ارفع اللسان للخلف بدون لمس سقف الفم (prefer, creative).",
      shadowSentence: "I really prefer creative hobbies that help me relax and improve.",
    },
    speakingMission: {
      promptEn: "Describe your favorite hobby to a live partner and ask how they relax on weekends.",
      promptAr: "صِف هوايتك المفضلة لشريكك الحي واسأله كيف يسترخي في الإجازة.",
      targetMinutes: 7,
      keyPhrases: ["On weekends, I prefer to...", "It gives me a lot of energy.", "How do you usually relax?"],
    },
  },

  // =========================================================================
  // LEVEL B1 — INTERMEDIATE (2 Complete Lessons • 12 Oxford 3000 Words)
  // =========================================================================
  {
    id: "b1-lesson-1",
    level: "B1",
    unitNumber: 1,
    title: "Overcoming Speaking Anxiety & Real Confidence",
    titleAr: "التغلب على رهبة التحدث وبناء الثقة الحقيقية",
    durationMins: 15,
    objective: "Express feelings clearly, explain personal challenges, and give encouraging advice using connectors.",
    objectiveAr: "عبّر عن التحديات الشخصية بوضوح وقدّم نصائح مشجعة باستخدام أدوات الربط.",
    sourceRef: "CEFR B1 • Unit 1",
    vocabulary: [
      { id: "l-b1-1-1", word: "overcome", level: "B1", pos: "verb", ipa: "/ˌoʊvərˈkʌm/", meaningEn: "To succeed in dealing with a fear or difficulty.", meaningAr: "يتغلب على", example: "Daily calls helped me overcome my fear of speaking." },
      { id: "l-b1-1-2", word: "fluent", level: "B1", pos: "adj", ipa: "/ˈfluːənt/", meaningEn: "Able to speak smoothly and naturally without long pauses.", meaningAr: "طلق اللسان / فصيح", example: "You don't need to be perfect to sound fluent." },
      { id: "l-b1-1-3", word: "perspective", level: "B1", pos: "noun", ipa: "/pərˈspektɪv/", meaningEn: "A particular way of viewing or thinking about something.", meaningAr: "وجهة نظر / منظور", example: "Meeting global learners gives you a wider perspective." },
      { id: "l-b1-1-4", word: "encourage", level: "B1", pos: "verb", ipa: "/ɪnˈkɜːrɪdʒ/", meaningEn: "To give someone support and confidence to keep going.", meaningAr: "يشجّع", example: "Great speaking partners always encourage each other." },
      { id: "l-b1-1-5", word: "essential", level: "B1", pos: "adj", ipa: "/ɪˈsenʃəl/", meaningEn: "Completely necessary and very important.", meaningAr: "أساسي / ضروري", example: "Active listening is essential for smooth dialogue." },
      { id: "l-b1-1-6", word: "hesitate", level: "B1", pos: "verb", ipa: "/ˈhezɪteɪt/", meaningEn: "To pause briefly because you feel uncertain.", meaningAr: "يتردد", example: "Don't hesitate to ask your partner to repeat a word." },
    ],
    listening: {
      title: "Breaking the Silence Barrier",
      context: "Two intermediate learners discuss how they stopped translating in their heads.",
      lines: [
        { speaker: "Daniel", text: "I used to hesitate before every sentence because I worried about grammar.", translationAr: "كنت أتردد قبل كل جملة لأنني كنت أقلق بشأن القواعد." },
        { speaker: "Salma", text: "Me too! What helped you finally overcome that anxiety?", translationAr: "أنا أيضاً! ما الذي ساعدك أخيراً على التغلب على هذا القلق؟" },
        { speaker: "Daniel", text: "Talking with partners who encourage you made all the difference. Consistency is essential.", translationAr: "التحدث مع شركاء يشجعونك صنع كل الفرق. الاستمرارية ضرورية للغاية." },
        { speaker: "Salma", text: "That's a great perspective. Making mistakes is actually how you become fluent!", translationAr: "هذه وجهة نظر رائعة. الوقوع في الأخطاء هو فعلاً الطريقة التي تصبح بها طليقاً!" },
      ],
    },
    reading: {
      title: "Why Mistakes Are Essential for Fluency",
      paragraphs: [
        "Most learners understand far more English than they can speak. When it is time to talk, they often hesitate because they fear making small grammar errors. To overcome this mental block, changing your perspective is essential.",
        "Research in language acquisition proves that becoming fluent happens through active communication, not silent perfection. When friendly partners encourage you to keep talking even when you search for a word, your brain adapts rapidly.",
        "Within just a few weeks of short daily conversations, hesitation fades and English starts flowing naturally.",
      ],
      quiz: [
        { question: "Why do many learners hesitate before speaking?", options: ["They dislike talking", "They fear making small grammar errors", "They forgot their own name", "They have no internet"], correctIndex: 1 },
        { question: "How does fluency develop according to the passage?", options: ["Through active communication", "Through silent perfection only", "By avoiding conversations", "By reading dictionaries alone"], correctIndex: 0 },
      ],
    },
    pronunciation: {
      focusSound: "V vs F (/v/ vs /f/)",
      tipEn: "Vibrate your throat clearly on the V in 'overcome' and 'perspective'—feel your bottom lip buzz!",
      tipAr: "شغّل اهتزاز الحنجرة بوضوح في حرف V بكلمتي overcome و perspective حتى تشعر باهتزاز الشفة السفلى.",
      shadowSentence: "From my perspective, daily voice calls are essential to overcome hesitation.",
    },
    speakingMission: {
      promptEn: "Share with a partner one challenge you faced while learning English and how you are overcoming it.",
      promptAr: "شارك مع شريكك تحدياً واجهته أثناء تعلم الإنجليزية وكيف تتغلب عليه الآن.",
      targetMinutes: 7,
      keyPhrases: ["From my perspective...", "At first I used to hesitate, however...", "I realized it is essential to..."],
    },
  },
  {
    id: "b1-lesson-2",
    level: "B1",
    unitNumber: 2,
    title: "Work, Remote Careers & Future Ambitions",
    titleAr: "العمل عن بُعد والطموحات المهنية",
    durationMins: 15,
    objective: "Discuss career goals, explain work-life balance, and talk about future plans using conditionals.",
    objectiveAr: "ناقش أهدافك المهنية وتوازن الحياة والعمل وتحدث عن خططك المستقبلية.",
    sourceRef: "CEFR B1 • Unit 2",
    vocabulary: [
      { id: "l-b1-2-1", word: "ambition", level: "B1", pos: "noun", ipa: "/æmˈbɪʃən/", meaningEn: "A strong desire to achieve something meaningful.", meaningAr: "طموح", example: "Her main ambition is to lead an international design team." },
      { id: "l-b1-2-2", word: "flexible", level: "B1", pos: "adj", ipa: "/ˈfleksəbəl/", meaningEn: "Able to change or adapt easily to different situations.", meaningAr: "مرِن", example: "Remote work offers a much more flexible schedule." },
      { id: "l-b1-2-3", word: "opportunity", level: "B1", pos: "noun", ipa: "/ˌɒpərˈtuːnəti/", meaningEn: "A chance to do something valuable or advance.", meaningAr: "فرصة", example: "Speaking fluent English opens global career opportunities." },
      { id: "l-b1-2-4", word: "collaborate", level: "B1", pos: "verb", ipa: "/kəˈlæbəreɪt/", meaningEn: "To work jointly with others toward a shared goal.", meaningAr: "يتعاون (في العمل)", example: "Engineers collaborate daily with teammates across time zones." },
      { id: "l-b1-2-5", word: "deadline", level: "B1", pos: "noun", ipa: "/ˈdedlaɪn/", meaningEn: "The latest time or date by which a task must be finished.", meaningAr: "موعد نهائي", example: "We finished the project two days before the deadline." },
      { id: "l-b1-2-6", word: "achieve", level: "B1", pos: "verb", ipa: "/əˈtʃiːv/", meaningEn: "To succeed in reaching a goal through effort.", meaningAr: "يحقق / يُنجز", example: "With a clear plan, you can achieve B2 fluency this year." },
    ],
    listening: {
      title: "Building a Global Career",
      context: "Khaled and Elena talk about remote work opportunities.",
      lines: [
        { speaker: "Elena", text: "Do you enjoy working remotely, or do you miss the office?", translationAr: "هل تستمتع بالعمل عن بُعد أم تفتقد المكتب؟" },
        { speaker: "Khaled", text: "I love the flexible hours, and I get to collaborate with people in Europe and Asia.", translationAr: "أحب الساعات المرنة، وأتعاون مع زملاء في أوروبا وآسيا." },
        { speaker: "Elena", text: "That's a huge opportunity! What is your biggest ambition for the next two years?", translationAr: "هذه فرصة ضخمة! ما هو أكبر طموح لك خلال العامين القادمين؟" },
        { speaker: "Khaled", text: "I want to achieve full English fluency so I can present directly to global clients.", translationAr: "أريد تحقيق الطلاقة الكاملة بالإنجليزية لأقدم العروض مباشرة للعملاء الدوليين." },
      ],
    },
    reading: {
      title: "The Rise of Borderless Teams",
      paragraphs: [
        "Ten years ago, finding an international career meant moving to another country. Today, remote work gives talented professionals the opportunity to collaborate with global teams from their own living rooms.",
        "Although flexible schedules bring freedom, meeting every deadline still requires strong discipline and clear English communication. If you have the ambition to achieve global growth, investing twenty minutes daily in spoken English is one of the smartest decisions you can make.",
      ],
      quiz: [
        { question: "What does meeting deadlines in remote teams still require?", options: ["Strong discipline and clear English communication", "Working without a computer", "Never talking to teammates", "Moving to another continent"], correctIndex: 0 },
      ],
    },
    pronunciation: {
      focusSound: "Word Stress in Longer Words",
      tipEn: "Stress the third syllable in op-por-TU-ni-ty (/ˌɒpərˈtuːnəti/) and the second syllable in col-LA-bo-rate.",
      tipAr: "اضغط على المقطع الثالث في op-por-TU-ni-ty والمقطع الثاني في col-LA-bo-rate لتبدو طبيعياً.",
      shadowSentence: "Flexible remote work is a great opportunity to collaborate and achieve your ambition.",
    },
    speakingMission: {
      promptEn: "Discuss with your partner: Do you prefer remote work or office work, and what career goal do you want to achieve?",
      promptAr: "ناقش شريكك: هل تفضل العمل عن بُعد أم من المكتب، وما الهدف المهني الذي تريد تحقيقه؟",
      targetMinutes: 7,
      keyPhrases: ["In my opinion, a flexible schedule...", "My main ambition is to achieve...", "It's a great opportunity to collaborate..."],
    },
  },

  // =========================================================================
  // LEVEL B2 — UPPER-INTERMEDIATE (2 Complete Lessons • 12 Oxford Words)
  // =========================================================================
  {
    id: "b2-lesson-1",
    level: "B2",
    unitNumber: 1,
    title: "Spontaneous Fluency & Persuasive Speaking",
    titleAr: "الطلاقة العفوية والإقناع في الحديث",
    durationMins: 16,
    objective: "Articulate nuanced opinions spontaneously, defend an argument persuasively, and handle unexpected questions.",
    objectiveAr: "عبّر عن آراء دقيقة بعفوية ودافع عن فكرتك بأسلوب مقنع أمام الأسئلة المفاجئة.",
    sourceRef: "CEFR B2 • Unit 1",
    vocabulary: [
      { id: "l-b2-1-1", word: "spontaneous", level: "B2", pos: "adj", ipa: "/spɒnˈteɪniəs/", meaningEn: "Happening naturally without rehearsing in advance.", meaningAr: "عفوي / تلقائي", example: "Live calls train your mind for spontaneous dialogue." },
      { id: "l-b2-1-2", word: "articulate", level: "B2", pos: "verb", ipa: "/ɑːrˈtɪkjuleɪt/", meaningEn: "To express complex ideas clearly and effectively.", meaningAr: "يعبّر بوضوح وفصاحة", example: "She can articulate her strategy in two crisp sentences." },
      { id: "l-b2-1-3", word: "resilience", level: "B2", pos: "noun", ipa: "/rɪˈzɪliəns/", meaningEn: "The strength to recover quickly from setbacks.", meaningAr: "المرونة النفسية", example: "Every fluent speaker built resilience through trial and error." },
      { id: "l-b2-1-4", word: "persuasive", level: "B2", pos: "adj", ipa: "/pərˈsweɪsɪv/", meaningEn: "Capable of convincing others through clear reasoning.", meaningAr: "مُقنع", example: "Real examples make your argument far more persuasive." },
      { id: "l-b2-1-5", word: "nuance", level: "B2", pos: "noun", ipa: "/ˈnjuːɑːns/", meaningEn: "A subtle shade of meaning, tone, or expression.", meaningAr: "فارق دقيق في المعنى", example: "Shadowing movie scenes reveals the nuance of native tone." },
      { id: "l-b2-1-6", word: "coherent", level: "B2", pos: "adj", ipa: "/koʊˈhɪərənt/", meaningEn: "Logical, well-organized, and easy to follow.", meaningAr: "مترابط ومنطقي", example: "Use transitions like 'furthermore' to keep answers coherent." },
    ],
    listening: {
      title: "Thinking on Your Feet",
      context: "A communication coach explains how to sound persuasive in interviews.",
      lines: [
        { speaker: "Coach", text: "In high-stakes interviews, memorized scripts break down quickly. You need spontaneous clarity.", translationAr: "في المقابلات المهمة، النصوص المحفوظة تنهار سريعاً. أنت بحاجة لوضوح عفوي." },
        { speaker: "Candidate", text: "How can I stay coherent when I get an unexpected question?", translationAr: "كيف أبقى مترابطاً عندما أتلقى سؤالاً غير متوقع؟" },
        { speaker: "Coach", text: "Pause for one calm second, articulate your core point first, then back it up with a persuasive example.", translationAr: "توقف لثانية هادئة، عبّر عن نقطتك الأساسية أولاً، ثم ادعمها بمثال مقنع." },
        { speaker: "Candidate", text: "That builds real resilience—and helps me notice the nuance in the interviewer's tone too.", translationAr: "هذا يبني مرونة حقيقية — ويساعدني على التقاط التفاصيل الدقيقة في نبرة المحاور أيضاً." },
      ],
    },
    reading: {
      title: "The Architecture of Persuasive Speech",
      paragraphs: [
        "Why do some speakers command attention effortlessly while others struggle to keep listeners engaged? The secret rarely lies in rare vocabulary; instead, it comes down to coherent structure and spontaneous delivery.",
        "When you articulate one clear thesis and support it with a concrete story, your message immediately feels persuasive. Practicing unscripted 7-minute conversations builds communicative resilience and trains your ear to catch every subtle nuance of tone and rhythm.",
      ],
      quiz: [
        { question: "What makes a message immediately feel persuasive according to the article?", options: ["Using obscure words", "Articulating one clear thesis supported by a concrete story", "Speaking as fast as possible", "Reading silently from notes"], correctIndex: 1 },
      ],
    },
    pronunciation: {
      focusSound: "Thought Groups & Natural Pausing",
      tipEn: "Pause naturally at commas instead of rushing—clear pausing makes B2/C1 speakers sound authoritative.",
      tipAr: "توقف وقفات قصيرة وطبيعية عند الفواصل بدلاً من الاستعجال؛ التوقف الذكي يمنحك هيبة المتحدث الواثق.",
      shadowSentence: "When you articulate your ideas clearly, your spontaneous speech becomes truly persuasive.",
    },
    speakingMission: {
      promptEn: "Debate with your partner: Does AI make humans more creative or more dependent? Give 2 persuasive reasons.",
      promptAr: "ناقش شريكك: هل يجعل الذكاء الاصطناعي الإنسان أكثر إبداعاً أم أكثر اعتماداً؟ قدّم سببين مقنعين.",
      targetMinutes: 7,
      keyPhrases: ["To articulate my main point...", "Furthermore, a persuasive example is...", "On the other hand, there is an important nuance..."],
    },
  },
  {
    id: "b2-lesson-2",
    level: "B2",
    unitNumber: 2,
    title: "Technology, Habits & Digital Balance",
    titleAr: "التكنولوجيا والعادات والتوازن الرقمي",
    durationMins: 16,
    objective: "Analyze cause and effect, discuss modern technology trends, and compare advantages vs drawbacks.",
    objectiveAr: "حلّل السبب والنتيجة وناقش أثر التكنولوجيا الحديثة وموازنة الإيجابيات والسلبيات.",
    sourceRef: "CEFR B2 • Unit 2",
    vocabulary: [
      { id: "l-b2-2-1", word: "distraction", level: "B2", pos: "noun", ipa: "/dɪˈstrækʃən/", meaningEn: "Something that pulls your attention away from focus.", meaningAr: "مُشتّت للانتباه", example: "Constant notifications are the biggest distraction at work." },
      { id: "l-b2-2-2", word: "productive", level: "B2", pos: "adj", ipa: "/prəˈdʌktɪv/", meaningEn: "Achieving meaningful results efficiently.", meaningAr: "مُنتج / فعّال", example: "Short focused sprints are far more productive than multitasking." },
      { id: "l-b2-2-3", word: "innovative", level: "B2", pos: "adj", ipa: "/ˈɪnəveɪtɪv/", meaningEn: "Introducing original, clever new ideas or methods.", meaningAr: "مبتكر", example: "Peer-to-peer video calls are an innovative way to learn." },
      { id: "l-b2-2-4", word: "sustainable", level: "B2", pos: "adj", ipa: "/səˈsteɪnəbəl/", meaningEn: "Able to be maintained steadily over the long term.", meaningAr: "مستدام", example: "Twenty minutes a day is a sustainable study habit." },
      { id: "l-b2-2-5", word: "impact", level: "B2", pos: "noun", ipa: "/ˈɪmpækt/", meaningEn: "A strong effect or influence on something.", meaningAr: "تأثير / أثر", example: "Good mentors have a lasting impact on our confidence." },
      { id: "l-b2-2-6", word: "drawback", level: "B2", pos: "noun", ipa: "/ˈdrɔːbæk/", meaningEn: "A disadvantage or negative feature of something.", meaningAr: "عيب / نقطة ضعف", example: "The main drawback of passive apps is zero real speaking." },
    ],
    listening: {
      title: "Designing Deep Focus",
      context: "Two product builders compare how they manage screen time.",
      lines: [
        { speaker: "Nour", text: "What's the biggest drawback of being constantly connected online?", translationAr: "ما هو أكبر عيب للاتصال الدائم بالإنترنت؟" },
        { speaker: "Liam", text: "Definitely distraction. Turning off alerts had a massive impact on how productive I feel.", translationAr: "بالتأكيد التشتت. إيقاف الإشعارات كان له تأثير ضخم على مدى إنتاجيتي." },
        { speaker: "Nour", text: "True! Yet innovative tools like live language exchange also connect us meaningfully.", translationAr: "صحيح! ومع ذلك فإن الأدوات المبتكرة مثل تبادل اللغات تربطنا بشكل هادف." },
        { speaker: "Liam", text: "Exactly—the key is building sustainable digital habits instead of mindless scrolling.", translationAr: "بالضبط — المفتاح هو بناء عادات رقمية مستدامة بدلاً من التصفح العشوائي." },
      ],
    },
    reading: {
      title: "Intentional Technology",
      paragraphs: [
        "Every innovative tool carries both an exciting impact and a hidden drawback. Smartphones let us speak with partners across continents in seconds, yet endless feeds can turn into a relentless distraction.",
        "The most productive learners treat technology intentionally: they block noisy notifications and dedicate a sustainable twenty-minute window each day to active skill-building.",
      ],
      quiz: [
        { question: "How do the most productive learners treat technology?", options: ["They throw away phones", "They use it intentionally with focused daily windows", "They keep all notifications on", "They scroll for 5 hours"], correctIndex: 1 },
      ],
    },
    pronunciation: {
      focusSound: "Connected Speech (Linking Consonants & Vowels)",
      tipEn: "Link words smoothly: 'an_innovative' and 'huge_impact' flow as one breath without choppy stops.",
      tipAr: "اربط نهاية الكلمة ببداية التالية بسلاسة مثل an_innovative لتبدو جملك متصلة وطبيعية.",
      shadowSentence: "Cutting distraction has an innovative and sustainable impact on productive habits.",
    },
    speakingMission: {
      promptEn: "Share with your partner one digital habit you want to improve and one innovative app that had a positive impact on you.",
      promptAr: "شارك شريكك عادة رقمية تريد تحسينها وتطبيقاً مبتكراً كان له تأثير إيجابي عليك.",
      targetMinutes: 7,
      keyPhrases: ["The biggest drawback is...", "It had a huge impact on...", "To stay productive and sustainable..."],
    },
  },

  // =========================================================================
  // LEVEL C1 — ADVANCED (2 Complete Lessons • 12 Oxford 5000 Words)
  // =========================================================================
  {
    id: "c1-lesson-1",
    level: "C1",
    unitNumber: 1,
    title: "Executive Clarity & Global Communication",
    titleAr: "الوضوح التنفيذي والتواصل العالمي",
    durationMins: 18,
    objective: "Deliver lucid, pragmatic arguments using advanced discourse markers and precise lexical choices.",
    objectiveAr: "قدّم حججاً واضحة وعملية باستخدام مفردات متقدمة وروابط خطابية احترافية.",
    sourceRef: "CEFR C1 • Unit 1",
    vocabulary: [
      { id: "l-c1-1-1", word: "lucid", level: "C1", pos: "adj", ipa: "/ˈluːsɪd/", meaningEn: "Expressed so clearly that complex ideas feel effortless.", meaningAr: "واضح وسلس للغاية", example: "Her lucid summary aligned the entire engineering team." },
      { id: "l-c1-1-2", word: "eloquent", level: "C1", pos: "adj", ipa: "/ˈeləkwənt/", meaningEn: "Fluent, graceful, and deeply persuasive in speech.", meaningAr: "بليغ / فصيح", example: "He delivered an eloquent keynote without glancing at notes." },
      { id: "l-c1-1-3", word: "pragmatic", level: "C1", pos: "adj", ipa: "/præɡˈmætɪk/", meaningEn: "Focused on practical, realistic results rather than theory.", meaningAr: "عملي / واقعي", example: "We need a pragmatic roadmap for launching in Q3." },
      { id: "l-c1-1-4", word: "ubiquitous", level: "C1", pos: "adj", ipa: "/juːˈbɪkwɪtəs/", meaningEn: "Found or present everywhere at once.", meaningAr: "منتشر في كل مكان", example: "AI assistants have become ubiquitous in modern workflows." },
      { id: "l-c1-1-5", word: "compelling", level: "C1", pos: "adj", ipa: "/kəmˈpelɪŋ/", meaningEn: "Evoking strong interest, attention, or conviction.", meaningAr: "مُقنع وجذاب بقوة", example: "The founder presented a compelling case for expansion." },
      { id: "l-c1-1-6", word: "mitigate", level: "C1", pos: "verb", ipa: "/ˈmɪtɪɡeɪt/", meaningEn: "To make something less severe, risky, or painful.", meaningAr: "يخفف من حدة / يقلل المخاطر", example: "Early user testing helps mitigate costly product mistakes." },
    ],
    listening: {
      title: "Pitching with Executive Precision",
      context: "A product director coaches a founder before an investor Q&A.",
      lines: [
        { speaker: "Director", text: "Investors hear dozens of pitches weekly. What makes yours genuinely compelling?", translationAr: "يستمع المستثمرون لعشرات العروض أسبوعياً. ما الذي يجعل عرضك مقنعاً حقاً؟" },
        { speaker: "Founder", text: "English is ubiquitous in global hiring, yet active speaking practice remains underserved.", translationAr: "الإنجليزية منتشرة في كل مكان بالتوظيف العالمي، ومع ذلك تظل ممارسة التحدث الفعلية قليلة الدعم." },
        { speaker: "Director", text: "That's a lucid framing. Now show a pragmatic plan to mitigate churn.", translationAr: "هذه صياغة واضحة جداً. الآن اعرض خطة عملية لتقليل تسرب المستخدمين." },
      ],
    },
    reading: {
      title: "Clarity Over Complexity",
      paragraphs: [
        "As English becomes ubiquitous across global leadership, the most eloquent communicators rarely hide behind dense jargon. Instead, they craft lucid, compelling narratives grounded in pragmatic evidence.",
        "Whether negotiating partnerships or explaining how to mitigate operational risk, precision of language consistently outperforms verbosity.",
      ],
      quiz: [
        { question: "What consistently outperforms verbosity in global leadership?", options: ["Dense jargon", "Precision of language and lucid narratives", "Speaking without preparation", "Avoiding negotiations"], correctIndex: 1 },
      ],
    },
    pronunciation: {
      focusSound: "Intonation & Contrastive Stress",
      tipEn: "Emphasize contrast words ('not complex, but LUCID') by raising pitch slightly on the key adjective.",
      tipAr: "ارفع النبرة قليلاً على الكلمة المحورية في المقارنة (مثل LUCID و PRAGMATIC) لإبراز المعنى.",
      shadowSentence: "An eloquent leader delivers a lucid and pragmatic plan to mitigate risk.",
    },
    speakingMission: {
      promptEn: "Pitch an idea you care about to your partner in 90 seconds using a lucid, compelling structure.",
      promptAr: "اعرض فكرة تؤمن بها على شريكك في 90 ثانية بأسلوب واضح ومقنع.",
      targetMinutes: 7,
      keyPhrases: ["To put it in a lucid way...", "The most compelling evidence is...", "A pragmatic approach to mitigate this..."],
    },
  },
  {
    id: "c1-lesson-2",
    level: "C1",
    unitNumber: 2,
    title: "Critical Thinking & Cultural Nuance",
    titleAr: "التفكير النقدي والفوارق الثقافية",
    durationMins: 18,
    objective: "Evaluate competing viewpoints diplomatically and navigate cross-cultural conversations with tact.",
    objectiveAr: "قيّم وجهات النظر المختلفة بدبلوماسية وأدر الحوارات متعددة الثقافات بلباقة.",
    sourceRef: "CEFR C1 • Unit 2",
    vocabulary: [
      { id: "l-c1-2-1", word: "diplomatic", level: "C1", pos: "adj", ipa: "/ˌdɪpləˈmætɪk/", meaningEn: "Skilled at dealing with sensitive matters without offending.", meaningAr: "دبلوماسي / لبق", example: "She gave a diplomatic answer to a tough question." },
      { id: "l-c1-2-2", word: "assumptions", level: "C1", pos: "noun", ipa: "/əˈsʌmpʃənz/", meaningEn: "Things accepted as true without direct proof.", meaningAr: "افتراضات", example: "Cross-cultural dialogue challenges our hidden assumptions." },
      { id: "l-c1-2-3", word: "empathy", level: "C1", pos: "noun", ipa: "/ˈempəθi/", meaningEn: "The ability to understand and share another's feelings.", meaningAr: "تعاطف / تفهّم عميق", example: "Listening with empathy transforms disagreements into trust." },
      { id: "l-c1-2-4", word: "paradox", level: "C1", pos: "noun", ipa: "/ˈpærədɒks/", meaningEn: "A seemingly contradictory statement that reveals a deeper truth.", meaningAr: "مفارقة", example: "It's a paradox that slowing down often helps you learn faster." },
      { id: "l-c1-2-5", word: "consensus", level: "C1", pos: "noun", ipa: "/kənˈsensəs/", meaningEn: "General agreement among a group of people.", meaningAr: "إجماع / توافق", example: "After an hour of debate, the team reached a consensus." },
      { id: "l-c1-2-6", word: "subtle", level: "C1", pos: "adj", ipa: "/ˈsʌtəl/", meaningEn: "So delicate or understated as to require careful attention.", meaningAr: "دقيق / خفي", example: "Notice the silent 'b' in the word subtle!" },
    ],
    listening: {
      title: "Bridging Perspectives",
      context: "Two international colleagues reflect on working across cultures.",
      lines: [
        { speaker: "Amira", text: "What surprised you most when you joined a multicultural team?", translationAr: "ما أكثر شيء فاجأك عند انضمامك لفريق متعدد الثقافات؟" },
        { speaker: "Kenji", text: "How many unspoken assumptions we carry—and how subtle politeness cues differ!", translationAr: "كم الافتراضات غير المعلنة التي نحملها — ومدى اختلاف إشارات الأدب الدقيقة!" },
        { speaker: "Amira", text: "Exactly. Leading with empathy makes it far easier to reach a diplomatic consensus.", translationAr: "بالضبط. القيادة بالتعاطف تجعل الوصول لتوافق دبلوماسي أسهل بكثير." },
      ],
    },
    reading: {
      title: "The Paradox of True Listening",
      paragraphs: [
        "There is a fascinating paradox in communication: the less we rush to defend our own assumptions, the more persuasive we become. When we listen with genuine empathy, we detect subtle cues that unlock lasting consensus.",
        "In multicultural spaces, a diplomatic tone is not weakness—it is the hallmark of intellectual maturity.",
      ],
      quiz: [
        { question: "What is the paradox mentioned in the passage?", options: ["Talking louder wins debates", "Rushing less to defend assumptions actually makes us more persuasive", "Silence stops learning", "Consensus is impossible"], correctIndex: 1 },
      ],
    },
    pronunciation: {
      focusSound: "Silent Letters (subtle, debt, doubt)",
      tipEn: "Never pronounce the 'b' in 'subtle' (/ˈsʌtəl/)—it sounds exactly like 'sut-ul'.",
      tipAr: "حرف b صامت تماماً في subtle؛ انطقها /سَتِل/ بدون نطق حرف الباء.",
      shadowSentence: "Listening with empathy uncovers subtle assumptions and builds diplomatic consensus.",
    },
    speakingMission: {
      promptEn: "Ask your partner about a subtle cultural tradition in their country that outsiders often misunderstand.",
      promptAr: "اسأل شريكك عن تقليد ثقافي دقيق في بلده غالباً ما يسيء الغرباء فهمه.",
      targetMinutes: 7,
      keyPhrases: ["It's an interesting paradox that...", "To challenge our assumptions...", "From a diplomatic standpoint..."],
    },
  },

  // =========================================================================
  // LEVEL C2 — MASTERY (2 Complete Lessons • 12 Oxford 5000 / Mastery Words)
  // =========================================================================
  {
    id: "c2-lesson-1",
    level: "C2",
    unitNumber: 1,
    title: "Brevity, Candor & Rhetorical Mastery",
    titleAr: "الإيجاز والصراحة وبلاغة الخطاب",
    durationMins: 18,
    objective: "Convey refined shades of meaning with conciseness, candor, and effortless idiomatic flow.",
    objectiveAr: "عبّر عن أدق الفروق المعنوية بإيجاز وصراحة وتدفق لغوي يضاهي المتحدثين الأصليين.",
    sourceRef: "CEFR C2 • Unit 1",
    vocabulary: [
      { id: "l-c2-1-1", word: "brevity", level: "C2", pos: "noun", ipa: "/ˈbrevəti/", meaningEn: "Concise, exact, and powerful economy of words.", meaningAr: "الإيجاز والبلاغة", example: "Brevity is the soul of unforgettable leadership." },
      { id: "l-c2-1-2", word: "candid", level: "C2", pos: "adj", ipa: "/ˈkændɪd/", meaningEn: "Frank, truthful, and refreshingly direct.", meaningAr: "صريح ومباشر", example: "I deeply appreciate your candid critique of my talk." },
      { id: "l-c2-1-3", word: "quintessential", level: "C2", pos: "adj", ipa: "/ˌkwɪntɪˈsenʃəl/", meaningEn: "Representing the purest or most typical example.", meaningAr: "نموذجي / جوهر الشيء", example: "Active immersion is the quintessential path to mastery." },
      { id: "l-c2-1-4", word: "cogent", level: "C2", pos: "adj", ipa: "/ˈkoʊdʒənt/", meaningEn: "Clear, logical, and deeply convincing.", meaningAr: "دامغ / مقنع منطقياً", example: "She offered a cogent rebuttal in under thirty seconds." },
      { id: "l-c2-1-5", word: "equanimity", level: "C2", pos: "noun", ipa: "/ˌek.wəˈnɪm.ə.ti/", meaningEn: "Mental calmness and composure under pressure.", meaningAr: "رباطة الجأش / الهدوء النفسي", example: "He handled the live debate with remarkable equanimity." },
      { id: "l-c2-1-6", word: "discerning", level: "C2", pos: "adj", ipa: "/dɪˈsɜːrnɪŋ/", meaningEn: "Having keen judgment and refined taste.", meaningAr: "ثاقب البصيرة / دقيق التمييز", example: "Discerning listeners notice authenticity immediately." },
    ],
    listening: {
      title: "The Discipline of Brevity",
      context: "An executive mentor shares the secret of memorable speaking.",
      lines: [
        { speaker: "Mentor", text: "Most speakers equate length with depth. Yet discerning audiences prize brevity above all.", translationAr: "يربط أغلب المتحدثين الطول بالعمق، لكن الجمهور الواعي يقدّر الإيجاز قبل كل شيء." },
        { speaker: "Speaker", text: "So a candid, cogent point delivered with equanimity beats a twenty-minute monologue?", translationAr: "إذن نقطة صريحة ومقنعة تُلقى برباطة جأش تتفوق على خطاب مدته عشرون دقيقة؟" },
        { speaker: "Mentor", text: "Every single time. That is the quintessential mark of true mastery.", translationAr: "في كل مرة. تلك هي العلامة الجوهرية للإتقان الحقيقي." },
      ],
    },
    reading: {
      title: "Why Candor and Brevity Win",
      paragraphs: [
        "At the C2 frontier, mastery is no longer about proving how many rare words you know—it is about choosing the exact word with effortless brevity. A candid, cogent remark delivered with equanimity commands far more respect than ornate filler.",
        "For discerning global audiences, clarity paired with authenticity remains the quintessential standard of excellence.",
      ],
      quiz: [
        { question: "What defines true C2 mastery according to the passage?", options: ["Using ornate filler", "Choosing the exact word with brevity, candor, and equanimity", "Speaking for an hour nonstop", "Avoiding direct answers"], correctIndex: 1 },
      ],
    },
    pronunciation: {
      focusSound: "Natural Cadence & Executive Pacing",
      tipEn: "Deliver C2 vocabulary effortlessly—slow down slightly before key words like 'brevity' and 'equanimity'.",
      tipAr: "تمهّل لجزء من الثانية قبل الكلمات المحورية مثل brevity و equanimity لتعطي جملتك ثقلاً وبلاغة.",
      shadowSentence: "A candid and cogent argument delivered with brevity is the quintessential mark of mastery.",
    },
    speakingMission: {
      promptEn: "Deliver a 60-second candid opinion on what makes a great leader, aiming for maximum brevity and impact.",
      promptAr: "قدّم رأياً صريحاً في 60 ثانية حول ما يصنع القائد العظيم بأعلى درجات الإيجاز والتأثير.",
      targetMinutes: 7,
      keyPhrases: ["To be entirely candid...", "The quintessential factor is...", "In the interest of brevity, my cogent point is..."],
    },
  },
  {
    id: "c2-lesson-2",
    level: "C2",
    unitNumber: 2,
    title: "Storytelling, Wit & Native Idiomatic Flow",
    titleAr: "فن السرد والبديهة والتدفق الاصطلاحي",
    durationMins: 18,
    objective: "Weave vivid stories, use refined idioms effortlessly, and mirror native cadence in live debates.",
    objectiveAr: "انسج قصصاً حية واستخدم التعبيرات الاصطلاحية بسلاسة وإيقاع المتحدث الأصلي.",
    sourceRef: "CEFR C2 • Unit 2",
    vocabulary: [
      { id: "l-c2-2-1", word: "evocative", level: "C2", pos: "adj", ipa: "/ɪˈvɒkətɪv/", meaningEn: "Bringing strong images, memories, or feelings to mind.", meaningAr: "مُثير للخيال والمشاعر", example: "Her evocative story transported everyone to Alexandria." },
      { id: "l-c2-2-2", word: "serendipity", level: "C2", pos: "noun", ipa: "/ˌserənˈdɪpəti/", meaningEn: "Finding something wonderful completely by happy chance.", meaningAr: "صدفة سعيدة رائعة", example: "Meeting a lifelong mentor on a random call was pure serendipity." },
      { id: "l-c2-2-3", word: "ephemeral", level: "C2", pos: "adj", ipa: "/ɪˈfemərəl/", meaningEn: "Lasting for only a very short time.", meaningAr: "عابر / قصير الأمد", example: "Trends are ephemeral, whereas real communication skills endure." },
      { id: "l-c2-2-4", word: "resonance", level: "C2", pos: "noun", ipa: "/ˈrezənəns/", meaningEn: "Deep emotional meaning or lasting impact on listeners.", meaningAr: "صدى وتأثير عميق", example: "Personal stories carry far greater resonance than raw statistics." },
      { id: "l-c2-2-5", word: "repartee", level: "C2", pos: "noun", ipa: "/ˌrepɑːrˈtiː/", meaningEn: "Quick, witty, and playful conversational exchanges.", meaningAr: "سرعة بديهة في الحوار", example: "Effortless repartee makes 1-on-1 calls fly by in seconds." },
      { id: "l-c2-2-6", word: "tenacious", level: "C2", pos: "adj", ipa: "/təˈneɪʃəs/", meaningEn: "Persistent and determined; never giving up easily.", meaningAr: "مثابر وعنيد في الإصرار", example: "Tenacious daily learners inevitably reach native-like flow." },
    ],
    listening: {
      title: "The Magic of Serendipity",
      context: "Two advanced speakers discuss why stories stick in memory.",
      lines: [
        { speaker: "Layla", text: "Why do statistics fade so quickly while one evocative story stays with us for years?", translationAr: "لماذا تتلاشى الإحصاءات سريعاً بينما تبقى قصة حية واحدة معنا لسنوات؟" },
        { speaker: "Julian", text: "Because stories create emotional resonance—especially when shared in spontaneous repartee.", translationAr: "لأن القصص تخلق صدىً عاطفياً — خاصةً حين تُروى في حوار عفوي سريع البديهة." },
        { speaker: "Layla", text: "True! Hype is ephemeral, but tenacious curiosity always invites serendipity.", translationAr: "صحيح! الضجة عابرة، لكن الفضول المثابر يجلب دائماً الصدف السعيدة." },
      ],
    },
    reading: {
      title: "Why Stories Outlast Trends",
      paragraphs: [
        "Digital trends are famously ephemeral, yet an evocative human story carries timeless resonance. When tenacious learners step into unscripted conversations, they often experience remarkable serendipity: a single seven-minute exchange sparks a new idea, a friendship, or a career breakthrough.",
        "Mastery is ultimately the joy of effortless repartee—turning language from a subject you study into a life you live.",
      ],
      quiz: [
        { question: "What turns language from a studied subject into a lived experience?", options: ["Effortless repartee and human connection", "Memorizing grammar charts alone", "Chasing ephemeral trends", "Avoiding spontaneous calls"], correctIndex: 0 },
      ],
    },
    pronunciation: {
      focusSound: "Expressive Pitch & Storytelling Rhythm",
      tipEn: "Vary your pitch and pace—slow down slightly on 'serendipity' and 'resonance' to let your story breathe.",
      tipAr: "نوّع نبرة صوتك وإيقاعك أثناء السرد؛ التمهل الخفيف عند الكلمات المؤثرة يمنح حكايتك حياة.",
      shadowSentence: "Trends are ephemeral, yet an evocative story creates lasting resonance and serendipity.",
    },
    speakingMission: {
      promptEn: "Tell your partner a vivid 2-minute story about a moment of serendipity that changed your path.",
      promptAr: "احكِ لشريكك قصة حية في دقيقتين عن صدفة سعيدة غيّرت مسارك.",
      targetMinutes: 7,
      keyPhrases: ["It was pure serendipity when...", "What gave that moment real resonance was...", "Looking back, being tenacious paid off..."],
    },
  },
];

import { EXTENDED_STRUCTURED_LESSONS } from "./academy-lessons-extended";

export const ALL_STRUCTURED_LESSONS: StructuredLesson[] = [
  ...STRUCTURED_LESSONS,
  ...EXTENDED_STRUCTURED_LESSONS,
].sort((a, b) => a.unitNumber - b.unitNumber);

// Helper: Aggregate ALL 180 curated Oxford/CEFR curriculum words!
export const ALL_CURRICULUM_VOCAB: VocabItem[] = ALL_STRUCTURED_LESSONS.flatMap(
  (lesson) => lesson.vocabulary
);

export function getLessonsByLevel(level: CefrLevel): StructuredLesson[] {
  return ALL_STRUCTURED_LESSONS.filter((l) => l.level === level).sort(
    (a, b) => a.unitNumber - b.unitNumber
  );
}

export function getLessonById(id: string): StructuredLesson | undefined {
  return ALL_STRUCTURED_LESSONS.find((l) => l.id === id);
}
