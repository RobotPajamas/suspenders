import { vi } from "vitest";

vi.mock("vscode", () => {
    return {
        workspace: {
            getConfiguration: () => {
                return {
                    get: () => "",
                };
            },
        },
    };
});