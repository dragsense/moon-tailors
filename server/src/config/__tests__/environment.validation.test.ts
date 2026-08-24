const envAssert = require("node:assert/strict");
const { describe: envDescribe, it: envIt } = require("node:test");
const {
  validateEnvironment,
} = require("../environment.validation");

envDescribe("environment validation", () => {
  envIt("converts false-like boolean strings correctly", () => {
    const env = validateEnvironment({
      NODE_ENV: "development",
      TYPEORM_SYNC: "false",
      API_DOCS_ENABLED: "false",
      CLUSTER_ENABLED: "false",
      CSRF_ENABLED: "false",
      CACHE_ENABLED: "false",
      ACTIVITY_LOGS_ENABLED: "false",
      EVENTS_ENABLED: "false",
    });

    envAssert.equal(env.TYPEORM_SYNC, false);
    envAssert.equal(env.API_DOCS_ENABLED, false);
    envAssert.equal(env.CLUSTER_ENABLED, false);
    envAssert.equal(env.REDIS_URL, "redis://localhost:6379");
    envAssert.equal(env.COOKIE_SECRET, "dev-cookie-secret-change-me");
  });

  envIt("requires a secure JWT secret in production", () => {
    envAssert.throws(
      () =>
        validateEnvironment({
          NODE_ENV: "production",
          DATABASE_URL: "postgres://postgres:postgres@localhost/moon_tailors",
        }),
      /Invalid environment configuration/,
    );
  });

  envIt("requires AWS credentials when STORAGE_DRIVER=s3", () => {
    envAssert.throws(
      () =>
        validateEnvironment({
          NODE_ENV: "development",
          STORAGE_DRIVER: "s3",
        }),
      /Invalid environment configuration/,
    );
  });
});
