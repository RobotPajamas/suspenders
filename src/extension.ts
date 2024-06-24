import * as proc from "child_process";
import * as vscode from "vscode";
import { TargetsProvider, SourceRootsProvider } from "./treeviews";
import { logger } from "./logging";
import { CodeLensProvider } from "./codelens";
import { TestsProvider } from "./test-explorer";
import { getPantsExecutable } from "./configuration";
import { createLanguageClient, generateBuiltinsFile } from "./lsp/client";
import { DidChangeConfigurationNotification, LanguageClient } from "vscode-languageclient/node";

// TODO: Destructure vscode imports
let lspClient: LanguageClient;
// let disposables: vscode.Disposable[] = [];

const extensionName = "robotpajamas.vscode-suspenders";
const extensionVersion = "0.0.2";

export async function activate(context: vscode.ExtensionContext) {
  logger.info(`Extension name: ${extensionName}`);
  logger.info(`Extension version: ${extensionVersion}`);

  const rootPath =
    vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0
      ? vscode.workspace.workspaceFolders[0].uri.fsPath
      : undefined;

  context.subscriptions.push(
    vscode.commands.registerCommand("suspenders.checkAll", () => {
      runGoalOnAllTargets("check", rootPath);
    })
  );
  context.subscriptions.push(
    vscode.commands.registerCommand("suspenders.fmtAll", () => {
      runGoalOnAllTargets("fmt", rootPath);
    })
  );
  context.subscriptions.push(
    vscode.commands.registerCommand("suspenders.lintAll", () => {
      runGoalOnAllTargets("lint", rootPath);
    })
  );
  context.subscriptions.push(
    vscode.commands.registerCommand("suspenders.testAll", () => {
      runGoalOnAllTargets("test", rootPath);
    })
  );

  const sourceRootsProvider = new SourceRootsProvider(rootPath);
  vscode.window.registerTreeDataProvider("source-roots", sourceRootsProvider);
  context.subscriptions.push(
    vscode.commands.registerCommand("suspenders.source-roots.refresh", () =>
      sourceRootsProvider.refresh()
    )
  );

  const targetsProvider = new TargetsProvider(rootPath);
  vscode.window.registerTreeDataProvider("targets", targetsProvider);
  context.subscriptions.push(
    vscode.commands.registerCommand("suspenders.targets.refresh", () => targetsProvider.refresh())
  );

  vscode.commands.executeCommand("setContext", "suspenders:isActivated", true);

  // const codeLensProvider = new CodeLensProvider();
  // vscode.languages.registerCodeLensProvider({ pattern: "**/BUILD*" }, codeLensProvider);

  const testController = vscode.tests.createTestController(
    "suspenders-test-controller",
    "All of the Tests"
  );
  const testsProvider = new TestsProvider(testController);
  context.subscriptions.push(
    vscode.commands.registerCommand("suspenders.tests.refresh", () => testsProvider.refresh())
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("suspenders.generateBuiltins", async () => {
      try {
        await generateBuiltinsFile(rootPath);
        lspClient.sendNotification(DidChangeConfigurationNotification.type, {
          settings: null,
        });
      } catch (e) {
        logger.error(`Error generating builtins file: ${e}`);
      }
    })
  );

  // Hardcoding this in as a POC - TODO Pull into LSP layer
  lspClient = createLanguageClient(context);
  await lspClient.start(); // Throwing away the promise return
  context.subscriptions.push(lspClient);
  lspClient.sendNotification(DidChangeConfigurationNotification.type, {
    settings: null,
  });
}

export function deactivate() {
  // if (disposables) {
  //   disposables.forEach((item) => item.dispose());
  // }
  // disposables = [];
}

// TODO: Kibosh this - many better ways coming up than this using the new `peek`
function runGoalOnAllTargets(name: string, cwd?: string): void {
  logger.show();

  const options: proc.SpawnOptions = {
    cwd,
  };
  const subprocess = proc.spawn(getPantsExecutable(), [name, "::"], options);
  subprocess.stdout?.on("data", (data) => logger.log(data.toString()));
  subprocess.stderr?.on("data", (data) => logger.log(data.toString()));
}
