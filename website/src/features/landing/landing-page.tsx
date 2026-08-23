import { EnvironmentShell } from "../../components/environment-banner";
import { SiteChrome } from "../../components/site-chrome";
import { SitePrefsProvider } from "../../components/site-prefs-provider";
import { LandingCta } from "./components/cta";
import { LandingFeatures } from "./components/features";
import { LandingHero } from "./components/hero";
import { LandingModules } from "./components/modules";
import { LandingMonorepo } from "./components/monorepo";
import { LandingStack } from "./components/stack";

export type LandingPageProps = {
  brand: string;
  loginUrl: string;
  signupUrl: string;
  taglineOverride?: string;
  descriptionOverride?: string;
};

/** Single client island so theme/i18n context is shared. */
export function LandingPage(props: LandingPageProps) {
  return (
    <SitePrefsProvider>
      <EnvironmentShell>
        <SiteChrome />
        <main>
          <LandingHero {...props} />
          <LandingStack />
          <LandingFeatures />
          <LandingModules />
          <LandingMonorepo />
          <LandingCta
            loginUrl={props.loginUrl}
            signupUrl={props.signupUrl}
          />
        </main>
      </EnvironmentShell>
    </SitePrefsProvider>
  );
}
