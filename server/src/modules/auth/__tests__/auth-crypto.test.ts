import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  generateRefreshToken,
  hashAuthSecret,
} from "../utils/auth-crypto";

describe("auth crypto helpers", () => {
  it("hashes auth secrets deterministically", () => {
    assert.equal(hashAuthSecret("123456"), hashAuthSecret("123456"));
    assert.notEqual(hashAuthSecret("123456"), hashAuthSecret("654321"));
  });

  it("generates unique refresh tokens", () => {
    const first = generateRefreshToken();
    const second = generateRefreshToken();

    assert.notEqual(first, second);
    assert.equal(hashAuthSecret(first).length, 64);
  });
});
