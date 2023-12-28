import { Pants } from "../pants";
import { SourceRootsProvider, listSourceRoots } from "./source-roots-provider";
import { SourceRoot } from "./tree-item";
import { execSync } from "child_process";

vi.mock("child_process");

test("listSourceRoots should return an empty list if Pants does not return any source roots", async () => {
  const runner = new Pants("any/path/to/workspace");

  vi.mocked(execSync).mockReturnValue("");
  expect(await listSourceRoots(runner)).toEqual([]);
});

test("listSourceRoots should return a list of source roots if Pants returns source roots", async () => {
  const runner = new Pants("any/path/to/workspace");

  const stdout = "src/helloworld\nsrc/goodbyeworld\n";
  vi.mocked(execSync).mockReturnValue(stdout);
  expect(await listSourceRoots(runner)).toEqual(["src/helloworld", "src/goodbyeworld"]);
});

test("refresh should fire the onDidChangeTreeData event", () => {
  const provider = new SourceRootsProvider();
  let eventFired = false;
  provider.onDidChangeTreeData((e) => {
    eventFired = true;
  });
  provider.refresh();
  expect(eventFired).toBe(true);
});

test("getChildren should return an empty list if there is no rootPath", async () => {
  const provider = new SourceRootsProvider();
  expect(await provider.getChildren()).toEqual([]);

  const provider1 = new SourceRootsProvider("");
  expect(await provider1.getChildren()).toEqual([]);
});

test("getChildren should return an empty list if Pants does not return any source roots", async () => {
  vi.mocked(execSync).mockReturnValue("");

  const provider = new SourceRootsProvider("any/path/to/workspace");
  expect(await provider.getChildren()).toEqual([]);
});

test("getChildren should return a list of source roots if Pants returns source roots", async () => {
  const stdout = "src/helloworld\nsrc/goodbyeworld\n";
  vi.mocked(execSync).mockReturnValue(stdout);

  const provider = new SourceRootsProvider("any/path/to/workspace");
  expect(await provider.getChildren()).toEqual([
    new SourceRoot("src/helloworld"),
    new SourceRoot("src/goodbyeworld"),
  ]);
});
