import * as vscode from "vscode";
import * as assert from "node:assert";

test("Extension should be active if pants.toml is present", () => {
  const extension = vscode.extensions.getExtension("robotpajamas.vscode-suspenders")!;
  assert.strictEqual(extension.isActive, true);
});
