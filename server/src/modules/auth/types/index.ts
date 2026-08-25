import type { ILoginResponse } from "@moon-tailors/contracts";

/** Issued session from TokenService (JSON body + JWT cookie value). */
export type AuthSession = {
  response: ILoginResponse;
  accessToken: string;
};

