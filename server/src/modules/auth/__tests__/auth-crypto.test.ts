import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { looksLikeJwt } from "../utils/auth-crypto";

describe("auth crypto helpers", () => {
  it("detects JWT-shaped tokens", () => {
    assert.equal(looksLikeJwt("aaa.bbb.ccc"), true);
    assert.equal(looksLikeJwt("not-a-jwt"), false);
  });
});
