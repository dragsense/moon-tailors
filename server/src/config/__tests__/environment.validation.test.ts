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
      ENCRYPTION_ENABLED: "false",
      CLUSTER_ENABLED: "false",
      CSRF_ENABLED: "false",
      CACHE_ENABLED: "false",
      MAIL_ENABLED: "false",
      MQTT_ENABLED: "false",
      ACTIVITY_LOGS_ENABLED: "false",
      EVENTS_ENABLED: "false",
      BULL_BOARD_ENABLED: "false",
    });

    envAssert.equal(env.TYPEORM_SYNC, false);
    envAssert.equal(env.API_DOCS_ENABLED, false);
    envAssert.equal(env.ENCRYPTION_ENABLED, false);
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

  envIt("requires an encryption key when encryption is enabled", () => {
    envAssert.throws(
      () =>
        validateEnvironment({
          NODE_ENV: "development",
          ENCRYPTION_ENABLED: "true",
          ENCRYPTION_KEY: "short",
        }),
      /Invalid environment configuration/,
    );
  });

  envIt("requires an encryption key when DB encryption is enabled", () => {
    envAssert.throws(
      () =>
        validateEnvironment({
          NODE_ENV: "development",
          DB_ENCRYPTION_ENABLED: "true",
          ENCRYPTION_KEY: "short",
        }),
      /Invalid environment configuration/,
    );
  });

  envIt("accepts DB encryption with a valid key while API encryption stays off", () => {
    const env = validateEnvironment({
      NODE_ENV: "development",
      DB_ENCRYPTION_ENABLED: "true",
      ENCRYPTION_ENABLED: "false",
      ENCRYPTION_KEY: "dev-encryption-key-must-be-32chars-min!!",
    });
    envAssert.equal(env.DB_ENCRYPTION_ENABLED, true);
    envAssert.equal(env.ENCRYPTION_ENABLED, false);
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

  envIt("requires Stripe keys when STRIPE_ENABLED", () => {
    envAssert.throws(
      () =>
        validateEnvironment({
          NODE_ENV: "development",
          STRIPE_ENABLED: "true",
        }),
      /Invalid environment configuration/,
    );
  });
});
