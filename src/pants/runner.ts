import { execSync } from "child_process";
import { GoalArg, Options } from "./goals";

// TODO: Sanitize any executable arguments

export class Pants {
  // private readonly pantsExe = "pants";
  // TODO: Running into a peek problem while trying to PR to main
  private readonly pantsExe = "./pants_from_sources";

  /**
   *
   * @param buildRoot The root of the Pants build, which is the directory containing the pants.toml file.
   */
  constructor(readonly buildRoot: string) {}

  /**
   * Run a Pants goal with any optional scoped options (e.g. global options or scoped goal options).
   *
   * @param goals A list of goals (and optional unscoped options) to run. For example, ["lint", "test"].
   * @param target The target to run the goal on. For example, "src/helloworld:mylib" or "::".
   * @param scopedOptions A map of scoped options to run, which will be placed betwee the Pants executable and goals.
   * @returns
   */
  async execute(goals: GoalArg[], target: string, scopedOptions?: Options): Promise<string> {
    // Ensure there is at least one goal
    if (goals.length === 0) {
      throw new Error("No goals specified");
    }

    // Build up the command from the executable, scoped options, goals, and target
    const args = [this.pantsExe];
    if (scopedOptions) {
      args.push(...this.buildOptions(scopedOptions));
    }
    for (const goal of goals) {
      args.push(...this.buildGoalArg(goal));
    }
    args.push(target);

    // Run the command and return the output
    const command = args.join(" ");
    const stdout = execSync(command, { cwd: this.buildRoot, encoding: "utf-8" }).toString().trim();

    return stdout;
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
