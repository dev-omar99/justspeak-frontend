import { CefrLevel } from "./academy";

export interface NovelChapter {
  chapterNumber: number; // 1 to 5 (Matches Unit 1 to Unit 5)
  lessonId: string;
  title: string;
  titleAr: string;
  durationLabel: string;
  segments: {
    text: string;
    translationAr: string;
  }[];
  quiz: {
    question: string;
    options: string[];
    correctIndex: number;
  };
}

export interface GradedNovel {
  id: string;
  level: CefrLevel;
  title: string;
  titleAr: string;
  author: string;
  sourceLabel: string;
  coverEmoji: string;
  synopsis: string;
  synopsisAr: string;
  chapters: NovelChapter[];
}

export const GRADED_NOVELS: GradedNovel[] = [
  // =========================================================================
  // LEVEL A1 — THE FISHERMAN AND THE GOLDEN FISH (5 Chapters)
  // =========================================================================
  {
    id: "novel-a1",
    level: "A1",
    title: "The Fisherman and the Golden Fish",
    titleAr: "الصياد والسمكة الذهبية",
    author: "Classic Folk Novel (Oxford Stage 1 Style)",
    sourceLabel: "Public Domain Graded Reader • A1",
    coverEmoji: "🐟",
    synopsis: "A warm, clear classic tale in simple sentences about kindness, wishes, and gratitude by the sea.",
    synopsisAr: "قصة كلاسيكية دافئة بجمل بسيطة عن اللطف والأمنيات والامتنان على شاطئ البحر.",
    chapters: [
      {
        chapterNumber: 1,
        lessonId: "a1-lesson-1",
        title: "The Little House by the Sea",
        titleAr: "البيت الصغير قرب البحر",
        durationLabel: "2 min",
        segments: [
          { text: "An old fisherman lived with his wife in a small wooden house near the blue sea.", translationAr: "عاش صياد عجوز مع زوجته في بيت خشبي صغير قرب البحر الأزرق." },
          { text: "Every morning, he walked to his boat and threw his old net into the calm water.", translationAr: "كل صباح، كان يمشي إلى قاربه ويرمي شبكته القديمة في الماء الهادئ." },
          { text: "They did not have much money, yet the fisherman loved the quiet sound of the waves.", translationAr: "لم يكن لديهما مال كثير، لكن الصياد كان يحب صوت الأمواج الهادئ." },
        ],
        quiz: { question: "Where did the fisherman live?", options: ["In a tall tower", "In a small wooden house near the sea", "In a busy market", "In a forest"], correctIndex: 1 },
      },
      {
        chapterNumber: 2,
        lessonId: "a1-lesson-2",
        title: "The Golden Catch",
        titleAr: "الصيد الذهبي العجيب",
        durationLabel: "2 min",
        segments: [
          { text: "One sunny morning, the fisherman pulled up his net and saw something shining bright like gold.", translationAr: "في صباح مشمس، سحب الصياد شبكته فرأى شيئاً يلمع بشدة مثل الذهب." },
          { text: "It was a tiny golden fish—and to his surprise, the fish spoke in a gentle voice!", translationAr: "كانت سمكة ذهبية صغيرة — ولدهشته، تكلمت السمكة بصوت لطيف!" },
          { text: "Please let me go, kind man, said the fish, and I will grant you any wish you ask.", translationAr: "قالت السمكة: أرجوك أطلق سراحي أيها الرجل الطيب، وسأحقق لك أي أمنية تطلبها." },
          { text: "The fisherman smiled warmly, asked for nothing, and put the golden fish safely back into the ocean.", translationAr: "ابتسم الصياد بدفء، ولم يطلب شيئاً، وأعاد السمكة الذهبية بأمان إلى المحيط." },
        ],
        quiz: { question: "What did the fisherman ask the golden fish for?", options: ["A castle", "Nothing—he set it free kindly", "A bag of gold", "A new boat"], correctIndex: 1 },
      },
      {
        chapterNumber: 3,
        lessonId: "a1-lesson-3",
        title: "The First Wish",
        titleAr: "الأمنية الأولى",
        durationLabel: "2 min",
        segments: [
          { text: "When the fisherman walked home and told his wife the story, she was amazed.", translationAr: "عندما عاد الصياد إلى البيت وحكى لزوجته القصة، اندهشت كثيراً." },
          { text: "Our old house is broken, she said. Please go back and ask the fish for a warm, cozy cottage.", translationAr: "قالت: بيتنا القديم متهالك. أرجوك ارجع واطلب من السمكة كوخاً دافئاً ومريحاً." },
          { text: "He returned to the shore, called the golden fish, and when he came home, a lovely new cottage stood in the garden.", translationAr: "عاد إلى الشاطئ ونادى السمكة الذهبية، وعندما رجع للبيت وجد كوخاً جديداً جميلاً في الحديقة." },
        ],
        quiz: { question: "What was the wife's first wish?", options: ["A warm, cozy cottage", "A fast train", "A diamond ring", "A bigger net"], correctIndex: 0 },
      },
      {
        chapterNumber: 4,
        lessonId: "a1-lesson-4",
        title: "The Stormy Waves",
        titleAr: "الأمواج العاصفة",
        durationLabel: "2 min",
        segments: [
          { text: "A week later, the wife wanted more: she asked for a grand palace and rooms full of gold.", translationAr: "بعد أسبوع، أرادت الزوجة المزيد: طلبت قصراً كبيراً وغرفاً مليئة بالذهب." },
          { text: "As the fisherman walked back to the beach, the blue sea turned dark gray and windy.", translationAr: "بينما مشى الصياد عائداً للشاطئ، تحول البحر الأزرق إلى رمادي داكن وعاصف." },
          { text: "The golden fish swam up quietly, listened with sad eyes, and warned that greed never brings peace.", translationAr: "سبحت السمكة الذهبية بهدوء، واستمعت بعيون حزينة، وحذّرت أن الطمع لا يجلب السلام أبداً." },
        ],
        quiz: { question: "How did the sea change when greed grew?", options: ["It turned dark gray and windy", "It froze into ice", "It turned pink", "It disappeared"], correctIndex: 0 },
      },
      {
        chapterNumber: 5,
        lessonId: "a1-lesson-5",
        title: "A Grateful Heart",
        titleAr: "قلب ممتن وسعيد",
        durationLabel: "2 min",
        segments: [
          { text: "The next morning, the grand palace was gone, and their simple wooden house stood peacefully by the calm sea.", translationAr: "في الصباح التالي، اختفى القصر الكبير، وعاد بيتهما الخشبي البسيط بسلام قرب البحر الهادئ." },
          { text: "The wife looked at the bright sunrise and finally understood the lesson.", translationAr: "نظرت الزوجة إلى شروق الشمس المشرق وفهمت الدرس أخيراً." },
          { text: "Kindness and a grateful heart are worth far more than all the gold in the world.", translationAr: "اللطف والقلب الممتن أغلى بكثير من كل ذهب العالم." },
        ],
        quiz: { question: "What is the final lesson of the story?", options: ["Gold is everything", "Kindness and gratitude are worth more than gold", "Never go fishing", "Build bigger houses"], correctIndex: 1 },
      },
    ],
  },

  // =========================================================================
  // LEVEL A2 — AROUND THE WORLD IN EIGHTY DAYS (5 Chapters)
  // =========================================================================
  {
    id: "novel-a2",
    level: "A2",
    title: "Around the World in Eighty Days",
    titleAr: "حول العالم في ثمانين يوماً",
    author: "Jules Verne (Oxford Stage 2 Style)",
    sourceLabel: "Project Gutenberg Classic • A2",
    coverEmoji: "🌍",
    synopsis: "Join Phileas Fogg on a thrilling race across continents by train, ship, and balloon.",
    synopsisAr: "رافق فيلياس فوج في سباق شيّق حول القارات بالقطار والسفينة والمنطاد.",
    chapters: [
      {
        chapterNumber: 1,
        lessonId: "a2-lesson-1",
        title: "The Bold London Wager",
        titleAr: "الرهان الجريء في لندن",
        durationLabel: "2 min",
        segments: [
          { text: "Phileas Fogg lived in London and followed the exact same daily schedule every single day.", translationAr: "عاش فيلياس فوج في لندن واتّبع نفس الجدول اليومي بالضبط كل يوم." },
          { text: "One evening at his club, his friends laughed at a newspaper claiming you could travel around the world in eighty days.", translationAr: "في إحدى الأمسيات بناديه، ضحك أصدقاؤه من صحيفة تزعم أنه يمكنك السفر حول العالم في ثمانين يوماً." },
          { text: "I will prove it is possible, said Fogg calmly, and he left London that very night with his loyal assistant Passepartout.", translationAr: "قال فوج بهدوء: سأثبت أن ذلك ممكن، وغادر لندن في تلك الليلة بالذات مع مساعده المخلص باسبارتو." },
        ],
        quiz: { question: "Who traveled with Phileas Fogg?", options: ["His loyal assistant Passepartout", "A London policeman", "His uncle", "Nobody"], correctIndex: 0 },
      },
      {
        chapterNumber: 2,
        lessonId: "a2-lesson-2",
        title: "Across the Suez Canal",
        titleAr: "عبور قناة السويس",
        durationLabel: "2 min",
        segments: [
          { text: "Seven days later, their steamship arrived at the sunny port of Suez in Egypt.", translationAr: "بعد سبعة أيام، وصلت باخرتهم إلى ميناء السويس المشمس في مصر." },
          { text: "Fogg checked his pocket watch carefully—every single hour was right on schedule!", translationAr: "تفقد فوج ساعة جيبه بعناية — كانت كل ساعة في موعدها تماماً!" },
          { text: "However, a suspicious detective named Fix saw Fogg at the port and decided to follow him across the ocean.", translationAr: "ومع ذلك، رأى محقق شكاك يُدعى فيكس السيد فوج في الميناء وقرر ملاحقته عبر المحيط." },
        ],
        quiz: { question: "Where did their steamship arrive after seven days?", options: ["Tokyo", "The port of Suez in Egypt", "New York", "Madrid"], correctIndex: 1 },
      },
      {
        chapterNumber: 3,
        lessonId: "a2-lesson-3",
        title: "The Journey Through India",
        titleAr: "الرحلة عبر الهند",
        durationLabel: "2 min",
        segments: [
          { text: "In India, the railway track suddenly ended in the middle of a green forest!", translationAr: "في الهند، انتهى خط السكة الحديدية فجأة في وسط غابة خضراء!" },
          { text: "Most travelers panicked, yet Fogg stayed calm and hired a gentle guide to continue across the countryside.", translationAr: "ذُعر أغلب المسافرين، لكن فوج بقي هادئاً واستأجر دليلاً لطيفاً لمواصلة الرحلة عبر الريف." },
          { text: "Along the way, they helped a kind princess named Aouda, who gladly joined their adventure.", translationAr: "وفي الطريق، ساعدا أميرة طيبة تُدعى أودا، فانضمت بسعادة إلى مغامرتهما." },
        ],
        quiz: { question: "How did Fogg react when the railway track ended?", options: ["He gave up", "He stayed calm and found another way", "He flew home", "He argued loudly"], correctIndex: 1 },
      },
      {
        chapterNumber: 4,
        lessonId: "a2-lesson-4",
        title: "Sailing the Wide Pacific",
        titleAr: "الإبحار عبر المحيط الهادئ",
        durationLabel: "2 min",
        segments: [
          { text: "From Hong Kong to Japan and across the wide Pacific Ocean, fierce storms tested their courage.", translationAr: "من هونغ كونغ إلى اليابان وعبر المحيط الهادئ الواسع، اختبرت العواصف القوية شجاعتهم." },
          { text: "Every setback made their friendship stronger as they crossed America by fast express train.", translationAr: "كل عقبة زادت صداقتهم قوة وهم يعبرون أمريكا بالقطار السريع." },
          { text: "With only days left, they boarded a ship back toward England—hoping to beat the clock.", translationAr: "ومع بقاء أيام قليلة فقط، استقلوا سفينة عائدة نحو إنجلترا على أمل سباق الزمن." },
        ],
        quiz: { question: "How did they cross America?", options: ["By bicycle", "By fast express train", "On foot", "By submarine"], correctIndex: 1 },
      },
      {
        chapterNumber: 5,
        lessonId: "a2-lesson-5",
        title: "The Final Minute in London",
        titleAr: "الدقيقة الأخيرة في لندن",
        durationLabel: "2 min",
        segments: [
          { text: "When Fogg reached London, he sadly thought he was five minutes too late and had lost the wager.", translationAr: "عندما وصل فوج إلى لندن، ظن بحزن أنه تأخر خمس دقائق وخسر الرهان." },
          { text: "Then Passepartout discovered an amazing surprise: because they traveled east around the sun, they had gained one whole extra day!", translationAr: "ثم اكتشف باسبارتو مفاجأة مذهلة: لأنهم سافروا شرقاً باتجاه الشمس، فقد ربحوا يوماً كاملاً إضافياً!" },
          { text: "Fogg walked into his club right on the final second—winning both the wager and lifelong friends.", translationAr: "دخل فوج ناديه في الثانية الأخيرة تماماً — فربح الرهان وأصدقاء مدى الحياة." },
        ],
        quiz: { question: "Why did Fogg gain an extra day?", options: ["His watch broke", "Because he traveled east around the world", "Because February had 30 days", "He took a shortcut"], correctIndex: 1 },
      },
    ],
  },

  // =========================================================================
  // LEVEL B1 — ALICE'S ADVENTURES IN WONDERLAND (5 Chapters)
  // =========================================================================
  {
    id: "novel-b1",
    level: "B1",
    title: "Alice's Adventures in Wonderland",
    titleAr: "مغامرات أليس في بلاد العجائب",
    author: "Lewis Carroll (Oxford Stage 3 Style)",
    sourceLabel: "Project Gutenberg Classic • B1",
    coverEmoji: "🐇",
    synopsis: "Follow Alice into an imaginative world of curious riddles, unforgettable characters, and vivid English.",
    synopsisAr: "رافق أليس إلى عالم خيالي مليء بالألغاز الطريفة والشخصيات التي لا تُنسى واللغة الحية.",
    chapters: [
      {
        chapterNumber: 1,
        lessonId: "b1-lesson-1",
        title: "Down the Rabbit-Hole",
        titleAr: "النزول في جحر الأرنب",
        durationLabel: "3 min",
        segments: [
          { text: "Alice was growing tired of sitting beside her sister on the riverbank with nothing to do.", translationAr: "بدأت أليس تشعر بالملل من الجلوس بجانب أختها على ضفة النهر دون فعل شيء." },
          { text: "Suddenly, a White Rabbit with pink eyes hurried past, taking a pocket watch out of his waistcoat!", translationAr: "وفجأة، مرّ أرنب أبيض ذو عينين ورديتين مسرعاً، وهو يخرج ساعة جيب من سترته!" },
          { text: "Oh dear! I shall be too late! he cried. Burning with curiosity, Alice jumped up and followed him straight down a deep rabbit-hole.", translationAr: "صاح: يا إلهي! سأتأخر كثيراً! واشتعل الفضول في أليس، فقفزت وتبعته مباشرة داخل جحر عميق." },
        ],
        quiz: { question: "What made Alice jump up and follow the White Rabbit?", options: ["He took out a pocket watch and spoke", "He invited her to lunch", "He stole her hat", "He was flying"], correctIndex: 0 },
      },
      {
        chapterNumber: 2,
        lessonId: "b1-lesson-2",
        title: "The Tiny Golden Key",
        titleAr: "المفتاح الذهبي الصغير",
        durationLabel: "3 min",
        segments: [
          { text: "At the bottom, Alice found herself in a long hall lit by glowing lamps hanging from the ceiling.", translationAr: "في القاع، وجدت أليس نفسها في قاعة طويلة تضيئها مصابيح متوهجة معلقة من السقف." },
          { text: "On a three-legged glass table lay a tiny golden key that unlocked a miniature door leading to the loveliest garden she had ever seen.", translationAr: "على طاولة زجاجية ذات ثلاث أرجل وُجد مفتاح ذهبي صغير يفتح باباً مصغراً يؤدي لأجمل حديقة رأتها يوماً." },
          { text: "Beside it sat a little bottle labeled 'DRINK ME'—teaching Alice that curiosity always opens unexpected doors.", translationAr: "وبجانبه زجاجة صغيرة مكتوب عليها (اشربني) — لتتعلم أليس أن الفضول يفتح دائماً أبواباً غير متوقعة." },
        ],
        quiz: { question: "What did the tiny golden key unlock?", options: ["A treasure chest", "A miniature door leading to a lovely garden", "A front gate", "A wooden clock"], correctIndex: 1 },
      },
      {
        chapterNumber: 3,
        lessonId: "b1-lesson-3",
        title: "Advice from a Caterpillar",
        titleAr: "نصيحة اليسروع الحكيم",
        durationLabel: "3 min",
        segments: [
          { text: "In the quiet woods, Alice met a calm blue Caterpillar sitting atop a giant mushroom.", translationAr: "في الغابة الهادئة، التقت أليس بيسروع أزرق هادئ يجلس فوق فطر عملاق." },
          { text: "Who are you? the Caterpillar asked thoughtfully. Alice paused, realizing she had changed so much since morning.", translationAr: "سألها اليسروع بتأمل: من أنتِ؟ توقفت أليس، مدركةً أنها تغيرت كثيراً منذ الصباح." },
          { text: "Keep your temper and stay patient, he advised—a lesson every learner needs when facing a new challenge.", translationAr: "نصحها: حافظي على هدوئكِ وتحلي بالصبر — وهو درس يحتاجه كل متعلم أمام أي تحدٍ جديد." },
        ],
        quiz: { question: "What advice did the Caterpillar give Alice?", options: ["Run away quickly", "Keep your temper and stay patient", "Never ask questions", "Climb a tree"], correctIndex: 1 },
      },
      {
        chapterNumber: 4,
        lessonId: "b1-lesson-4",
        title: "A Mad Tea-Party",
        titleAr: "حفلة الشاي العجيبة",
        durationLabel: "3 min",
        segments: [
          { text: "Under a shady tree sat a long table set for tea with the Mad Hatter and the March Hare.", translationAr: "تحت شجرة ظليلة وُضعت طاولة طويلة للشاي يجلس حولها صانع القبعات وأرنب مارس." },
          { text: "Why is a raven like a writing-desk? the Hatter asked with a playful grin, starting a conversation full of clever wordplay.", translationAr: "سأل صانع القبعات بابتسامة مرحة: لماذا يشبه الغراب مكتب الكتابة؟ ليبدأ حواراً مليئاً بالتلاعب الذكي بالكلمات." },
          { text: "Alice realized that even strange conversations are great practice for thinking quickly on your feet!", translationAr: "أدركت أليس أن حتى المحادثات الغريبة هي تدريب رائع على سرعة البديهة!" },
        ],
        quiz: { question: "Who was sitting at the tea table under the tree?", options: ["The Mad Hatter and the March Hare", "Sherlock Holmes", "The Fisherman", "Two sailors"], correctIndex: 0 },
      },
      {
        chapterNumber: 5,
        lessonId: "b1-lesson-5",
        title: "Finding Her Voice",
        titleAr: "العثور على صوتها وشجاعتها",
        durationLabel: "3 min",
        segments: [
          { text: "At the Queen's royal garden, everyone trembled whenever the Queen shouted orders.", translationAr: "في حديقة الملكة الملكية، كان الجميع يرتجف كلما صرخت الملكة بالأوامر." },
          { text: "Yet Alice stood tall and spoke with clear, fearless confidence: Who cares for you? You're nothing but a pack of cards!", translationAr: "لكن أليس وقفت بشموخ وتحدثت بثقة واضحة بلا خوف: من يهتم بك؟ أنتم لستم سوى أوراق لعب!" },
          { text: "With a swirl of leaves, Alice woke up beside her sister—braver, wiser, and ready to tell her wonderful story.", translationAr: "ومع دوامة من أوراق الشجر، استيقظت أليس بجانب أختها — أكثر شجاعة وحكمة واستعداداً لرواية قصتها الرائعة." },
        ],
        quiz: { question: "How did Alice respond to the Queen at the end?", options: ["She hid behind a bush", "She stood tall and spoke with fearless confidence", "She cried", "She fell asleep"], correctIndex: 1 },
      },
    ],
  },

  // =========================================================================
  // LEVEL B2 — THE ADVENTURES OF SHERLOCK HOLMES (5 Chapters)
  // =========================================================================
  {
    id: "novel-b2",
    level: "B2",
    title: "The Adventures of Sherlock Holmes",
    titleAr: "مغامرات شيرلوك هولمز",
    author: "Arthur Conan Doyle (Oxford Stage 4 Style)",
    sourceLabel: "Project Gutenberg Classic • B2",
    coverEmoji: "🕵️‍♂️",
    synopsis: "Sharpen upper-intermediate listening and deduction skills through Baker Street's most iconic mystery.",
    synopsisAr: "اصقل مهارات الاستماع والاستنتاج فوق المتوسطة مع أشهر ألغاز شارع بيكر.",
    chapters: [
      {
        chapterNumber: 1,
        lessonId: "b2-lesson-1",
        title: "Seeing vs. Observing",
        titleAr: "الفرق بين الرؤية والملاحظة",
        durationLabel: "3 min",
        segments: [
          { text: "You see, Watson, but you do not observe. The distinction is clear, Sherlock Holmes remarked calmly by the fireplace.", translationAr: "قال شيرلوك هولمز بهدوء بجانب المدفأة: أنت ترى يا واتسون، لكنك لا تلاحظ. الفرق واضح تماماً." },
          { text: "You have walked up the stairs to this room hundreds of times—yet can you tell me how many steps there are?", translationAr: "لقد صعدت الدرج إلى هذه الغرفة مئات المرات — فهل يمكنك إخباري كم عدد درجاته؟" },
          { text: "There are seventeen, Holmes smiled, because I have both seen and truly observed.", translationAr: "ابتسم هولمز: عددها سبع عشرة درجة، لأنني رأيتُ ولاحظتُ معاً." },
        ],
        quiz: { question: "How many steps led up to Holmes's room?", options: ["Seven", "Seventeen", "Twenty-five", "Ten"], correctIndex: 1 },
      },
      {
        chapterNumber: 2,
        lessonId: "b2-lesson-2",
        title: "The Mysterious Note",
        titleAr: "الرسالة الغامضة",
        durationLabel: "3 min",
        segments: [
          { text: "On the table lay an unsigned letter printed on heavy Bohemian paper, announcing a masked visitor at quarter to eight.", translationAr: "على الطاولة وُجدت رسالة غير موقعة على ورق بوهيمي ثقيل، تعلن عن زائر مقنّع في الثامنة إلا ربعاً." },
          { text: "Without hesitation, Holmes held the paper up to the lamplight and deduced the writer's exact country and social rank.", translationAr: "دون تردد، رفع هولمز الورقة نحو ضوء المصباح واستنتج بلد الكاتب ومكانته الاجتماعية بدقة." },
          { text: "It is a capital mistake to theorize before one has data, he reminded Watson.", translationAr: "وذكّر واتسون: إنه خطأ فادح أن تضع نظريات قبل أن تمتلك البيانات." },
        ],
        quiz: { question: "What warning did Holmes give Watson about theories?", options: ["Never write letters", "Never theorize before you have data", "Always guess quickly", "Ignore paper quality"], correctIndex: 1 },
      },
      {
        chapterNumber: 3,
        lessonId: "b2-lesson-3",
        title: "The Masked Visitor",
        titleAr: "الزائر المقنّع",
        durationLabel: "3 min",
        segments: [
          { text: "Precisely on time, a tall gentleman wearing a velvet mask stepped out of the London fog into 221B Baker Street.", translationAr: "في الموعد بالضبط، خطا رجل طويل يرتدي قناعاً مخملياً من ضباب لندن إلى 221ب شارع بيكر." },
          { text: "He sought Holmes's urgent help to recover a sensitive photograph held by the brilliant opera singer Irene Adler.", translationAr: "طلب مساعدة هولمز العاجلة لاستعادة صورة حساسة بحوزة مغنية الأوبرا الذكية إيرين أدلر." },
          { text: "Holmes listened with intense focus, sensing that this opponent would test every ounce of his wit.", translationAr: "استمع هولمز بتركيز شديد، شاعراً أن هذه الخصم ستختبر كل ذرة من ذكائه." },
        ],
        quiz: { question: "What did the masked visitor ask Holmes to recover?", options: ["A golden crown", "A sensitive photograph", "A stolen horse", "A train ticket"], correctIndex: 1 },
      },
      {
        chapterNumber: 4,
        lessonId: "b2-lesson-4",
        title: "The Clever Disguise",
        titleAr: "التنكر الذكي",
        durationLabel: "3 min",
        segments: [
          { text: "The next day, Holmes staged a brief distraction outside Irene Adler's residence to discover where the photograph was hidden.", translationAr: "في اليوم التالي، دبّر هولمز تشتيتاً قصيراً خارج منزل إيرين أدلر ليكتشف مكان إخفاء الصورة." },
          { text: "When people believe a room is in danger, they instinctively glance toward whatever they treasure most, Holmes explained.", translationAr: "شرح هولمز: حين يظن الناس أن الغرفة في خطر، يلتفتون غريزياً نحو أثمن ما يملكون." },
          { text: "Sure enough, her quick glance revealed the secret recess behind the sliding panel.", translationAr: "وبالفعل، كشفت نظرتها السريعة عن التجويف السري خلف اللوح المنزلق." },
        ],
        quiz: { question: "How did Holmes locate the hidden panel?", options: ["He broke the wall", "He watched her instinctive glance during a distraction", "He asked the postman", "He found a map"], correctIndex: 1 },
      },
      {
        chapterNumber: 5,
        lessonId: "b2-lesson-5",
        title: "Outwitted by Brilliance",
        titleAr: "ذكارٌ فاق توقعات هولمز",
        durationLabel: "3 min",
        segments: [
          { text: "When Holmes returned the next morning, the recess was empty—except for a gracious letter addressed directly to Sherlock Holmes.", translationAr: "حين عاد هولمز صباح اليوم التالي، كان التجويف فارغاً — إلا من رسالة لبقة موجهة مباشرة لشيرلوك هولمز." },
          { text: "Irene Adler had seen right through his disguise and vanished with quiet dignity, promising never to misuse the secret.", translationAr: "كانت إيرين أدلر قد كشفت تنكره تماماً واختفت بكرامة هادئة، واعدةً بألا تسيء استخدام السر أبداً." },
          { text: "From that day on, Holmes always spoke of her with genuine admiration as 'the woman' who matched his finest mind.", translationAr: "ومنذ ذلك اليوم، كان هولمز يتحدث عنها دائماً بإعجاب حقيقي باعتبارها المرأة التي نافست أذكى عقوله." },
        ],
        quiz: { question: "What did Holmes find inside the empty hiding spot?", options: ["A bag of coins", "A gracious letter addressed directly to him", "A broken watch", "Nothing at all"], correctIndex: 1 },
      },
    ],
  },

  // =========================================================================
  // LEVEL C1 — THE GREAT GATSBY (5 Chapters)
  // =========================================================================
  {
    id: "novel-c1",
    level: "C1",
    title: "The Great Gatsby",
    titleAr: "غاتسبي العظيم",
    author: "F. Scott Fitzgerald (Oxford Stage 5 Style)",
    sourceLabel: "Project Gutenberg Classic • C1",
    coverEmoji: "✨",
    synopsis: "Explore lyrical American prose, nuanced character study, and timeless themes of ambition and hope.",
    synopsisAr: "استكشف النثر الأمريكي البديع ودراسة الشخصيات الدقيقة وموضوعات الطموح والأمل الخالدة.",
    chapters: [
      {
        chapterNumber: 1,
        lessonId: "c1-lesson-1",
        title: "A Father's Timeless Advice",
        titleAr: "نصيحة الأب الخالدة",
        durationLabel: "3 min",
        segments: [
          { text: "In my younger and more vulnerable years my father gave me some advice that I have been turning over in my mind ever since.", translationAr: "في سنوات شبابي الأكثر حساسية، أعطاني والدي نصيحة ما زلت أتفكر فيها منذ ذلك الحين." },
          { text: "Whenever you feel like criticizing anyone, remember that not all people in this world have had the advantages that you have had.", translationAr: "كلما شعرت برغبة في انتقاد أحد، تذكر أن ليس كل الناس في هذا العالم قد حظوا بالمزايا التي حظيت بها." },
          { text: "Reserving judgment has opened up many curious natures to me across my life.", translationAr: "وقد فتح لي التحفظ عن إصدار الأحكام أبواباً لفهم شخصيات كثيرة مثيرة للفضول طوال حياتي." },
        ],
        quiz: { question: "What habit did Nick develop from his father's advice?", options: ["Reserving judgment about others", "Writing poems", "Selling boats", "Avoiding cities"], correctIndex: 0 },
      },
      {
        chapterNumber: 2,
        lessonId: "c1-lesson-2",
        title: "The Green Light Across the Bay",
        titleAr: "الضوء الأخضر عبر الخليج",
        durationLabel: "3 min",
        segments: [
          { text: "One warm summer evening on West Egg, I noticed my enigmatic neighbor standing alone on the dark lawn.", translationAr: "في مساء صيفي دافئ في ويست إيج، لاحظتُ جاري الغامض يقف وحيداً على العشب المظلم." },
          { text: "He stretched out his arms toward the dark water—pointing at nothing except a single minute green light glowing at the end of a distant dock.", translationAr: "مدّ ذراعيه نحو المياه المظلمة — مشيراً إلى لا شيء سوى ضوء أخضر وحيد صغير يلمع في نهاية رصيف بعيد." },
          { text: "In that silent gesture lay an extraordinary gift for hope that I have never seen in anyone else.", translationAr: "في تلك الإشارة الصامتة كانت تكمن موهبة استثنائية في الأمل لم أرها في أي شخص آخر." },
        ],
        quiz: { question: "What was Gatsby looking at across the dark bay?", options: ["A lighthouse", "A single green light at the end of a distant dock", "A passing train", "A red balloon"], correctIndex: 1 },
      },
      {
        chapterNumber: 3,
        lessonId: "c1-lesson-3",
        title: "Music Through the Summer Night",
        titleAr: "الموسيقى في ليلة الصيف",
        durationLabel: "3 min",
        segments: [
          { text: "There was music from my neighbor's house through the summer nights, and laughter drifted across the illuminated gardens.", translationAr: "كانت الموسيقى تنبعث من بيت جاري طوال ليالي الصيف، وتنساب الضحكات عبر الحدائق المضاءة." },
          { text: "Guests arrived without invitations, trading glittering rumors about who Gatsby really was.", translationAr: "كان الضيوف يصلون دون دعوات، يتبادلون الشائعات البراقة حول هوية غاتسبي الحقيقية." },
          { text: "Yet when I finally met him, his rare smile carried an irresistible reassurance—as if he understood you just as you wished to be understood.", translationAr: "لكن حين التقيته أخيراً، حملت ابتسامته النادرة طمأنينة لا تُقاوم — كأنه يفهمك تماماً كما تتمنى أن تُفهم." },
        ],
        quiz: { question: "What stood out most to Nick when he finally met Gatsby?", options: ["His loud voice", "His rare, reassuring smile", "His gray hat", "His impatience"], correctIndex: 1 },
      },
      {
        chapterNumber: 4,
        lessonId: "c1-lesson-4",
        title: "Chasing the Past",
        titleAr: "مطاردة الماضي",
        durationLabel: "3 min",
        segments: [
          { text: "You can't repeat the past, I gently cautioned Gatsby one afternoon as rain tapped the windows.", translationAr: "حذّرتُ غاتسبي بلطف ذات ظهيرة والمطر ينقر النوافذ: لا يمكنك تكرار الماضي." },
          { text: "Can't repeat the past? he cried incredulously. Why, of course you can!", translationAr: "صاح بدهشة لا تصدق: لا يمكن تكرار الماضي؟ بل بالطبع يمكنك ذلك!" },
          { text: "It was the poignant paradox of ambition: dreaming so vividly that reality struggles to keep pace.", translationAr: "كانت تلك المفارقة المؤثرة للطموح: أن تحلم بوضوح شديد يعجز الواقع عن مجاراته." },
        ],
        quiz: { question: "How did Gatsby react when told he couldn't repeat the past?", options: ["He agreed sadly", "He insisted confidently that he could", "He walked away silently", "He laughed it off"], correctIndex: 1 },
      },
      {
        chapterNumber: 5,
        lessonId: "c1-lesson-5",
        title: "Boats Against the Current",
        titleAr: "قوارب ضد التيار",
        durationLabel: "3 min",
        segments: [
          { text: "As autumn cooled the shore, the music faded and the bay returned to quiet reflection.", translationAr: "ومع برودة الخريف على الشاطئ، خفتت الموسيقى وعاد الخليج إلى تأمله الهادئ." },
          { text: "Gatsby believed in the green light, the future that year by year recedes before us.", translationAr: "آمن غاتسبي بالضوء الأخضر، ذلك المستقبل الذي يتراجع أمامنا عاماً بعد عام." },
          { text: "So we beat on, boats against the current, borne back ceaselessly into the past.", translationAr: "وهكذا نواصل التجديف، قوارب ضد التيار، تدفعنا الأمواج بلا توقف نحو الماضي." },
        ],
        quiz: { question: "What does the famous closing metaphor compare humanity to?", options: ["Eagles in the sky", "Boats rowing against the current", "Trains on iron tracks", "Stars in winter"], correctIndex: 1 },
      },
    ],
  },

  // =========================================================================
  // LEVEL C2 — PRIDE AND PREJUDICE (5 Chapters)
  // =========================================================================
  {
    id: "novel-c2",
    level: "C2",
    title: "Pride and Prejudice",
    titleAr: "كبرياء وتحامل",
    author: "Jane Austen (Oxford Stage 6 Mastery)",
    sourceLabel: "Project Gutenberg Classic • C2",
    coverEmoji: "📜",
    synopsis: "Master sparkling British wit, ironic precision, and refined rhetoric through Jane Austen's masterpiece.",
    synopsisAr: "أتقن البديهة البريطانية الراقية والسخرية اللطيفة والبلاغة الرفيعة عبر رائعة جين أوستن.",
    chapters: [
      {
        chapterNumber: 1,
        lessonId: "c2-lesson-1",
        title: "First Impressions",
        titleAr: "الانطباعات الأولى",
        durationLabel: "3 min",
        segments: [
          { text: "It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife.", translationAr: "إنها حقيقة معترف بها عالمياً، أن الرجل الأعزب الذي يمتلك ثروة طيبة لا بد أنه يبحث عن زوجة." },
          { text: "My dear Mr. Bennet, said his lady to him one day, have you heard that Netherfield Park is let at last?", translationAr: "قالت له زوجته يوماً: عزيزي السيد بينيت، هل سمعت أن نذرفيلد بارك قد أُجِّر أخيراً؟" },
          { text: "In a single witty stroke, Jane Austen establishes the playful irony that animates every dialogue to follow.", translationAr: "وبضربة بارعة واحدة، تؤسس جين أوستن للسخرية الذكية التي تبعث الحياة في كل حوار قادم." },
        ],
        quiz: { question: "What literary device shines in Jane Austen's opening sentence?", options: ["Witty social irony", "Technical instruction", "Horror suspense", "Historical timeline"], correctIndex: 0 },
      },
      {
        chapterNumber: 2,
        lessonId: "c2-lesson-2",
        title: "The Assembly Ball",
        titleAr: "حفل المقاطعة",
        durationLabel: "3 min",
        segments: [
          { text: "At the Meryton assembly, Mr. Bingley charmed the entire room with effortless warmth, while his friend Mr. Darcy stood aloof.", translationAr: "في حفل ميريتون، أسر السيد بينغلي القاعة بأكملها بدفء عفوي، بينما وقف صديقه السيد دارسي متعالياً." },
          { text: "Elizabeth Bennet overheard Darcy's proud dismissal—and turned the slight into a spirited jest among her friends.", translationAr: "سمعت إليزابيث بينيت تعليق دارسي المتكبر — وحوّلت الإهانة إلى مزحة ذكية بين صديقاتها." },
          { text: "I could easily forgive his pride, she quipped, if he had not mortified mine.", translationAr: "وعلّقت ببديهة حاضرة: كان بوسعي بسهولة أن أسامح كبرياءه، لولا أنه جرح كبريائي." },
        ],
        quiz: { question: "How did Elizabeth handle Darcy's proud remark?", options: ["She left town immediately", "She turned it into a witty jest", "She stopped speaking", "She wrote to London"], correctIndex: 1 },
      },
      {
        chapterNumber: 3,
        lessonId: "c2-lesson-3",
        title: "A Candid Conversation",
        titleAr: "مواجهة صريحة",
        durationLabel: "3 min",
        segments: [
          { text: "When Darcy unexpectedly confessed his admiration in spite of his own pride, Elizabeth responded with unequivocal candor.", translationAr: "حين اعترف دارسي بإعجابه على غير المتوقع رغم كبريائه، ردّت إليزابيث بصراحة قاطعة." },
          { text: "She challenged his arrogance fearlessly, refusing to trade self-respect for wealth or social rank.", translationAr: "تحدّت غروره بلا خوف، رافضةً مقايضة احترام الذات بالثروة أو المكانة الاجتماعية." },
          { text: "Both left the room shaken—forced for the first time to confront their own blind spots.", translationAr: "غادر كلاهما الغرفة متأثراً — ومضطراً لأول مرة لمواجهة نقاط عميائه الخاصة." },
        ],
        quiz: { question: "What did Elizabeth refuse to trade for wealth?", options: ["Her library", "Her self-respect and candor", "Her piano", "Her garden"], correctIndex: 1 },
      },
      {
        chapterNumber: 4,
        lessonId: "c2-lesson-4",
        title: "The Letter of Clarity",
        titleAr: "رسالة الوضوح",
        durationLabel: "3 min",
        segments: [
          { text: "The following morning, Darcy handed Elizabeth a long, lucid letter explaining every misunderstanding with quiet honesty.", translationAr: "في الصباح التالي، سلّم دارسي إليزابيث رسالة طويلة وواضحة تشرح كل سوء فهم بصدق هادئ." },
          { text: "Reading his words twice, Elizabeth realized how hastily her own prejudice had clouded her judgment.", translationAr: "وبقراءة كلماته مرتين، أدركت إليزابيث كم أعمى تحاملها المتسرع حكمها." },
          { text: "Till this moment, she admitted with rare humility, I never knew myself.", translationAr: "واعترفت بتواضع نادر: حتى هذه اللحظة، لم أكن أعرف نفسي حقاً." },
        ],
        quiz: { question: "What realization did Darcy's letter spark in Elizabeth?", options: ["That her own prejudice had clouded her judgment", "That she should move to France", "That letters are outdated", "That she was completely right"], correctIndex: 0 },
      },
      {
        chapterNumber: 5,
        lessonId: "c2-lesson-5",
        title: "Clarity of Heart",
        titleAr: "صفاء القلب والنضج",
        durationLabel: "3 min",
        segments: [
          { text: "Months later at Pemberley, Darcy's genuine humility and quiet generosity revealed a man transformed by candid feedback.", translationAr: "وبعد أشهر في بيمبرلي، كشف تواضع دارسي الصادق وكرمه الهادئ عن رجل غيّرته الصراحة." },
          { text: "Having outgrown both pride and prejudice, Elizabeth and Darcy met at last as true intellectual equals.", translationAr: "وبعد أن تجاوزا معاً الكبرياء والتحامل، التقى دارسي وإليزابيث أخيراً كنظيرين فكريين حقيقيين." },
          { text: "Austen reminds us that real eloquence—and real love—begins with the courage to listen and grow.", translationAr: "وتذكّرنا أوستن أن البلاغة الحقيقية — والحب الحقيقي — يبدآن بشجاعة الاستماع والنضج." },
        ],
        quiz: { question: "What transformed both Elizabeth and Darcy by the conclusion?", options: ["Winning a lottery", "Outgrowing pride and prejudice through honesty and reflection", "Leaving England", "Ignoring each other"], correctIndex: 1 },
      },
    ],
  },
];

export function getNovelByLevel(level: CefrLevel): GradedNovel {
  return GRADED_NOVELS.find((n) => n.level === level) || GRADED_NOVELS[2];
}

export function getChapterForLesson(level: CefrLevel, unitNumber: number) {
  const novel = getNovelByLevel(level);
  const chapter =
    novel.chapters.find((c) => c.chapterNumber === unitNumber) ||
    novel.chapters[0];
  return { novel, chapter };
}
