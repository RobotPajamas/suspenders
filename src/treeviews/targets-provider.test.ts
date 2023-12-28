import { Pants } from "../pants";
import { execSync } from "child_process";
import { TargetsProvider } from "./targets-provider";

vi.mock("child_process");

test("refresh should fire the onDidChangeTreeData event", () => {
    const provider = new TargetsProvider();
    let eventFired = false;
    provider.onDidChangeTreeData((e) => {
      eventFired = true;
    });
    provider.refresh();
    expect(eventFired).toBe(true);
  });

  test("getChildren should return an empty list if there is no rootPath", async () => {
    const provider = new TargetsProvider();
    expect(await provider.getChildren()).toEqual([]);
  
    const provider1 = new TargetsProvider("");
    expect(await provider1.getChildren()).toEqual([]);
  });