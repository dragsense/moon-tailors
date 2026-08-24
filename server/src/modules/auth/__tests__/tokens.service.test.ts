import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { EUserLevel } from "@moon-tailors/contracts";
import { TokenService } from "../services/tokens.service";

const authConfig = {
  accessTtlSeconds: 604_800,
};

function createService() {
  return new TokenService(
    { signAsync: async () => "signed-access-token" } as never,
    { resolveForUser: async () => ["tasks:read"] } as never,
    { getOrThrow: () => authConfig } as never,
  );
}

describe("TokenService", () => {
  it("issues a JWT access token without storing a refresh token", async () => {
    const service = createService();
    const user = {
      id: "user-id",
      email: "customer@example.com",
      firstName: "Test",
      lastName: "Customer",
      age: null,
      gender: null,
      level: EUserLevel.CUSTOMER,
      isActive: true,
    };

    const session = await service.issueSession(user as never);

    assert.equal(session.accessToken, "signed-access-token");
    assert.equal(session.response.user.email, "customer@example.com");
    assert.equal(session.response.message, "Authenticated");
    assert.equal("accessToken" in session.response, false);
  });
});
