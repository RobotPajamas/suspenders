import * as vscode from "vscode";
import * as path from "path";
import { Address } from "./pants/address";
import { Pants } from "./pants/runner";

// The TargetProvider can have several types of tree items.
// The leaf nodes are the TargetTreeItems, which are the actual targets.
// The intermediate nodes are the FolderTreeItems, which are the folders that may contain BUILD files.
// The root node is a FolderTreeItem, which is the root of the workspace.

export interface Target {
  address: Address;
  type: string;
}

export interface PeekTree {
  id: string;
  name: string;
  targets: Target[];
  children: Map<string, PeekTree>;
}

export interface PantsTreeItem extends vscode.TreeItem {
  canHaveChildren(): boolean;
  getChildren(): Promise<PantsTreeItem[]>;
}

export class FolderTreeItem extends vscode.TreeItem implements PantsTreeItem {
  /**
   * Takes in a path to a folder, and a Pants runner.
   * Strips the first part of the path as its label, and passes the rest to the next FolderTreeItem.
   *
   * @param subtree
   * @param runner
   */
  constructor(readonly subtree: PeekTree, readonly buildRoot: string) {
    super(subtree.name, vscode.TreeItemCollapsibleState.Collapsed);
    this.iconPath = new vscode.ThemeIcon("folder");
  }

  canHaveChildren(): boolean {
    return true;
  }

  /**
   * This is the method that is called when the user expands a tree item containing a Folder.
   * It should return sub-folders, as well as targets in the current folder.
   * TODO: Pretending these have a depth of 1 for now (nested folders will come later)
   */
  async getChildren(): Promise<PantsTreeItem[]> {
    const folderTreeItems = Array.from(this.subtree.children.values()).map(
      (c) => new FolderTreeItem(c, this.buildRoot)
    );
    const targetTreeItems = this.subtree.targets.map((t) => new TargetTreeItem(t, this.buildRoot));
    return [...folderTreeItems, ...targetTreeItems];
  }
}

export class TargetTreeItem extends vscode.TreeItem implements PantsTreeItem {
  constructor(target: Target, buildRoot: string) {
    const label = `${target.address.targetName} (${target.type})`;
    super(label, vscode.TreeItemCollapsibleState.None);
    this.iconPath = this.getIcon(target.type);
    this.contextValue = "test"; // TODO: Testing something
    this.command = {
      command: "vscode.open",
      title: "Open this BUILD file",
      arguments: [vscode.Uri.file(path.join(buildRoot, target.address.path, "BUILD.pants"))],
    };
  }

  public canHaveChildren(): boolean {
    return false;
  }

  public async getChildren(): Promise<PantsTreeItem[]> {
    return [];
  }

  // Colours don't seem to work for some reason? Haven't found a working attempt yet.
  // Other than custom SVGs coloured appropriately
  private getIcon(type: string): vscode.ThemeIcon {
    if (type.endsWith("library")) {
      return new vscode.ThemeIcon("library", "list.activeSelectionBackground");
    } else if (type.endsWith("distribution")) {
      return new vscode.ThemeIcon("archive", "blue");
    } else if (type.endsWith("binary")) {
      return new vscode.ThemeIcon("package", "#ff00bb");
    } else if (type.endsWith("test")) {
      return new vscode.ThemeIcon("beaker", "#ff00bb");
    } else if (type.endsWith("sources")) {
      return new vscode.ThemeIcon("code", "#ff00bb");
    } else {
      return new vscode.ThemeIcon("file");
    }
  }
}
