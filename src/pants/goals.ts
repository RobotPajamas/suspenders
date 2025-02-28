import { Address } from "./address";
import { Pants } from "./runner";

export type Goal =
  | "check"
  | "fmt"
  | "lint"
  | "test"
  | "peek"
  | "dependencies"
  | "roots"
  | "list"
  | "help-all";

/**
 * A map of options to pass to the Pants runner.
 * The keys are the option names, and the values are the option values.
 * The map currently expects strings as values, but this may change in the future.
 *
 * For example, if using standalone scoped options, the options map could be:
 * const scopedOptions: Options = {
 *      "peek-exclude-defaults": "",
 *      "check-only": "mypy",
 * }
 * Which would result in the command line arguments:
 * ["--peek-exclude-defaults", "--check-only=mypy"]
 */
export type Options = {
  [key: string]: string;
};

/**
 * A goal and its unscoped options.
 * The options are unscoped because they are not prefixed with the goal name.
 *
 * For example, if using the `peek` goal, the options map could be:
 * const scopedOptions: Options = {
 *      "exclude-defaults": "",
 * }
 * Which would result in the command line arguments:
 * ["peek", "--exclude-defaults"]
 */
export type GoalArg = {
  goal: Goal;
  unscopedOptions?: Options;
};

/**
 * This PeekResult does not contain all the fields that Pants returns.
 * It only contains the fields that are relevant to the extension.
 */
export type PeekResult = {
  /**
   * The address of the target. e.g. `src/python/project:lib`
   */
  address: string;
  /**
   * The type of the target. e.g. `pex_binary`
   */
  target_type: string;
  /**
   * The goals that can be run on this target. e.g. `["package", "run"]`
   * TODO: I think this should be optional - need to review how it gets parsed/peeked
   */
  goals?: string[];
};

export async function list(runner: Pants, target: string): Promise<Address[]> {
  const goalArgs: GoalArg = {
    goal: "list",
  };
  const unscopedOptions: Options = {
    "filter-granularity": "BUILD",
  };

  const result = await runner.execute([goalArgs], target, unscopedOptions);
  const specs = result.split("\n");
  return specs.map((spec) => Address.parse(spec));
}
