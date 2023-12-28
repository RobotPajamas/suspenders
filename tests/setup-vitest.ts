import { after, afterEach } from "node:test";
import { vi } from "vitest";

// TODO: Why isn't vi.importActual working? Throwing errors, but partial mocking is desired here

vi.mock("vscode", () => {
  return {
    EventEmitter: class {
      constructor(private listeners: Function[] = []) {}

      fire() {
        this.listeners.forEach((fn) => fn());
      }

      get event() {
        return (fn: Function) => {
          this.listeners.push(fn);
        };
      }
    },
    TreeItemCollapsibleState: {
      None: 0,
      Collapsed: 1,
      Expanded: 2,
    },
    TreeItem: class {},
    workspace: {
      getConfiguration: () => {
        return {
          get: () => "",
        };
      },
    },
  };
});
