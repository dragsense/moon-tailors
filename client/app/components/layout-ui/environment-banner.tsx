import {
  getAppEnvironment,
  isNonProductionEnvironment,
  type AppEnvironment,
} from "~/lib/app-environment";
import { useI18n } from "~/hooks/use-i18n";
import type { TranslationKey } from "~/locales";
import { cn } from "~/lib/utils";

export const ENV_BANNER_HEIGHT_PX = 32;
export const ENV_BANNER_OFFSET_CLASS = "pt-8";

type NonProd = Exclude<AppEnvironment, "production">;

const LABEL_KEY: Record<NonProd, TranslationKey> = {
  development: "env.development",
  testing: "env.testing",
  staging: "env.staging",
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

const GATEWAY_LINKS: { href: string; label: TranslationKey }[] = [
  { href: "/hub/", label: "env.links.hub" },
  { href: "/", label: "env.links.website" },
  { href: "/server/api/queues", label: "env.links.bullBoard" },
  { href: "/mailpit/", label: "env.links.mailpit" },
  { href: "/server/api/docs", label: "env.links.scalar" },
  { href: "/server/api/", label: "env.links.api" },
];

/** Non-prod bar + overlay. Production → null. */
export function EnvironmentBanner({ className }: { className?: string }) {
  const { t } = useI18n();
  const env = getAppEnvironment();
  if (!isNonProductionEnvironment(env)) return null;

  const tone = TONE[env];

  return (
    <>
      <div
        aria-hidden
        className={cn(
          "pointer-events-none fixed inset-0 z-[90]",
          tone.wash,
        )}
      >
        <div
          className={cn(
            "absolute end-1 bottom-1 select-none text-[clamp(0.5rem,8vw,1.5rem)] font-black tracking-[0.12em] uppercase",
            tone.mark,
          )}
        >
          {env}
        </div>
      </div>

      <div
        role="status"
        className={cn(
          "pointer-events-none fixed inset-x-0 top-0 z-[100] flex h-8 items-center justify-center gap-2 px-3 text-xs font-semibold shadow-sm",
          tone.bar,
          className,
        )}
      >
        <span
          className={cn(
            "rounded-md px-1.5 py-0.5 font-mono text-[0.65rem] font-bold uppercase",
            tone.chip,
          )}
        >
          {env}
        </span>
        <span className="truncate">
          {t("env.banner", { name: t(LABEL_KEY[env]) })}
        </span>
        <nav className="pointer-events-auto flex items-center gap-2">
          {GATEWAY_LINKS.map((item) => (
            <a key={item.href} href={item.href} target="_blank" className="underline-offset-2 hover:underline">
              {t(item.label)}
            </a>
          ))}
        </nav>
      </div>
    </>
  );
}
