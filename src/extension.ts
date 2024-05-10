import * as vscode from "vscode";
import * as proc from "child_process";
import * as path from "path";
import { TargetsProvider, SourceRootsProvider } from "./treeviews";
import { logger } from "./logging";
import { CodeLensProvider } from "./codelens";
import { TestsProvider } from "./test-explorer";
import { getPantsExecutable } from "./configuration";
import {
  CancellationToken,
  ConfigurationParams,
  ConfigurationRequest,
  DidChangeConfigurationNotification,
  LanguageClient,
  LanguageClientOptions,
  ResponseError,
  ServerOptions,
  TransportKind,
} from "vscode-languageclient/node";

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
  vscode.commands.registerCommand("suspenders.source-roots.refresh", () =>
    sourceRootsProvider.refresh()
  );

  const targetsProvider = new TargetsProvider(rootPath);
  vscode.window.registerTreeDataProvider("targets", targetsProvider);
  vscode.commands.registerCommand("suspenders.targets.refresh", () => targetsProvider.refresh());

  vscode.commands.executeCommand("setContext", "suspenders:isActivated", true);

  // const codeLensProvider = new CodeLensProvider();
  // vscode.languages.registerCodeLensProvider({ pattern: "**/BUILD*" }, codeLensProvider);

  const testController = vscode.tests.createTestController(
    "suspenders-test-controller",
    "All of the Tests"
  );
  const testsProvider = new TestsProvider(testController);
  vscode.commands.registerCommand("suspenders.tests.refresh", () => testsProvider.refresh());

  // Hardcoding this in as a POC
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

// TODO: Grabbed this from https://github.com/microsoft/pyright/blob/496e50f65c8d3aecc43dcbc9b960d633cafe0c94/packages/vscode-pyright/src/extension.ts#L96
// Spend some time cleaning it up for our purposes
function createLanguageClient(context: vscode.ExtensionContext) {
  let serverModule = context.asAbsolutePath(
    path.join("node_modules", "pyright", "langserver.index.js")
  );
  const debugOptions = { execArgv: ["--nolazy", "--inspect=6600"] };

  // TODO: Is stdio necessary? I ran into some errors using node ipc, but maybe those were false positives
  const serverOptions: ServerOptions = {
    run: { module: serverModule, transport: TransportKind.stdio, args: ["--stdio"] },
    debug: {
      module: serverModule,
      transport: TransportKind.stdio,
      args: ["--stdio"],
      options: debugOptions,
    },
  };

  const clientOptions: LanguageClientOptions = {
    // TODO: this can also be a pattern on BUILD files, but I feel like language-based is more "correct"
    documentSelector: [{ scheme: "file", language: "pantsbuild" }],
    middleware: {
      workspace: {
        configuration: async (
          params: ConfigurationParams,
          token: CancellationToken,
          next: ConfigurationRequest.HandlerSignature
        ) => {
          let result = next(params, token);

          if (isThenable(result)) {
            logger.debug("createLanguageClient: Result is Thenable");
            result = await result;
          }
          logger.debug(
            `createLanguageClient: Params: ${JSON.stringify(params)} - Result: ${JSON.stringify(result)}`
          );

          if (result instanceof ResponseError) {
            logger.error(`createLanguageClient: ResponseError: ${JSON.stringify(result)}`);
            return result;
          }

          for (const [i, item] of params.items.entries()) {
            logger.debug(`Entries: ${i} ${JSON.stringify(item)}`);

            // TODO: Hardcoding this as a proof-of-concept, but this should probably be part of Suspenders config
            if (item.section === "python.analysis") {
              (result[i] as any).stubPath = "./.pants.d";
            }
          }

          return result;
        },
      },
    },
  };

  return new LanguageClient("PantsBuild LSP Client", serverOptions, clientOptions);
}

function isThenable<T>(v: any): v is Thenable<T> {
  return typeof v?.then === "function";
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
