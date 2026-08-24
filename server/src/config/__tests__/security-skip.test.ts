const assert = require("node:assert/strict");
const { describe, it } = require("node:test");
const {
  matchesSecurityPath,
  requestPathFromUrl,
} = require("../security-skip.config");

describe("security skip path matching", () => {
  it("matches webhook path", () => {
    const patterns = [/^\/api\/payments\/stripe\/webhook\/?$/];
    assert.equal(
      matchesSecurityPath("/api/payments/stripe/webhook", patterns),
      true,
    );
    assert.equal(
      matchesSecurityPath("/api/payments/stripe/webhook?x=1", patterns),
      true,
    );
    assert.equal(matchesSecurityPath("/api/billings", patterns), false);
  });

  it("strips query from originalUrl", () => {
    assert.equal(
      requestPathFromUrl("/api/auth/logout?foo=1", "/api/auth/logout"),
      "/api/auth/logout",
    );
  });
});
