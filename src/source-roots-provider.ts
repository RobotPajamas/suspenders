import * as vscode from "vscode";
import * as proc from "child_process";

export class SourceRootsProvider implements vscode.TreeDataProvider<SourceRoot> {
  private _onDidChangeTreeData: vscode.EventEmitter<SourceRoot | undefined | void> =
    new vscode.EventEmitter<SourceRoot | undefined | void>();
  readonly onDidChangeTreeData: vscode.Event<SourceRoot | undefined | void> =
    this._onDidChangeTreeData.event;

  constructor(private rootPath: string | undefined) {}

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: SourceRoot): vscode.TreeItem | Thenable<vscode.TreeItem> {
    return element;
  }

  getChildren(element?: SourceRoot | undefined): vscode.ProviderResult<SourceRoot[]> {
    if (!this.rootPath) {
      vscode.window.showInformationMessage("No pants.toml in empty workspace");
      return Promise.resolve([]);
    }

    const executable = "pants";
    const stdout = proc.execSync(`${executable} roots`).toString().trim();
    const roots = stdout.split("\n");
    const sourceRoots = roots.map((r) => new SourceRoot(r));
    return Promise.resolve(sourceRoots);
  }
}

export class SourceRoot extends vscode.TreeItem {
  constructor(label: string) {
    super(label, vscode.TreeItemCollapsibleState.None);
  }
}
