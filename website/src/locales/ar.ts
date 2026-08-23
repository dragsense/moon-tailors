import type { WebsiteDict } from "./en";

export const ar: WebsiteDict = {
  hero: {
    tagline: "أطلق المنتج، لا البنية التحتية.",
    description:
      "قالب متكامل بعقود Zod وNest وReact Router وAstro وMCP وصلاحيات ونشر — جاهز للتوسع بسرعة.",
    ctaStart: "ابدأ الآن",
    ctaLogin: "تسجيل الدخول",
  },
  features: {
    title: "ما تحصل عليه جاهزاً",
    support:
      "أنماط عادةً تستغرق أسابيع — موصولة عبر الواجهة البرمجية والتطبيق والموقع وأدوات MCP.",
    contractsTitle: "العقود أولاً",
    contractsBody:
      "حزمة Zod واحدة واحدة تتحقق من الـ API وتكتب الأنواع وتشغّل النماذج. غيّر الحقل مرة واحدة.",
    opsTitle: "واجهة مدفوعة بالعمليات",
    opsBody:
      "كتالوجات الميزات تتجمع في حزم صفحات. الاستعلامات والتأكيدات والصلاحيات في مكان واحد.",
    rbacTitle: "صلاحيات على ثلاث طبقات",
    rbacBody:
      "حراس المسارات والقائمة الجانبية وبوابات العمليات — الخادم يفرض والعميل يخفي.",
    authTitle: "مصادقة جاهزة للإنتاج",
    authBody:
      "دخول OTP ورمز وصول في الذاكرة وكوكي تحديث HttpOnly واستعادة الجلسة قبل الواجهة.",
    queryTitle: "استعلام الكيانات والوصول",
    queryBody:
      "قوائم مع نطاق المستأجر ومالك افتراضي وعلاقات وبحث وفلاتر متداخلة وحقول مقيدة.",
    commonTitle: "منصة خادم مشتركة",
    commonBody:
      "EntityService ورفع الملفات والبريد والجداول وسجلات النشاط والتشفير ومعالجات الدفع والذكاء تحت server/common.",
    mcpTitle: "أدوات وكلاء MCP",
    mcpBody:
      "خادم Nest MCP (HTTP وstdio) يعكس نطاقات الـ API ليستدعيها Cursor وغيره.",
    websiteTitle: "موقع تسويقي مدمج",
    websiteBody:
      "صفحة Astro مع المظهر والعربية/الإنجليزية وزر دخول إلى تسجيل الدخول في / — نشر منفصل عن التطبيق.",
    deployTitle: "نشر منفصل",
    deployBody:
      "صور Docker مستقلة لكل تطبيق. pnpm tpl محلياً وpnpm remote للنشر عبر SSH.",
  },
  stack: {
    title: "التقنيات",
  },
  modules: {
    title: "وحدات التطبيق",
    support: "ميزات بعد تسجيل الدخول من جذر تطبيق العميل.",
    dashboard: "لوحة التحكم",
    tasks: "المهام",
    users: "المستخدمون والمستويات",
    chat: "دردشة فورية",
    cameras: "الكاميرات والبث",
    billing: "الفوترة والمدفوعات",
    files: "رفع الملفات",
    sms: "رسائل SMS",
    email: "البريد",
    ai: "محول الذكاء الاصطناعي",
    apiKeys: "مفاتيح API",
    availability: "التوافر",
    settings: "الإعدادات",
    notifications: "الإشعارات",
    theme: "سمة العمل",
  },
  monorepo: {
    title: "هيكل المستودع",
    support: "كل حزمة تُبنى وتُنشر بشكل مستقل. العقود هي الجسر.",
    contracts: "مخططات Zod وأنواع I*/E*/T*",
    server: "NestJS وTypeORM وEntityService وcommon/",
    client: "تطبيق React Router — تسجيل الدخول في /",
    website: "موقع Astro التسويقي (هذه الصفحة)",
    mcp: "أدوات MCP فوق Nest (HTTP وstdio)",
    docker: "Compose وبناء صور منفصلة",
  },
  cta: {
    title: "افتح التطبيق",
    support: "التسجيل ينشئ حساب مشرف أعلى. تصل إلى لوحة التحكم بعد الدخول.",
    login: "تسجيل الدخول للتطبيق",
    signup: "إنشاء حساب",
  },
  prefs: {
    theme: "المظهر",
    language: "اللغة",
    light: "فاتح",
    dark: "داكن",
    system: "النظام",
  },
  a11y: {
    prefs: "تفضيلات الموقع",
    intro: "مقدمة",
    features: "الميزات",
    modules: "الوحدات",
  },
};
