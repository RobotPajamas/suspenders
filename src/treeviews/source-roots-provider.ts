import { EventEmitter, TreeDataProvider, TreeItem, TreeItemCollapsibleState } from "vscode";
import { Pants } from "../pants";
import { SourceRoot } from "./tree-item";

/**
 * A TreeDataProvider that provides a list of source roots in the workspace.
 * The source roots are discovered by running `pants roots` in the workspace root.
 * For each source root, a SourceRoot tree item is created, and displayed in the tree view.
 * At the moment, there is no nesting of source roots - they are all displayed at the root level, fully qualified.
 *
 * TODO: Add nesting of source roots.
 */
export class SourceRootsProvider implements TreeDataProvider<SourceRoot> {
  private runner: Pants;

  private _onDidChangeTreeData = new EventEmitter<SourceRoot | undefined | void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  /**
   * The constructor for the SourceRootsProvider.
   *
   * @param rootPath The path to the workspace root.
   */
  constructor(private rootPath?: string) {
    // TODO: Should we throw if there is no rootpath?
    this.runner = new Pants(rootPath ?? "");
  }

  /**
   * Refresh the tree view.
   */
  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: SourceRoot): TreeItem | Promise<TreeItem> {
    return element;
  }

  /**
   * Get the children of the given element, or the root elements if no element is provided.
   *
   * @param element The optional element to get the children of.
   * @returns A list of {@link SourceRoot}.
   */
  async getChildren(element?: SourceRoot): Promise<SourceRoot[]> {
    if (!this.rootPath) {
      return [];
    }

    const roots = await listSourceRoots(this.runner);
    return roots.map((r) => new SourceRoot(r));
  }
}

/**
 * Run the pants command which lists the source roots in the workspace.
 *
 * @param runner The Pants runner instance used to discover the source roots.
 * @returns A list of strings representing the source roots in the workspace (e.g. ["src/helloworld", "src/goodbyeworld"]). If there are no source roots, an empty list is returned.
 */
export async function listSourceRoots(runner: Pants): Promise<string[]> {
  const result = await runner.execute([{ goal: "roots" }], "");
  return result === "" ? [] : result.split("\n");
}
