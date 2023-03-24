import { Address } from "./address";
import { Pants } from "./runner";

export type Goal = "check" | "fmt" | "lint" | "test" | "peek" | "dependencies" | "roots" | "list";

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
export interface Options {
  [key: string]: string;
}

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
export interface GoalArg {
  goal: Goal;
  unscopedOptions?: Options;
}

export type PeekResult = {
  address: string;
  target_type: string;
  dependencies: string[];
  sources: string[];
  sources_fingerprint: string;
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

  const result = await runner.execute([goalArgs], target, unscopedOptions);
  return JSON.parse(result);
}
