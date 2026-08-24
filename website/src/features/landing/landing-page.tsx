import { EnvironmentShell } from "../../components/environment-banner";
import { SiteChrome } from "../../components/site-chrome";
import { SiteFooter } from "../../components/site-footer";
import { SitePrefsProvider } from "../../components/site-prefs-provider";
import { LandingHero } from "./components/hero";

export type LandingPageProps = {
  brand: string;
  loginUrl: string;
  dashboardUrl: string;
  apiUrl: string;
  taglineOverride?: string;
  descriptionOverride?: string;
};

/** Single client island so theme/i18n context is shared. */
export function LandingPage(props: LandingPageProps) {
  return (
    <SitePrefsProvider>
      <EnvironmentShell>
        <SiteChrome />
        <div className="landing">
          <LandingHero
            brand={props.brand}
            loginUrl={props.loginUrl}
            dashboardUrl={props.dashboardUrl}
            apiUrl={props.apiUrl}
            taglineOverride={props.taglineOverride}
            descriptionOverride={props.descriptionOverride}
          />
          <SiteFooter name={props.brand} />
        </div>
      </EnvironmentShell>
    </SitePrefsProvider>
  );
}
