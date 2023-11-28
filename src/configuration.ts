import { WorkspaceConfiguration, workspace } from "vscode";

const namespace = "suspenders";

/**
 * Returns the path to the Pants executable, as configured in the user's settings.
 * If no valid executable is configured (e.g. empty string), returns "pants".
 * 
 * @param config The user's WorkspaceConfiguration. Defaults to the global vscode configuration.
 * @returns The path to the Pants executable.
 */
export function getPantsExecutable(config: WorkspaceConfiguration = workspace.getConfiguration(namespace)): string {
    const pantsExecutable = config.get<string>("executable");
    if (pantsExecutable) {
        return pantsExecutable;
    }
    return "pants";
}