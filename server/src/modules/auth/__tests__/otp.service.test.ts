import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { BadRequestException } from "@nestjs/common";
import { EOtpPurpose, EUserLevel } from "@template/contracts";
import { OtpChallengeEntity } from "../entities/otp-challenge.entity";
import { OtpService } from "../services/otp.service";
import { hashAuthSecret } from "../utils/auth-crypto";

const config = {
  getOrThrow(key: string) {
    if (key === "auth") return { otpTtlMs: 300_000, otpMaxAttempts: 5 };
    if (key === "app") return { environment: "test" };
    throw new Error(`Unexpected config key: ${key}`);
  },
};

function createEntityRouter() {
  const saved: OtpChallengeEntity[] = [];
  const repository = {
    create(value: OtpChallengeEntity) {
      return value;
    },
    async save(value: OtpChallengeEntity) {
      if (!value.id) value.id = "challenge-id";
      saved.push(value);
      return value;
    },
    async findOne() {
      return saved.at(-1) ?? null;
    },
  };
  const entityRouter = {
    getRepository() {
      return repository;
    },
  };
  return { entityRouter, saved };
}

describe("OtpService", () => {
  it("creates and verifies a one-time challenge", async () => {
    const { entityRouter, saved } = createEntityRouter();
    let sentCode = "";
    const authMail = {
      sendOtp: async (_user: unknown, _purpose: unknown, code: string) => {
        sentCode = code;
      },
    };
    const service = new OtpService(
      entityRouter as never,
      authMail as never,
      config as never,
    );
    const user = {
      id: "user-id",
      email: "member@example.com",
      level: EUserLevel.MEMBER,
      isActive: true,
    };

    const response = await service.createChallenge(
      user as never,
      EOtpPurpose.LOGIN,
    );
    assert.equal(response.challengeId, "challenge-id");
    assert.equal("otp" in response, false);
    assert.match(sentCode, /^\d{6}$/);
    saved[0].user = user as never;

    const result = await service.verifyChallenge({
      challengeId: response.challengeId,
      code: sentCode,
    });
    assert.equal(result.user.id, user.id);
    assert.equal(result.purpose, EOtpPurpose.LOGIN);
    assert.ok(saved.at(-1)?.consumedAt instanceof Date);
  });

  it("records failed attempts without storing plaintext OTPs", async () => {
    const { entityRouter, saved } = createEntityRouter();
    const authMail = { sendOtp: async () => undefined };
    const service = new OtpService(
      entityRouter as never,
      authMail as never,
      config as never,
    );
    saved.push({
      id: "challenge-id",
      user: { id: "user-id", isActive: true },
      codeHash: hashAuthSecret("123456"),
      purpose: EOtpPurpose.LOGIN,
      expiresAt: new Date(Date.now() + 60_000),
      attempts: 0,
      consumedAt: null,
    } as OtpChallengeEntity);

    await assert.rejects(
      service.verifyChallenge({
        challengeId: "challenge-id",
        code: "654321",
      }),
      BadRequestException,
    );
    assert.equal(saved.at(-1)?.attempts, 1);
    assert.notEqual(saved.at(-1)?.codeHash, "123456");
  });
});
