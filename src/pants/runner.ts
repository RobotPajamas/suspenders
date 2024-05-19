import { spawnSync } from "child_process";
import { GoalArg, Options } from "./goals";
import { getPantsExecutable } from "../configuration";

// TODO: Sanitize any executable arguments

export class Pants {
  /**
   *
   * @param buildRoot The root of the Pants build, which is the directory containing the pants.toml file.
   */
  constructor(
    readonly buildRoot: string,
    readonly exe: string = getPantsExecutable()
  ) {}

  /**
   * Run a Pants goal with any optional scoped options (e.g. global options or scoped goal options).
   *
   * @param goals A list of goals (and optional unscoped options) to run. For example, ["lint", "test"].
   * @param target The target to run the goal on. For example, "src/helloworld:mylib" or "::".
   * @param scopedOptions A map of scoped options to run, which will be placed betwee the Pants executable and goals.
   * @returns
   */
  async execute(goals: GoalArg[], target?: string, scopedOptions?: Options): Promise<string> {
    // Ensure there is at least one goal
    if (goals.length === 0) {
      throw new Error("No goals specified");
    }

    // Build up the command from the executable, scoped options, goals, and target
    const args = [];
    if (scopedOptions) {
      args.push(...this.buildOptions(scopedOptions));
    }
    for (const goal of goals) {
      args.push(...this.buildGoalArg(goal));
    }
    if (target) {
      args.push(target);
    }

    // Run the command and return the output
    const command = args.join(" ");
    // TODO: Use `spawn` and handle this in buffered chunks
    const result = spawnSync(this.exe, args, {
      cwd: this.buildRoot,
      encoding: "utf-8",
      maxBuffer: 1024 * 1024 * 5, // 5MB seems reasonable as a max for help-all
    });
    return result.stdout?.trim() ?? "";
  }

  private buildGoalArg(goal: GoalArg): string[] {
    const { goal: goalName, unscopedOptions } = goal;
    const args: string[] = [goalName];

    if (unscopedOptions) {
      args.push(...this.buildOptions(unscopedOptions));
    }

    return args;
  }

  private buildOptions(options: Options): string[] {
    const args = [];

    for (const [key, value] of Object.entries(options)) {
      if (value === "") {
        args.push(`--${key}`);
        continue;
      }
      args.push(`--${key}=${value}`);
    }

    return args;
  }
}
