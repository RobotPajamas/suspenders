import { Pants } from "../pants";
import { execSync } from "child_process";
import { TargetsProvider, peek } from "./targets-provider";

vi.mock("child_process");

test("peek should return an empty list if Pants does not return any targets", async () => {
  const runner = new Pants("any/path/to/workspace");

  vi.mocked(execSync).mockReturnValue("");
  expect(await peek(runner, "::")).toEqual([]);

  // vi.mocked(execSync).mockReturnValue("{}");
  // expect(await peek(runner, "::")).toEqual([]);

  vi.mocked(execSync).mockReturnValue("[]");
  expect(await peek(runner, "::")).toEqual([]);
});

test("peek should return a list of PeekResults if Pants returns targets", async () => {
  const runner = new Pants("any/path/to/workspace");

  const stdout = `[
        {
            "address": "examples/python/helloworld:helloworld-pex",
            "target_type": "pex_binary",
            "dependencies": [
                "examples/python/helloworld/helloworld/__init__.py:../libhelloworld"
            ],
            "dependencies_raw": [
              ":libhelloworld"
            ],
            "entry_point": {
              "module": "helloworld.main",
              "function": null
            }
        },
        {
            "address": "examples/python/helloworld:libhelloworld",
            "target_type": "python_sources",
            "dependencies": [],
            "sources": [
                "examples/python/helloworld/helloworld/__init__.py"
            ],
            "sources_fingerprint": "c3e76ec6d53c7ecfaaacaf46b9a4586d7b564ede53ff69c5264452c012cebf20",
            "sources_raw": [
                "**/*.py"
            ]
        }
    ]`;
  vi.mocked(execSync).mockReturnValue(stdout);

  const targets = await peek(runner, "::");
  expect(targets).toEqual([
    {
      address: "examples/python/helloworld:helloworld-pex",
      target_type: "pex_binary",
      dependencies: ["examples/python/helloworld/helloworld/__init__.py:../libhelloworld"],
      dependencies_raw: [":libhelloworld"],
      entry_point: {
        module: "helloworld.main",
        function: null,
      },
    },
    {
      address: "examples/python/helloworld:libhelloworld",
      target_type: "python_sources",
      dependencies: [],
      sources: ["examples/python/helloworld/helloworld/__init__.py"],
      sources_fingerprint: "c3e76ec6d53c7ecfaaacaf46b9a4586d7b564ede53ff69c5264452c012cebf20",
      sources_raw: ["**/*.py"],
    },
  ]);
});

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
