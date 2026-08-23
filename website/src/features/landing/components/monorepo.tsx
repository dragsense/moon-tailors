import { useSitePrefs } from "../../../components/site-prefs-provider";

const PACKAGES = [
  ["contracts/", "contracts"],
  ["server/", "server"],
  ["client/", "client"],
  ["website/", "website"],
  ["mcp/", "mcp"],
  ["docker/", "docker"],
] as const;

export function LandingMonorepo() {
  const { t } = useSitePrefs();

  return (
    <section className="band" aria-label={t("monorepo.title")}>
      <div className="band__inner">
        <header className="band__header">
          <h2 className="band__title">{t("monorepo.title")}</h2>
          <p className="band__support">{t("monorepo.support")}</p>
        </header>
        <ul className="mono-list">
          {PACKAGES.map(([name, key]) => (
            <li key={name} className="mono-list__item">
              <code className="mono-list__name">{name}</code>
              <span className="mono-list__detail">
                {t(`monorepo.${key}`)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
