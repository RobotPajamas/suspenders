import * as vscode from "vscode";

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
