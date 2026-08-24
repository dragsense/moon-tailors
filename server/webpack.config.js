const nodeExternals = require("webpack-node-externals");

/**
 * Nest passes its default webpack options; we merge so that in development
 * `@moon-tailors/contracts` resolves via the package `development` export
 * condition (TypeScript source) and is bundled so edits trigger rebuilds.
 * Production keeps contracts external and resolves to dist.
 *
 * Docker / WSL bind mounts often drop inotify unlink/change events — without
 * polling, Nest can keep compiling deleted files (stale fork-ts-checker program).
 * Set WATCHPACK_POLLING=true (compose does this for the server service).
 */
module.exports = (options) => {
  const isProd = process.env.NODE_ENV === "production";
  const polling =
    process.env.WATCHPACK_POLLING === "true" ||
    process.env.WATCHPACK_POLLING === "1" ||
    process.env.CHOKIDAR_USEPOLLING === "true" ||
    process.env.CHOKIDAR_USEPOLLING === "1";
  const pollMs = Number(process.env.WATCHPACK_POLL_INTERVAL || 1000);

  const rules = (options.module?.rules ?? []).map((rule) => {
    if (!rule || !rule.test || !String(rule.test).includes("tsx?")) {
      return rule;
    }
    return {
      ...rule,
      // Transpile workspace contracts source when it is bundled (not external).
      exclude: /node_modules\/(?!@moon-tailors\/contracts)/,
    };
  });

  return {
    ...options,
    module: {
      ...options.module,
      rules,
    },
    externals: [
      nodeExternals({
        allowlist: isProd ? [] : [/^@moon-tailors\/contracts($|\/)/],
      }),
    ],
    resolve: {
      ...options.resolve,
      conditionNames: isProd
        ? ["require", "node", "default"]
        : ["development", "require", "node", "default"],
      extensionAlias: {
        ...(options.resolve?.extensionAlias ?? {}),
        // Contracts source uses `.js` specifiers that map to `.ts` files.
        ".js": [".ts", ".js"],
      },
    },
    watchOptions: {
      ...(options.watchOptions ?? {}),
      ignored: /node_modules/,
      aggregateTimeout: 300,
      ...(polling ? { poll: Number.isFinite(pollMs) ? pollMs : 1000 } : {}),
    },
  };
};
