/** OTP challenge reason issued by auth flows. */
export enum EOtpPurpose {
  SIGNUP = "signup",
  LOGIN = "login",
  /** Passwordless email → OTP login. */
  EMAIL_LOGIN = "email_login",
  /** Forgot-password via OTP. */
  PASSWORD_RESET = "password_reset",
}

/** How forgot-password delivers proof to the user. */
export enum EPasswordResetMode {
  OTP = "otp",
  LINK = "link",
}
