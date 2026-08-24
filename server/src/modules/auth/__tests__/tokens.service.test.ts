import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { EUserLevel } from "@moon-tailors/contracts";
import { RefreshTokenEntity } from "../entities/refresh-token.entity";
import { TokenService } from "../services/tokens.service";
import { hashAuthSecret } from "../utils/auth-crypto";

const authConfig = {
  accessTtlSeconds: 900,
  refreshTtlSeconds: 604_800,
};

function createEntityRouter() {
  const saved: RefreshTokenEntity[] = [];
  const repository = {
    create(value: Partial<RefreshTokenEntity>) {
      return Object.assign(new RefreshTokenEntity(), value);
    },
    async save(value: RefreshTokenEntity) {
      if (!value.id) value.id = `token-${saved.length + 1}`;
      saved.push(value);
      return value;
    },
    async findOne() {
      return saved.at(-1) ?? null;
    },
    async update() {
      return { affected: 1 };
    },
  };
  const entityRouter = {
    getRepository() {
      return repository;
    },
  };
  return { entityRouter, saved };
}

function createService(entityRouter: unknown) {
  return new TokenService(
    entityRouter as never,
    { signAsync: async () => "signed-access-token" } as never,
    { resolveForUser: async () => ["tasks:read"] } as never,
    { getOrThrow: () => authConfig } as never,
  );
}

describe("TokenService", () => {
  it("issues an access token and stores only a refresh-token hash", async () => {
    const { entityRouter, saved } = createEntityRouter();
    const service = createService(entityRouter);
    const user = {
      id: "user-id",
      email: "member@example.com",
      firstName: "Test",
      lastName: "Member",
      level: EUserLevel.MEMBER,
      isActive: true,
    };

    const session = await service.issueSession(user as never);

    assert.equal(session.response.accessToken.token, "signed-access-token");
    assert.deepEqual(session.response.user.permissions, ["tasks:read"]);
    assert.equal(
      saved[0].tokenHash,
      hashAuthSecret(session.refreshToken),
    );
    assert.notEqual(saved[0].tokenHash, session.refreshToken);
  });

  it("revokes a stored refresh token", async () => {
    const { entityRouter, saved } = createEntityRouter();
    const rawToken = "refresh-token";
    saved.push(
      Object.assign(new RefreshTokenEntity(), {
        id: "token-id",
        tokenHash: hashAuthSecret(rawToken),
        expiresAt: new Date(Date.now() + 60_000),
        revokedAt: null,
      }),
    );
    const service = createService(entityRouter);

    await service.revoke(rawToken);

    assert.ok(saved.at(-1)?.revokedAt instanceof Date);
  });
});
