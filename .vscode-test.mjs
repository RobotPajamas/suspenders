import { defineConfig } from "@vscode/test-cli";

export default defineConfig([
  {
    label: "pants",
    extensionDevelopmentPath: ".",
    files: "build/pants-workspace/**/*.test.js",
    launchArgs: ["--disable-extensions"],
    workspaceFolder: "tests/fixtures/pants-workspace",
    mocha: {
      timeout: 10_000, // This is weird, because it depends on whether the Pants daemon is running yet - maybe pre-warm it?
      ui: "tdd",
    },
  },
  {
    label: "not-pants",
    extensionDevelopmentPath: ".",
    files: "build/not-pants-workspace/**/*.test.js",
    launchArgs: ["--disable-extensions"],
    workspaceFolder: "tests/fixtures/not-pants-workspace",
    mocha: {
      ui: "tdd",
    },
  },
]);
