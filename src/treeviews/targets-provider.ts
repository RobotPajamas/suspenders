import * as vscode from "vscode";
import * as path from "path";
import { FolderTreeItem, PantsTreeItem, PeekTree, Target } from "./tree-item";
import { list, peek, PeekResult, Address, Pants } from "../pants";

export class TargetsProvider implements vscode.TreeDataProvider<PantsTreeItem> {
  private runner: Pants;

  private _onDidChangeTreeData: vscode.EventEmitter<PantsTreeItem | undefined | void> =
    new vscode.EventEmitter<PantsTreeItem | undefined | void>();
  readonly onDidChangeTreeData: vscode.Event<PantsTreeItem | undefined | void> =
    this._onDidChangeTreeData.event;

  constructor(private rootPath: string | undefined) {
    // TODO: Should we throw if there is no rootpath?
    this.runner = new Pants(rootPath ?? "");
  }

  public refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  public getTreeItem(element: PantsTreeItem): vscode.TreeItem | Promise<vscode.TreeItem> {
    return element;
  }

  public async getChildren(element?: PantsTreeItem | undefined): Promise<PantsTreeItem[]> {
    if (!this.rootPath) {
      vscode.window.showInformationMessage("No pants.toml in empty workspace");
      return [];
    }

    if (element) {
      // This is not the root node, so defer to the element's getChildren method.
      // This allows the FolderTreeItem to enumerate its children, and TargetTreeItem to return an empty list.
      return element.getChildren();
    }

    // This is the root node, so we need to enumerate the folders in the workspace.
    // Peek the whole workspace, and create a tree-like structure out of the results.
    // TODO: Clean this all up - it's a mess.
    const peekResults = await peek(this.runner, "::");

    // Create a map of targets to their paths
    const targets = new Map<string, Target[]>();
    for (const result of peekResults) {
      const target: Target = {
        address: Address.parse(result.address),
        type: result.target_type,
      };
      const path = target.address.path;
      if (targets.has(path)) {
        targets.get(path)?.push(target);
      } else {
        targets.set(path, [target]);
      }
    }

    const rootTree: PeekTree = {
      id: path.basename(this.rootPath),
      name: "root",
      targets: [],
      children: new Map(),
    };

    for (const path of targets.keys()) {
      if (path === "") {
        continue;
      }
      this.attach(path, path, rootTree, targets);
    }

    return Array.from(rootTree.children.values()).map(
      (c) => new FolderTreeItem(c, this.runner.buildRoot)
    );
  }

  private attach(
    path: string,
    subPath: string,
    trunk: PeekTree,
    targets: ReadonlyMap<string, Target[]>
  ): void {
    const parts = subPath.split("/");
    if (parts.length === 1) {
      // This is the terminal folder
      trunk.children.set(parts[0], {
        id: path,
        name: parts[0],
        targets: targets.get(path) ?? [],
        children: new Map(),
      });
    } else {
      const node = parts.shift();
      if (!node) {
        return;
      }
      const others = parts.join("/");
      if (!trunk.children.has(node)) {
        trunk.children.set(node, {
          id: path,
          name: node,
          targets: targets.get(path) ?? [],
          children: new Map(),
        });
      }
      this.attach(path, others, trunk.children.get(node) as PeekTree, targets);
    }
  }
}
