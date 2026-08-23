import { useSitePrefs } from "../../../components/site-prefs-provider";

const MODULE_KEYS = [
  "dashboard",
  "tasks",
  "users",
  "chat",
  "cameras",
  "billing",
  "files",
  "sms",
  "email",
  "ai",
  "apiKeys",
  "availability",
  "settings",
  "notifications",
  "theme",
] as const;

export function LandingModules() {
  const { t } = useSitePrefs();

  return (
    <section className="band" aria-label={t("a11y.modules")}>
      <div className="band__inner">
        <header className="band__header">
          <h2 className="band__title">{t("modules.title")}</h2>
          <p className="band__support">{t("modules.support")}</p>
        </header>
        <ul className="module-grid">
          {MODULE_KEYS.map((key) => (
            <li key={key} className="module-grid__item">
              {t(`modules.${key}`)}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
