import { OpsProvider } from "~/ops";
import { verifyOtpPageOps } from "~/features/auth/ops/verify-otp";

export function meta() {
  return [{ title: "Verify OTP · Template" }];
}

export default function VerifyOtpRoute() {
  return (
    <OpsProvider store={verifyOtpPageOps}>
      {({ components }) => components.verifyOtp}
    </OpsProvider>
  );
}
