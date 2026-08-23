import { useSitePrefs } from "../../../components/site-prefs-provider";

const FEATURE_KEYS = [
  ["contractsTitle", "contractsBody"],
  ["opsTitle", "opsBody"],
  ["rbacTitle", "rbacBody"],
  ["authTitle", "authBody"],
  ["queryTitle", "queryBody"],
  ["commonTitle", "commonBody"],
  ["mcpTitle", "mcpBody"],
  ["websiteTitle", "websiteBody"],
  ["deployTitle", "deployBody"],
] as const;

export function LandingFeatures() {
  const { t } = useSitePrefs();

  return (
    <section className="band" aria-label={t("a11y.features")}>
      <div className="band__inner">
        <header className="band__header">
          <h2 className="band__title">{t("features.title")}</h2>
          <p className="band__support">{t("features.support")}</p>
        </header>
        <ul className="feature-list">
          {FEATURE_KEYS.map(([titleKey, bodyKey]) => (
            <li key={titleKey} className="feature-list__item">
              <h3 className="feature-list__title">
                {t(`features.${titleKey}`)}
              </h3>
              <p className="feature-list__body">{t(`features.${bodyKey}`)}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
