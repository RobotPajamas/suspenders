import {
  CancellationToken,
  CodeLens,
  CodeLensProvider,
  EventEmitter,
  Range,
  TextDocument,
  workspace,
} from "vscode";
import { logger } from "../logging";
import { PeekResult, Address, Pants, GoalArg, Options } from "../pants";
import { ignoreLockfiles } from "../configuration";
import path from "path";

export class BuildCodeLensProvider implements CodeLensProvider {
  private runner: Pants;
  private _onDidChangeCodeLenses = new EventEmitter<void>();
  public readonly onDidChangeCodeLenses = this._onDidChangeCodeLenses.event;

  constructor(private rootPath?: string) {
    // TODO: Should we throw if there is no rootpath?
    this.runner = new Pants(rootPath ?? "");

    // TODO: Should this be registered in extension.ts? File watchers feel re-usable
    const watcher = workspace.createFileSystemWatcher("**/BUILD", true, false, true);
    watcher.onDidChange(() => {
      this._onDidChangeCodeLenses.fire();
    }, this); // TODO: Add disposables

    // TODO: This should only care about our upcoming codelens enable/disable config
    workspace.onDidChangeConfiguration((_) => {
      this._onDidChangeCodeLenses.fire();
    });
  }

  async provideCodeLenses(document: TextDocument, token: CancellationToken): Promise<CodeLens[]> {
    if (document.isDirty) {
      // An unsaved document can be gibberish
      return [];
    }

    // TODO: Should probably allow enable/disable codelens config to be a good citizen (also because this won't work before Pants 2.24)

    const relativePath = path.dirname(path.relative(this.runner.buildRoot, document.uri.fsPath));
    const peekResults = await peek(this.runner, `${relativePath}:`);
    const text = document.getText();

    // TODO: This could be made more efficient if peek is guaranteed to emit in top-down BUILD order
    let lenses: CodeLens[] = [];
    for (const pr of peekResults) {
      const address = Address.parse(pr.address);
      const nameIndex = text.indexOf(`name="${address.targetName}"`);
      if (nameIndex < 0) {
        continue;
      }
      const targetIndex = text.lastIndexOf(pr.target_type, nameIndex);
      const position = document.positionAt(targetIndex);

      const goals = pr.goals ?? [];
      for (const goal of goals) {
        const range = new Range(position, position);
        lenses.push(
          new CodeLens(range, {
            command: "pants --version",
            title: goal,
          })
        );
      }
    }

    return lenses;
  }
  // resolveCodeLens?(codeLens: CodeLens, token: CancellationToken): ProviderResult<CodeLens> {
  //     console.log("resolveCodeLens", codeLens);
  //     return null;
  // }
}

/**
 * TODO: Probably should merge with the other peek call?
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
