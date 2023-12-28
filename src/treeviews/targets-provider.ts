import { EventEmitter, TreeDataProvider, TreeItem } from "vscode";
import * as path from "path";
import { FolderTreeItem, PantsTreeItem, PeekTree, Target } from "./tree-item";
import { PeekResult, Address, Pants, GoalArg, Options } from "../pants";

export class TargetsProvider implements TreeDataProvider<PantsTreeItem> {
  private runner: Pants;

  private _onDidChangeTreeData = new EventEmitter<PantsTreeItem | undefined | void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  /**
   * The constructor for the TargetsProvider.
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
  public refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  public getTreeItem(element: PantsTreeItem): TreeItem | Promise<TreeItem> {
    return element;
  }

  /**
   * Get the children of the given element, or the root elements if no element is provided.
   * If an element is provided, it will defer to the element's getChildren method.
   *
   * @param element The optional element to get the children of.
   * @returns A list of {@link SourceRoot}.
   */
  public async getChildren(element?: PantsTreeItem): Promise<PantsTreeItem[]> {
    if (!this.rootPath) {
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

/**
 * Run the pants command which enumerates the targets in the workspace.
 *
 * @param runner The Pants runner instance used to discover the targets.
 * @returns A list of {@link PeekResult} or an empty list if there are no targets.
 */
export async function peek(runner: Pants, target: string): Promise<PeekResult[]> {
  const goalArgs: GoalArg = {
    goal: "peek",
    unscopedOptions: {
      "exclude-defaults": "",
      // "include-goals": "",
    },
  };
  const unscopedOptions: Options = {
    "filter-granularity": "BUILD",
  };

  const result = await runner.execute([goalArgs], target, unscopedOptions);
  return result == "" ? [] : JSON.parse(result);
}
