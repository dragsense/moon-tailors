export function handleStartupError(error: unknown): void {
  const exception = error instanceof Error ? error : new Error(String(error));
  process.stderr.write(
    `${JSON.stringify({
      timestamp: new Date().toISOString(),
      level: "fatal",
      service: process.env.SERVICE_NAME ?? "moon-tailors-server",
      message: "startup_failed",
      errorMessage: exception.message,
      stack: exception.stack,
    })}\n`,
  );
  process.exitCode = 1;
}
