import { ConfigurationTarget, WorkspaceConfiguration } from "vscode";
import { getPantsExecutable } from "./configuration";

test("getPantsExecutable should default to `pants` without a valid config", () => {
  expect(getPantsExecutable(config(""))).toEqual("pants");
  expect(getPantsExecutable(config(undefined))).toEqual("pants");
});

test("getPantsExecutable should use the user-specified settings when available", () => {
  expect(getPantsExecutable(config("./pants_from_sources"))).toEqual("./pants_from_sources");
});

function config(executable: string | undefined): WorkspaceConfiguration {
  return {
    get: (key: string) => {
      return executable;
    },
    has: (key: string) => {
      throw new Error("Method not implemented.");
    },
    inspect: (key: string) => {
      throw new Error("Method not implemented.");
    },
    update: (key: string, value: any, target?: ConfigurationTarget | boolean) => {
      throw new Error("Method not implemented.");
    },
  };
}
