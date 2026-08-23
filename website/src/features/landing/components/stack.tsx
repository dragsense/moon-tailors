import { useSitePrefs } from "../../../components/site-prefs-provider";

const STACK = [
  "React Router 7",
  "NestJS",
  "Zod contracts",
  "TanStack Query",
  "Zustand ops",
  "TypeORM",
  "Astro",
  "MCP",
  "Tailwind",
  "Docker",
] as const;

export function LandingStack() {
  const { t } = useSitePrefs();

  return (
    <section className="band band--tight" aria-label={t("stack.title")}>
      <div className="band__inner">
        <h2 className="band__title band__title--sm">{t("stack.title")}</h2>
        <ul className="stack-row">
          {STACK.map((item) => (
            <li key={item} className="stack-row__item">
              {item}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
