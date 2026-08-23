const assert = require("node:assert/strict");
const { describe, it } = require("node:test");
const {
  isRestrictedField,
  relationPrefixesFromPaths,
} = require("../path-validation");
const { columnRefForPath, joinAliasFor } = require("../apply-query-options");

describe("isRestrictedField", () => {
  it("blocks exact, prefix, and nested suffix matches", () => {
    const restricted = ["passwordHash", "keyHash"];
    assert.equal(isRestrictedField("passwordHash", restricted), true);
    assert.equal(isRestrictedField("user.passwordHash", restricted), true);
    assert.equal(
      isRestrictedField("participants.user.passwordHash", restricted),
      true,
    );
    assert.equal(isRestrictedField("keyHash", restricted), true);
    assert.equal(isRestrictedField("email", restricted), false);
    assert.equal(isRestrictedField("user.email", restricted), false);
  });
});

describe("relationPrefixesFromPaths", () => {
  it("derives nested relation paths from select/search/filter columns", () => {
    assert.deepEqual(
      relationPrefixesFromPaths([
        "id",
        "sender.firstName",
        "participants.user.email",
        "participants.user.fullName",
      ]).sort(),
      ["participants", "participants.user", "sender"].sort(),
    );
  });
});

describe("nested relation aliases (vivast-style)", () => {
  it("joins nested paths with underscore aliases", () => {
    assert.equal(joinAliasFor("participants"), "participants");
    assert.equal(joinAliasFor("participants.user"), "participants_user");
    assert.equal(
      joinAliasFor("lastMessage.sender"),
      "lastMessage_sender",
    );
  });

  it("maps nested select/sort paths to join aliases", () => {
    assert.equal(columnRefForPath("chat", "name"), "chat.name");
    assert.equal(
      columnRefForPath("chat", "sender.firstName"),
      "sender.firstName",
    );
    assert.equal(
      columnRefForPath("chat", "participants.user.email"),
      "participants_user.email",
    );
  });
});
