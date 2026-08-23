const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { describe, it, beforeEach, afterEach } = require("node:test");
const { RequestContext } = require("../../context");
const { AppLoggerService } = require("../services/app-logger.service");

const loggerConfig = {
  getOrThrow: () => ({
    serviceName: "template-server",
    environment: "test",
  }),
};

describe("AppLoggerService", () => {
  let cwd: string;
  let prevCwd: string;

  beforeEach(() => {
    prevCwd = process.cwd();
    cwd = fs.mkdtempSync(path.join(os.tmpdir(), "app-logger-"));
    process.chdir(cwd);
  });

  afterEach(() => {
    process.chdir(prevCwd);
    fs.rmSync(cwd, { recursive: true, force: true });
  });

  it("prints colored Nest-style logs and keeps request id in the message", () => {
    let output = "";
    const write = process.stdout.write.bind(process.stdout);
    process.stdout.write = ((chunk: string | Uint8Array) => {
      output += chunk.toString();
      return true;
    }) as typeof process.stdout.write;

    try {
      RequestContext.run(() => {
        RequestContext.set("requestId", "request-123");
        new AppLoggerService(loggerConfig).log("login ok", "AuthService");
      });
    } finally {
      process.stdout.write = write;
    }

    assert.match(output, /login ok \[req=request-123\]/);
    assert.match(output, /AuthService/);
    assert.doesNotMatch(output, /^\s*\{.*"level".*$/m);
  });

  it("persists errors as JSON lines under logs/", () => {
    RequestContext.run(() => {
      RequestContext.set("requestId", "request-err");
      new AppLoggerService(loggerConfig).error(
        "boom",
        "Error: boom\n    at test",
        "HTTP",
      );
    });

    const logsDir = path.join(cwd, "logs");
    const files = fs.readdirSync(logsDir).filter((f: string) => f.startsWith("error-"));
    assert.equal(files.length, 1);
    const line = fs.readFileSync(path.join(logsDir, files[0]), "utf8").trim();
    const record = JSON.parse(line);
    assert.equal(record.level, "error");
    assert.equal(record.message, "boom [req=request-err]");
    assert.equal(record.context, "HTTP");
    assert.match(record.stack, /Error: boom/);
  });

  it("logs http exceptions without writing warn-level to the error file", () => {
    new AppLoggerService(loggerConfig).exception(
      {
        method: "GET",
        path: "/api/test",
        statusCode: 400,
        exceptionType: "BadRequestException",
      },
      new Error("nope"),
    );

    const logsDir = path.join(cwd, "logs");
    if (fs.existsSync(logsDir)) {
      const files = fs.readdirSync(logsDir);
      assert.equal(files.length, 0);
    }
  });
});
