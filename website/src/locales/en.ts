/**
 * Website locale dictionary — dotted keys via `t("hero.ctaStart")`.
 */
export const en = {
  hero: {
    tagline: "Ship the product, not the plumbing.",
    description:
      "Contracts-first monorepo: NestJS, React Router, Astro, MCP, Zod schemas, ops packs, RBAC, and deploy tooling — ready to extend.",
    ctaStart: "Get started",
    ctaLogin: "Log in",
  },
  features: {
    title: "What you get out of the box",
    support:
      "Patterns that usually take weeks — wired across API, app, marketing site, and MCP agents.",
    contractsTitle: "Contracts first",
    contractsBody:
      "One shared Zod package validates the API, types the client, and powers SchemaForm. Change a field once.",
    opsTitle: "Ops-driven UI",
    opsBody:
      "Feature catalogs compose into page packs. Queries, mutations, confirms, and permissions live in one place.",
    rbacTitle: "Permissions in three layers",
    rbacBody:
      "Route guards, sidebar nav, and per-op gates — server enforces; the client hides what the user cannot do.",
    authTitle: "Production auth",
    authBody:
      "OTP login, in-memory access token, HttpOnly refresh cookie, and session restore before app shells render.",
    queryTitle: "Entity query & access",
    queryBody:
      "List/get with tenant scope, owner ACL, nested _relations / _select / searchable / filters, and restrictedFields.",
    commonTitle: "Shared server platform",
    commonBody:
      "EntityService, file uploads, email, schedule, activity logs, encryption, payments & AI processors under server/common.",
    mcpTitle: "MCP agent tools",
    mcpBody:
      "Nest MCP (HTTP + stdio) mirrors API domains so Cursor and other agents call the same Nest endpoints.",
    websiteTitle: "Marketing site included",
    websiteBody:
      "Astro SSG landing with theme + en/ar (RTL), CTAs into the client login at / — separate deploy from the app.",
    deployTitle: "Split deploys",
    deployBody:
      "Independent Docker images per app. pnpm tpl locally; pnpm remote for SSH deploy — no vendor lock-in.",
  },
  stack: {
    title: "Stack",
  },
  modules: {
    title: "App modules",
    support: "Signed-in product features behind the client login at /.",
    dashboard: "Dashboard",
    tasks: "Tasks",
    users: "Users & levels",
    chat: "Realtime chat",
    cameras: "Cameras & streams",
    billing: "Billing & payments",
    files: "File uploads",
    sms: "SMS inbox",
    email: "Email inbox",
    ai: "AI adapter",
    apiKeys: "API keys",
    availability: "Availability",
    settings: "Settings",
    notifications: "Notifications",
    theme: "Business theme",
  },
  monorepo: {
    title: "Monorepo layout",
    support: "Each package builds and deploys independently. Contracts are the seam.",
    contracts: "Shared Zod schemas, I*/E*/T* types",
    server: "NestJS API, TypeORM, EntityService, common/",
    client: "React Router app — login at /",
    website: "Astro marketing site (this page)",
    mcp: "MCP tools over Nest (HTTP + stdio)",
    docker: "Compose + split image builds",
  },
  cta: {
    title: "Open the app",
    support: "Sign up creates a super-admin account. You land on the dashboard after login.",
    login: "Log in to the app",
    signup: "Create an account",
  },
  prefs: {
    theme: "Theme",
    language: "Language",
    light: "Light",
    dark: "Dark",
    system: "System",
  },
  a11y: {
    prefs: "Site preferences",
    intro: "Introduction",
    features: "Features",
    modules: "Modules",
  },
} as const;

export type WebsiteDict = {
  [K in keyof typeof en]: {
    [P in keyof (typeof en)[K]]: string;
  };
};
