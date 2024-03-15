import { TreeItem, TreeItemCollapsibleState, ThemeIcon, Uri } from "vscode";
import * as path from "path";
import { Address } from "../pants/address";
import { getBuildFileExtension } from "../configuration";

// The TargetProvider can have several types of tree items.
// The leaf nodes are the TargetTreeItems, which are the actual targets.
// The intermediate nodes are the FolderTreeItems, which are the folders that may contain BUILD files.
// The root node is a FolderTreeItem, which is the root of the workspace.

/**
 * A tree item that represents a Pants source root.
 * https://www.pantsbuild.org/docs/source-roots
 */
export class SourceRoot extends TreeItem {
  constructor(label: string) {
    super(label, TreeItemCollapsibleState.None);
  }
}

export type Target = {
  address: Address;
  type: string;
};

export type PeekTree = {
  id: string;
  name: string;
  targets: Target[];
  children: Map<string, PeekTree>;
};

export interface PantsTreeItem extends TreeItem {
  canHaveChildren(): boolean;
  getChildren(): Promise<PantsTreeItem[]>;
}

/**
 * A tree item that represents a folder in the workspace.
 */
export class FolderTreeItem extends TreeItem implements PantsTreeItem {
  /**
   * Takes in a path to a folder, and a Pants runner.
   * Strips the first part of the path as its label, and passes the rest to the next FolderTreeItem.
   *
   * @param subtree
   * @param runner
   */
  constructor(
    readonly subtree: PeekTree,
    readonly buildRoot: string
  ) {
    super(subtree.name, TreeItemCollapsibleState.Collapsed);
    this.iconPath = new ThemeIcon("folder");
  }

  /**
   * Folders can have children, so this always returns true.
   *
   * @returns true, since folders can have children.
   */
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

/**
 * A tree item that represents a Pants target.
 */
export class TargetTreeItem extends TreeItem implements PantsTreeItem {
  /**
   * Takes in a Pants target, and a path to the build root.
   * The label is the target name, and the icon is based on the target type.
   *
   * @param target The Pants target.
   * @param buildRoot The path to the build root.
   */
  constructor(target: Target, buildRoot: string) {
    const label = `${target.address.targetName} (${target.type})`;
    super(label, TreeItemCollapsibleState.None);
    this.iconPath = this.getIcon(target.type);
    this.contextValue = "deploy package publish run test"; // TODO: Pipe goals from peek into this
    this.command = {
      command: "vscode.open",
      title: "Open this BUILD file",
      arguments: [Uri.file(path.join(buildRoot, target.address.path, `BUILD${getBuildFileExtension()}`))],
    };
  }

  /**
   * Targets cannot have children, so this always returns false.
   *
   * @returns false, since targets cannot have children.
   */
  public canHaveChildren(): boolean {
    return false;
  }

  /**
   * This is the method that is called when the user expands a tree item containing a Target.
   * It should return an empty list, since targets cannot have children.
   *
   * @returns An empty list, since targets cannot have children.
   */
  public async getChildren(): Promise<PantsTreeItem[]> {
    return [];
  }

  // Colours don't seem to work for some reason? Haven't found a working attempt yet.
  // Other than custom SVGs coloured appropriately
  private getIcon(type: string): ThemeIcon {
    if (type.endsWith("library")) {
      return new ThemeIcon("library", "list.activeSelectionBackground");
    } else if (type.endsWith("distribution")) {
      return new ThemeIcon("archive", "blue");
    } else if (type.endsWith("binary")) {
      return new ThemeIcon("package", "#ff00bb");
    } else if (type.endsWith("test")) {
      return new ThemeIcon("beaker", "#ff00bb");
    } else if (type.endsWith("sources")) {
      return new ThemeIcon("code", "#ff00bb");
    } else {
      return new ThemeIcon("file");
    }
  }
}
