import * as vscode from "vscode";
import * as proc from "child_process";
import { SourceRootsProvider } from "./source-roots-provider";
import { TargetsProvider } from "./targets-provider";

let loggingChannel: vscode.OutputChannel;

function runGoalOnAllTargets(name: string, cwd?: string): void {
  const options: proc.SpawnOptions = {
    cwd,
  };
  const subprocess = proc.spawn("./pants", [name, "::"], options);
  subprocess.stdout?.on("data", (data) =>
    loggingChannel.appendLine(data.toString())
  );
  subprocess.stderr?.on("data", (data) =>
    loggingChannel.appendLine(data.toString())
  );
}

export function activate(context: vscode.ExtensionContext) {
  const rootPath =
    vscode.workspace.workspaceFolders &&
    vscode.workspace.workspaceFolders.length > 0
      ? vscode.workspace.workspaceFolders[0].uri.fsPath
      : undefined;

  loggingChannel = vscode.window.createOutputChannel("Suspenders");

  context.subscriptions.push(
    vscode.commands.registerCommand("suspenders.checkAll", () => {
      runGoalOnAllTargets("check");
    })
  );
  context.subscriptions.push(
    vscode.commands.registerCommand("suspenders.fmtAll", () => {
      runGoalOnAllTargets("fmt");
    })
  );
  context.subscriptions.push(
    vscode.commands.registerCommand("suspenders.lintAll", () => {
      runGoalOnAllTargets("lint");
    })
  );
  context.subscriptions.push(
    vscode.commands.registerCommand("suspenders.testAll", () => {
      runGoalOnAllTargets("test");
    })
  );

  const sourceRootsProvider = new SourceRootsProvider(rootPath);
  vscode.window.registerTreeDataProvider("source-roots", sourceRootsProvider);
  vscode.commands.registerCommand("suspenders.source-roots.refresh", () =>
    sourceRootsProvider.refresh()
  );

  const targetsProvider = new TargetsProvider(rootPath);
  vscode.window.registerTreeDataProvider("targets", targetsProvider);
  vscode.commands.registerCommand("suspenders.targets.refresh", () =>
    targetsProvider.refresh()
  );

  vscode.commands.executeCommand("setContext", "suspenders:isActivated", true);
}

export function deactivate() {}
