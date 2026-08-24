import type { CSSProperties, ReactNode } from "react";
import {
  getAppEnvironment,
  isNonProductionEnvironment,
  type AppEnvironment,
} from "../lib/app-environment";

export const ENV_BANNER_HEIGHT_PX = 32;
export const ENV_BANNER_OFFSET_CLASS = "pt-8";

type NonProd = Exclude<AppEnvironment, "production">;

const LABELS: Record<NonProd, string> = {
  development: "development",
  testing: "testing",
  staging: "staging",
};

const TONE: Record<
  NonProd,
  { bar: string; chip: string; wash: string; mark: string }
> = {
  development: {
    bar: "bg-gradient-to-r from-amber-500/95 via-amber-400/95 to-orange-400/95 text-amber-950",
    chip: "bg-amber-950/15 text-amber-950",
    wash: "bg-amber-500/[0.04]",
    mark: "text-amber-700/20",
  },
  testing: {
    bar: "bg-gradient-to-r from-sky-600/95 via-sky-500/95 to-cyan-500/95 text-white",
    chip: "bg-white/20 text-white",
    wash: "bg-sky-500/[0.04]",
    mark: "text-sky-700/20",
  },
  staging: {
    bar: "bg-gradient-to-r from-teal-800/95 via-teal-700/95 to-emerald-700/95 text-white",
    chip: "bg-white/15 text-white",
    wash: "bg-teal-600/[0.05]",
    mark: "text-teal-800/20",
  },
};

const GATEWAY_LINKS = [
  { href: "/hub/", label: "Hub" },
  { href: "/app/", label: "App" },
  { href: "/server/api/docs", label: "Scalar" },
  { href: "/server/api/", label: "API" },
] as const;

export function EnvironmentBanner({ className = "" }: { className?: string }) {
  const env = getAppEnvironment();
  if (!isNonProductionEnvironment(env)) return null;

  const tone = TONE[env];

  return (
    <>
      <div
        aria-hidden
        className={`pointer-events-none fixed inset-0 z-[90] ${tone.wash}`}
      >
        <div
          className={`absolute end-4 bottom-10 select-none text-[clamp(2.5rem,8vw,5.5rem)] font-black tracking-[0.12em] uppercase rotate-[-8deg] ${tone.mark}`}
        >
          {env}
        </div>
      </div>

      <div
        role="status"
        className={`fixed inset-x-0 top-0 z-[100] flex h-8 items-center justify-center gap-2 px-3 text-xs font-semibold shadow-sm ${tone.bar} ${className}`}
      >
        <span
          className={`rounded-md px-1.5 py-0.5 font-mono text-[0.65rem] font-bold uppercase ${tone.chip}`}
        >
          {env}
        </span>
        <span className="truncate">You are in {LABELS[env]}</span>
        <nav
          className="hidden items-center gap-2 sm:flex"
          aria-label="Gateway tools"
        >
          {GATEWAY_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="underline-offset-2 hover:underline"
            >
              {link.label}
            </a>
          ))}
        </nav>
      </div>
    </>
  );
}

export function EnvironmentShell({ children }: { children: ReactNode }) {
  const showEnv = isNonProductionEnvironment(getAppEnvironment());

  return (
    <div
      className="relative flex min-h-dvh flex-col"
      style={
        showEnv
          ? ({
              "--env-banner-height": `${ENV_BANNER_HEIGHT_PX}px`,
            } as CSSProperties)
          : undefined
      }
    >
      <EnvironmentBanner />
      <div
        className={`relative flex min-h-0 flex-1 flex-col ${showEnv ? ENV_BANNER_OFFSET_CLASS : ""}`}
      >
        {children}
      </div>
    </div>
  );
}
