import { WorkspaceConfiguration, workspace } from "vscode";

export const namespace = "suspenders";

/**
 * Returns the path to the Pants executable, as configured in the user's settings.
 * If no valid executable is configured (e.g. empty string), returns "pants".
 *
 * @param config The user's WorkspaceConfiguration. Defaults to the global vscode configuration.
 * @returns The path to the Pants executable.
 */
export function getPantsExecutable(
  config: WorkspaceConfiguration = workspace.getConfiguration(namespace)
): string {
  return returnDefaultIfUndefined(config.get<string>("executable"), "pants").trim();
}

export function ignoreLockfiles(
  config: WorkspaceConfiguration = workspace.getConfiguration(namespace)
): boolean {
  return returnDefaultIfUndefined(config.get<boolean>("ignoreLockfiles"), true);
}

export function getBuildFileExtension(
  config: WorkspaceConfiguration = workspace.getConfiguration(namespace)
): string {
  return returnDefaultIfUndefined(config.get<string>("buildFileExtension"), "").trim();
}

function returnDefaultIfUndefined(value: any, defaultValue: any) {
  if (value === undefined) {
    return defaultValue;
  }
  return value;
}
