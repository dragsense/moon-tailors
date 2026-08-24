import { OpsProvider } from "~/ops";
import { ProfilePage } from "~/features/profile/profile-page";
import { profileOps } from "~/features/profile/ops";

export function meta() {
  return [{ title: "Profile" }];
}

export default function ProfileRoute() {
  return (
    <OpsProvider store={profileOps}>{() => <ProfilePage />}</OpsProvider>
  );
}
