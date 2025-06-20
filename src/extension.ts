import * as proc from "child_process";
import * as vscode from "vscode";
import { TargetsProvider, SourceRootsProvider } from "./treeviews";
import { logger } from "./logging";
import { getPantsExecutable, shouldGenerateBuiltinsOnSave } from "./configuration";
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

  await checkPantsExecutableExists();
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration(async (event) => {
      if (event.affectsConfiguration("suspenders.executable")) {
        await checkPantsExecutableExists();
      }
    })
  );

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

  context.subscriptions.push(
    vscode.commands.registerCommand("suspenders.generateBuiltins", async () => {
      try {
        await generateBuiltinsFile(rootPath);
        lspClient.sendNotification(DidChangeConfigurationNotification.type, {
          settings: null,
        });
      } catch (e) {
        // TODO: Look into a more homogenous logging system - when I actually log more than 1 thing
        // e.g. update logger with a ProgressLocation - so we can log and also show UI in one place
        logger.error(`Error generating __builtins__.pyi file: ${e}`);
        // vscode.window.setStatusBarMessage("$(error) Build failed", 5000);
        const choice = await vscode.window.showErrorMessage(
          "Error generating __builtins__.pyi file",
          "Open Logs"
        );
        if (choice === "Open Logs") {
          logger.show();
        }
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

  // TODO: Where should variables like this be held?
  let isTomlDirty = false;
  context.subscriptions.push(
    vscode.workspace.onWillSaveTextDocument((event) => {
      logger.debug(
        `WillSave: File ${event.document.fileName} - isDirty ${event.document.isDirty} - Reason ${event.reason}`
      );
      if (event.document.fileName === `${rootPath}/pants.toml`) {
        isTomlDirty = event.document.isDirty;
      }
    })
  );
  context.subscriptions.push(
    vscode.workspace.onDidSaveTextDocument((doc) => {
      // TODO: An optimization would be to create or dispose of this subscription when config changes
      if (!shouldGenerateBuiltinsOnSave()) {
        return;
      }
      logger.log(`DidSave: ${doc.fileName} - ${doc.isDirty}`);
      if (doc.fileName === `${rootPath}/pants.toml` && isTomlDirty) {
        // TODO: Should notify the user, and then self-dismiss when complete
        vscode.commands.executeCommand("suspenders.generateBuiltins");
        isTomlDirty = false;
      }
    })
  );
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

// TODO: Build out more infrastructure around SciePants and versioning
async function checkPantsExecutableExists() {
  const executable = getPantsExecutable();
  const result = proc.spawnSync(executable, {
    env: { ...process.env, PANTS_BOOTSTRAP_VERSION: "report" },
    timeout: 100, // Arbitrarily small timeout
  });
  if (result.error) {
    const choice = await vscode.window.showErrorMessage(
      `Unable to find Pants executable: ${executable}`,
      "Open Settings"
    );
    if (choice === "Open Settings") {
      vscode.commands.executeCommand("workbench.action.openSettings", "suspenders.executable");
    }
  }
}
