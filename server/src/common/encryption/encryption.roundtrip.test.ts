import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  createCipheriv,
  createDecipheriv,
  createHash,
  pbkdf2Sync,
  randomBytes,
  type CipherGCM,
  type DecipherGCM,
} from "crypto";

describe("AES-256-GCM round-trip (compatible)", () => {
  it("encrypts and decrypts JSON", () => {
    const keyMaterial = "dev-encryption-key-must-be-32chars-min!!";
    const algorithm = "aes-256-gcm";
    const aad = Buffer.from("WEB-API", "utf8");
    const payload = { hello: "world", n: 42 };

    const iv = randomBytes(16);
    const salt = randomBytes(64);
    const key = pbkdf2Sync(keyMaterial, salt, 100_000, 32, "sha512");
    const cipher = createCipheriv(algorithm, key, iv) as CipherGCM;
    cipher.setAAD(aad);
    let encrypted = cipher.update(JSON.stringify(payload), "utf8", "hex");
    encrypted += cipher.final("hex");
    const tag = cipher.getAuthTag();

    const combined = Buffer.concat([
      salt,
      iv,
      tag,
      Buffer.from(encrypted, "hex"),
    ]);

    const salt2 = combined.subarray(0, 64);
    const iv2 = combined.subarray(64, 80);
    const tag2 = combined.subarray(80, 96);
    const enc2 = combined.subarray(96);
    const key2 = pbkdf2Sync(keyMaterial, salt2, 100_000, 32, "sha512");
    const decipher = createDecipheriv(algorithm, key2, iv2) as DecipherGCM;
    decipher.setAAD(aad);
    decipher.setAuthTag(tag2);
    let decrypted = decipher.update(enc2, undefined, "utf8");
    decrypted += decipher.final("utf8");

    assert.deepEqual(JSON.parse(decrypted), payload);
    assert.equal(
      createHash("sha256").update(JSON.stringify(payload)).digest("hex").length,
      64,
    );
  });
});
