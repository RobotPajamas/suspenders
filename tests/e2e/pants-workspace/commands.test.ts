import * as vscode from "vscode";
import * as assert from "node:assert";
import * as fs from "node:fs";
import * as path from "node:path";

suite("Command test suite", () => {
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0].uri.fsPath!;

  test("`generateBuiltins` should create files in the appropriate locations", async () => {
    await vscode.commands.executeCommand("suspenders.generateBuiltins");
    // Not testing content - just presence
    const expectedFiles = ["__builtins__.pyi", "lift.toml.json", "pants.toml.json"];
    for (const file of expectedFiles) {
      const p = path.join(workspaceFolder, ".pants.d", "suspenders", file);
      assert.strictEqual(fs.existsSync(p), true, `${p} does not exist`);
    }
  });
});
