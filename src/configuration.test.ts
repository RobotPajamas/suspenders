import { ConfigurationTarget, WorkspaceConfiguration } from "vscode";
import {
  getBuildFileExtension,
  getPantsExecutable,
  ignoreLockfiles,
  shouldGenerateBuiltinsOnSave,
} from "./configuration";

test.each([
  [getPantsExecutable, "pants"],
  [getBuildFileExtension, ""],
  [ignoreLockfiles, true],
  [shouldGenerateBuiltinsOnSave, false],
])(
  "configuration getter should return default value without a valid config",
  (fn, defaultValue) => {
    // expect(fn(config(""))).toEqual(defaultValue); // This falls over with the returnDefaultIfUndefined approach
    expect(fn(config(undefined))).toEqual(defaultValue);
  }
);

test.each([
  [getPantsExecutable, "./pants_from_sources"],
  [getBuildFileExtension, ".pants"],
  [ignoreLockfiles, false],
  [shouldGenerateBuiltinsOnSave, true],
])("configuration getter should use the user-specified settings when available", (fn, value) => {
  expect(fn(config(value))).toEqual(value);
});

function config(value: string | boolean | undefined): WorkspaceConfiguration {
  return {
    get: (key: string) => {
      return value;
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
