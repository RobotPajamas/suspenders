import * as vscode from "vscode";
import * as proc from "child_process";

export class TargetsProvider implements vscode.TreeDataProvider<Target> {
  private _onDidChangeTreeData: vscode.EventEmitter<Target | undefined | void> =
    new vscode.EventEmitter<Target | undefined | void>();
  readonly onDidChangeTreeData: vscode.Event<Target | undefined | void> =
    this._onDidChangeTreeData.event;

  constructor(private rootPath: string | undefined) {}

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: Target): vscode.TreeItem | Thenable<vscode.TreeItem> {
    return element;
  }

  getChildren(element?: Target | undefined): vscode.ProviderResult<Target[]> {
    if (!this.rootPath) {
      vscode.window.showInformationMessage("No pants.toml in empty workspace");
      return Promise.resolve([]);
    }

    const executable = "pants";
    if (element) {
      const stdout = proc
        .execSync(`${executable} dependencies --transitive ${element.label}`, {
          cwd: this.rootPath,
        })
        .toString()
        .trim();
      const targetLines = stdout.split("\n");
      const targets = targetLines.map((t) => new Target(t, vscode.TreeItemCollapsibleState.None));
      return Promise.resolve(targets);
    } else {
      const stdout = proc
        .execSync(`${executable} filter --filter-granularity=BUILD ::`, { cwd: this.rootPath })
        .toString();
      const targetLines = stdout.split("\n");
      const targets = targetLines.map(
        (t) => new Target(t, vscode.TreeItemCollapsibleState.Collapsed)
      );
      return Promise.resolve(targets);
    }
  }
}

export class Target extends vscode.TreeItem {
  constructor(label: string, collapsedState: vscode.TreeItemCollapsibleState) {
    super(label, collapsedState);
  }
}
