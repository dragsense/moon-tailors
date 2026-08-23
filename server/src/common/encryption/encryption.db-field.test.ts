const assert = require("node:assert/strict");
const { describe, it } = require("node:test");
const {
  EncryptionService,
  DB_FIELD_PREFIX,
} = require("./encryption.service");
const {
  encryptedTextTransformer,
  bindDbEncryption,
} = require("./db-encryption");

function makeService(opts: {
  enabled?: boolean;
  dbEnabled?: boolean;
  key?: string;
}) {
  const config = {
    enabled: opts.enabled ?? false,
    dbEnabled: opts.dbEnabled ?? false,
    key: opts.key ?? "dev-encryption-key-must-be-32chars-min!!",
    algorithm: "aes-256-gcm",
    ivLength: 16,
    saltLength: 64,
    tagLength: 16,
    keyLength: 32,
    iterations: 1000,
    hash: "sha512",
    additionalData: "WEB-API",
  };
  const configService = {
    getOrThrow: () => config,
  };
  const service = new EncryptionService(configService as never);
  service.onModuleInit();
  return service;
}

describe("DB field encryption", () => {
  it("is a no-op when DB_ENCRYPTION_ENABLED is false", () => {
    const service = makeService({ dbEnabled: false });
    assert.equal(service.dbEnabled, false);
    assert.equal(service.encryptField("secret"), "secret");
    assert.equal(service.decryptField("secret"), "secret");
  });

  it("round-trips with enc:v1 prefix when enabled", () => {
    const service = makeService({ dbEnabled: true });
    assert.equal(service.dbEnabled, true);
    const stored = service.encryptField("camera-pass");
    assert.ok(stored?.startsWith(DB_FIELD_PREFIX));
    assert.equal(service.decryptField(stored), "camera-pass");
  });

  it("leaves legacy plaintext readable after enabling", () => {
    const service = makeService({ dbEnabled: true });
    assert.equal(service.decryptField("old-plain"), "old-plain");
  });

  it("keeps API enabled independent of DB flag", () => {
    const apiOnly = makeService({ enabled: true, dbEnabled: false });
    assert.equal(apiOnly.enabled, true);
    assert.equal(apiOnly.dbEnabled, false);

    const dbOnly = makeService({ enabled: false, dbEnabled: true });
    assert.equal(dbOnly.enabled, false);
    assert.equal(dbOnly.dbEnabled, true);
  });

  it("transformer uses bound service", () => {
    const service = makeService({ dbEnabled: true });
    bindDbEncryption(service);
    const out = encryptedTextTransformer.to("pw");
    assert.ok(typeof out === "string" && out.startsWith(DB_FIELD_PREFIX));
    assert.equal(encryptedTextTransformer.from(out), "pw");
  });
});
