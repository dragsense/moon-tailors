import { UserSettingsPage } from "~/features/settings/user-settings-page";

export function meta() {
  return [{ title: "Settings" }];
}

export default function SettingsRoute() {
  return <UserSettingsPage />;
}
