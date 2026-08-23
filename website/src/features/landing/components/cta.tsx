import { useSitePrefs } from "../../../components/site-prefs-provider";

type LandingCtaProps = {
  loginUrl: string;
  signupUrl: string;
};

export function LandingCta({ loginUrl, signupUrl }: LandingCtaProps) {
  const { t } = useSitePrefs();

  return (
    <section className="band band--cta" aria-label={t("cta.title")}>
      <div className="band__inner band__inner--narrow">
        <h2 className="band__title">{t("cta.title")}</h2>
        <p className="band__support">{t("cta.support")}</p>
        <div className="hero__cta">
          <a className="btn btn--primary" href={loginUrl}>
            {t("cta.login")}
          </a>
          <a className="btn btn--ghost" href={signupUrl}>
            {t("cta.signup")}
          </a>
        </div>
      </div>
    </section>
  );
}
