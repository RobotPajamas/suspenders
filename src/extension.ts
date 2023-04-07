import * as vscode from "vscode";
import * as proc from "child_process";
import { SourceRootsProvider } from "./source-roots-provider";
import { TargetsProvider } from "./targets-provider";
import { logger } from "./logging";

// TODO: Destructure vscode imports

// let disposables: vscode.Disposable[] = [];

function runGoalOnAllTargets(name: string, cwd?: string): void {
  logger.show();

  const options: proc.SpawnOptions = {
    cwd,
  };
  const subprocess = proc.spawn("./pants", [name, "::"], options);
  subprocess.stdout?.on("data", (data) => logger.log(data.toString()));
  subprocess.stderr?.on("data", (data) => logger.log(data.toString()));
}

const extensionName = "robotpajamas.vscode-suspenders";
const extensionVersion = "0.0.1";

export function activate(context: vscode.ExtensionContext) {
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

  const codeLensProvider = new CodeLensProvider();
  vscode.languages.registerCodeLensProvider({ pattern: "**/BUILD*" }, codeLensProvider);
}

export function deactivate() {
  // if (disposables) {
  //   disposables.forEach((item) => item.dispose());
  // }
  // disposables = [];
}

export class CodeLensProvider implements vscode.CodeLensProvider {
  private codeLenses: vscode.CodeLens[] = [];
  private regex: RegExp;
  private _onDidChangeCodeLenses: vscode.EventEmitter<void> = new vscode.EventEmitter<void>();
  public readonly onDidChangeCodeLenses: vscode.Event<void> = this._onDidChangeCodeLenses.event;

  constructor() {
    this.regex = /(.+)/g;

    // TODO: Wrap this in a check for whether the code lens config (when created) actually changed or not
    vscode.workspace.onDidChangeConfiguration((_) => {
      this._onDidChangeCodeLenses.fire();
    });
  }

  public async provideCodeLenses(
    document: vscode.TextDocument,
    token: vscode.CancellationToken
  ): Promise<vscode.CodeLens[]> {
    // Don't show lenses if file isn't saved, since they'll be janky and we don't want to accidentally run the wrong command on the wrong args
    if (document.isDirty) {
      return [];
    }

    // Can we use Peek to get the targets for this file? Or is it faster to just parse the document?
    // Alternatively, when we build out the tree - we already kinda have targets for this BUILD file
    // As a cheapo - could just grab all known target aliases and then regex down - not performant, but just a first pass
    const fakeTargets = ["pyoxidizer_binary", "scie_binary", "python_test"]; // yada yada
    const aliasToGoals: { [key: string]: string[] } = {
      pyoxidizer_binary: ["Package", "Run"],
      scie_binary: ["Package", "Run"],
      python_test: ["Test"],
    };

    const regex = new RegExp(fakeTargets.join("|"), "g");
    const text = document.getText();

    // Create a codelens for each regex match
    const fakeLenses = [];
    let matches;
    while ((matches = regex.exec(text)) !== null) {
      const line = document.lineAt(document.positionAt(matches.index).line);
      const indexOf = line.text.indexOf(matches[0]);
      const position = new vscode.Position(line.lineNumber, indexOf);
      const range = document.getWordRangeAtPosition(position, new RegExp(fakeTargets.join("|")));
      if (range) {
        const alias = matches[0];
        const goals = aliasToGoals[alias];
        for (const goal of goals) {
          fakeLenses.push(
            new vscode.CodeLens(range, {
              title: goal,
              command: "suspenders.todo", // do something
              tooltip: `${goal} ${alias}`,
              // arguments: [document, range],
            })
          );
        }
      }
    }
    return fakeLenses;
  }
}
