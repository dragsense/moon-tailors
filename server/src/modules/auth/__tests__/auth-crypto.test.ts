import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { looksLikeJwt, timingSafeEqualString } from "../utils/auth-crypto";

describe("auth crypto helpers", () => {
  it("detects JWT-shaped tokens", () => {
    assert.equal(looksLikeJwt("aaa.bbb.ccc"), true);
    assert.equal(looksLikeJwt("not-a-jwt"), false);
  });

  it("compares strings in constant time", () => {
    assert.equal(timingSafeEqualString("secret", "secret"), true);
    assert.equal(timingSafeEqualString("secret", "wrong"), false);
    assert.equal(timingSafeEqualString("short", "longer"), false);
  });
});
