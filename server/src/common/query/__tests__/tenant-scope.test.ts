const assert = require("node:assert/strict");
const { describe, it } = require("node:test");
const { EUserLevel } = require("@moon-tailors/contracts");
const { RequestContext } = require("../../context");
const {
  applyTenantScope,
  resolveAccessScopes,
  resolveDefaultOwnerScope,
} = require("../tenant-scope");
const { applyAccessScopes } = require("../apply-access");

function fakeRepo(columns: string[]) {
  return {
    metadata: {
      columns: columns.map((propertyName) => ({ propertyName })),
    },
  };
}

describe("applyTenantScope", () => {
  it("filters by tenantId from RequestContext", () => {
    RequestContext.run(() => {
      RequestContext.set("tenantId", "ten-1");
      const clauses: Array<{ sql: string; params: Record<string, unknown> }> =
        [];
      const qb = {
        andWhere(sql: string, params: Record<string, unknown>) {
          clauses.push({ sql, params });
          return this;
        },
      };
      applyTenantScope(qb as never, fakeRepo(["id", "tenantId"]), "task");
      assert.equal(clauses.length, 1);
      assert.equal(clauses[0].sql, "task.tenantId = :__tenantScopeId");
      assert.equal(clauses[0].params.__tenantScopeId, "ten-1");
    });
  });

  it("skips tables without tenantId", () => {
    RequestContext.run(() => {
      RequestContext.set("tenantId", "ten-1");
      const clauses: unknown[] = [];
      const qb = {
        andWhere(...args: unknown[]) {
          clauses.push(args);
          return this;
        },
      };
      applyTenantScope(qb as never, fakeRepo(["id", "email"]), "user");
      assert.equal(clauses.length, 0);
    });
  });
});

describe("resolveDefaultOwnerScope", () => {
  it("scopes members to createdByUserId", () => {
    RequestContext.run(() => {
      RequestContext.set("userId", "u-1");
      RequestContext.set("userLevel", EUserLevel.MEMBER);
      assert.deepEqual(
        resolveDefaultOwnerScope(fakeRepo(["id", "createdByUserId"])),
        { type: "owner", userId: "u-1" },
      );
    });
  });

  it("scopes staff to createdByUserId", () => {
    RequestContext.run(() => {
      RequestContext.set("userId", "u-1");
      RequestContext.set("userLevel", EUserLevel.STAFF);
      assert.deepEqual(
        resolveDefaultOwnerScope(fakeRepo(["id", "createdByUserId"])),
        { type: "owner", userId: "u-1" },
      );
    });
  });

  for (const level of [
    EUserLevel.PLATFORM_OWNER,
    EUserLevel.SUPER_ADMIN,
    EUserLevel.ADMIN,
  ]) {
    it(`skips owner for ${EUserLevel[level]} (tenant filter is enough)`, () => {
      RequestContext.run(() => {
        RequestContext.set("userId", "u-1");
        RequestContext.set("userLevel", level);
        assert.equal(
          resolveDefaultOwnerScope(fakeRepo(["id", "createdByUserId"])),
          undefined,
        );
      });
    });
  }
});

describe("resolveAccessScopes", () => {
  it("uses caller access instead of default owner", () => {
    RequestContext.run(() => {
      RequestContext.set("userId", "u-1");
      RequestContext.set("userLevel", EUserLevel.MEMBER);
      const scopes = resolveAccessScopes(
        fakeRepo(["id", "createdByUserId", "recipientId"]),
        { type: "eq", column: "recipientId", value: "u-1" },
      );
      assert.deepEqual(scopes, [
        { type: "eq", column: "recipientId", value: "u-1" },
      ]);
    });
  });

  it("falls back to default owner when access omitted", () => {
    RequestContext.run(() => {
      RequestContext.set("userId", "u-1");
      RequestContext.set("userLevel", EUserLevel.STAFF);
      assert.deepEqual(
        resolveAccessScopes(fakeRepo(["id", "createdByUserId"]), undefined),
        [{ type: "owner", userId: "u-1" }],
      );
    });
  });
});

describe("applyAccessScopes owner", () => {
  it("adds createdByUserId equality predicate", () => {
    const clauses: Array<{ sql: string; params: Record<string, unknown> }> =
      [];
    const qb = {
      andWhere(sql: string, params: Record<string, unknown>) {
        clauses.push({ sql, params });
        return this;
      },
    };
    applyAccessScopes(qb as never, "task", {
      type: "owner",
      userId: "u-42",
    });
    assert.equal(clauses.length, 1);
    assert.match(clauses[0].sql, /^task\.createdByUserId = :owner_\d+$/);
    assert.equal(Object.values(clauses[0].params)[0], "u-42");
  });
});
