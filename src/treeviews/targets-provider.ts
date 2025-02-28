import { EventEmitter, TreeDataProvider, TreeItem } from "vscode";
import * as path from "path";
import { FolderTreeItem, PantsTreeItem, PeekTree, Target, TargetTreeItem } from "./tree-item";
import { PeekResult, Address, Pants, GoalArg, Options } from "../pants";
import { ignoreLockfiles } from "../configuration";

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
    const peekResults = await peek(this.runner, "::");
    const targets = mapPeekResultsToTargets(peekResults);
    const targetMap = createTargetMap(targets);

    const rootTree: PeekTree = {
      id: path.basename(this.rootPath),
      name: "root",
      targets: [],
      children: new Map(),
    };

    // Attach the targets to the root tree
    for (const path of targetMap.keys()) {
      if (path === "") {
        continue;
      }

      if (path === "//") {
        targetMap.get(path)?.forEach((target) => {
          rootTree.targets.push(target);
        });
      }

      this.attach(path, path, rootTree, targetMap);
    }

    let children: PantsTreeItem[] = [];
    for (const target of rootTree.targets) {
      children.push(new TargetTreeItem(target, this.runner.buildRoot));
    }
    for (const child of rootTree.children.values()) {
      children.push(new FolderTreeItem(child, this.runner.buildRoot));
    }
    return children;
  }

  /**
   * TODO: Come back to this
   */
  createNode(path: string, name: string, targets: ReadonlyMap<string, Target[]>): PeekTree {
    return {
      id: path,
      name: name,
      targets: targets.get(path) ?? [],
      children: new Map(),
    };
  }

  /**
   * TODO: Come back to this
   */
  attachNodeToTree(trunk: PeekTree, node: string, newNode: PeekTree): PeekTree {
    if (!trunk.children.has(node)) {
      trunk.children.set(node, newNode);
    }
    return trunk.children.get(node) as PeekTree;
  }

  /**
   * Builds a tree-like structure out of the given path/subpath and attaches it to the given trunk.
   * TODO: Come back to this
   */
  attach(
    path: string,
    subPath: string,
    trunk: PeekTree,
    targets: ReadonlyMap<string, Target[]>
  ): void {
    const parts = subPath.split("/");
    if (parts.length === 1) {
      // This is the terminal folder
      trunk.children.set(parts[0], this.createNode(path, parts[0], targets));
      return;
    }

    // This is a subfolder
    const node = parts.shift();
    if (!node) {
      return;
    }
    const others = parts.join("/");
    const newNode = this.createNode(path, node, targets);
    const childNode = this.attachNodeToTree(trunk, node, newNode);
    this.attach(path, others, childNode, targets);
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
    },
  };
  const unscopedOptions: Options = {
    "filter-granularity": "BUILD",
  };
  if (ignoreLockfiles()) {
    unscopedOptions["filter-target-type"] = "-_lockfiles";
  }

  const result = await runner.execute([goalArgs], target, unscopedOptions);
  return result == "" ? [] : JSON.parse(result);
}

/**
 * Map the list of PeekResults to a list of Targets.
 *
 * @param peekResults A list of {@link PeekResult}.
 * @returns A list of {@link Target}.
 */
export function mapPeekResultsToTargets(peekResults: PeekResult[]): Target[] {
  return peekResults.map((result) => {
    return {
      address: Address.parse(result.address),
      type: result.target_type,
    };
  });
}

/**
 * Create a map of targets keyed by their path.
 *
 * @param targets A list of {@link Target}.
 * @returns A map of targets keyed by their path.
 */
export function createTargetMap(targets: Target[]): Map<string, Target[]> {
  return targets.reduce((map, target) => {
    const path = target.address.path;
    return map.set(path, [...(map.get(path) || []), target]);
  }, new Map<string, Target[]>());
}
