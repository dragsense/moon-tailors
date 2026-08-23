const queryAssert = require("node:assert/strict");
const { describe: queryDescribe, it: queryIt } = require("node:test");
const { parseSortFields, toStringArray } = require("../parse-query");

queryDescribe("entity query parse helpers", () => {
  queryIt("parses sortFields with sortable allowlist", () => {
    queryAssert.deepEqual(
      parseSortFields(
        ["createdAt:DESC", "title:ASC", "hack:DESC"],
        undefined,
        undefined,
        ["createdAt", "title"],
      ),
      [
        { field: "createdAt", order: "DESC" },
        { field: "title", order: "ASC" },
      ],
    );
  });

  queryIt("falls back to sortBy / default", () => {
    queryAssert.deepEqual(
      parseSortFields(undefined, "name", "ASC", ["name", "createdAt"]),
      [{ field: "name", order: "ASC" }],
    );
    queryAssert.deepEqual(
      parseSortFields(undefined, "nope", "ASC", ["name"], {
        field: "createdAt",
        order: "DESC",
      }),
      [{ field: "createdAt", order: "DESC" }],
    );
  });

  queryIt("splits comma arrays", () => {
    queryAssert.deepEqual(toStringArray("a, b ,c"), ["a", "b", "c"]);
    queryAssert.deepEqual(toStringArray(["a", "b,c"]), ["a", "b", "c"]);
  });
});
