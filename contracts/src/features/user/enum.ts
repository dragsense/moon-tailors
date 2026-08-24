/** Access level — broad account category, not a permission role. */
export enum EUserLevel {
  PLATFORM_OWNER = 0,
  STAFF = 1,
  CUSTOMER = 2,
}

/** Self-reported gender on the logged-in user profile. */
export enum EGender {
  MALE = "male",
  FEMALE = "female",
  OTHER = "other",
}