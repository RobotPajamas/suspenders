import { Address, Pants, PeekResult } from "../pants";
import { execSync } from "child_process";
import { TargetsProvider, createTargetMap, mapPeekResultsToTargets, peek } from "./targets-provider";
import { Target } from "./tree-item";

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

  vi.mocked(execSync).mockReturnValue(samplePeekStdOut);
  expect(await peek(runner, "::")).toEqual(samplePeekResults);
});

test("mapPeekResultsToTargets should map the incoming peek results to Targets", () => {
    expect(mapPeekResultsToTargets([])).toEqual([]);
    expect(mapPeekResultsToTargets(samplePeekResults)).toEqual([
        {
            address: new Address("examples/python/helloworld", "helloworld-pex"),
            type: "pex_binary",
        },
        {
            address: new Address("examples/python/helloworld", "libhelloworld"),
            type: "python_sources",
        }

    ]);
});

test("createTargetMap should create a map of targets keyed by their path", () => {
    expect(createTargetMap([])).toEqual(new Map<string, Target[]>());
    
    expect(createTargetMap([
        {
            address: new Address("examples/python/helloworld", "helloworld-pex"),
            type: "pex_binary",
        },
        {
            address: new Address("examples/python/helloworld", "libhelloworld"),
            type: "python_sources",
        }
    ])).toEqual(new Map<string, Target[]>([
        ["examples/python/helloworld", [
            {
                address: new Address("examples/python/helloworld", "helloworld-pex"),
                type: "pex_binary",
            },
            {
                address: new Address("examples/python/helloworld", "libhelloworld"),
                type: "python_sources",
            }
        ]]
    ]));
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

test("getChildren should return an empty list if Pants does not return any peeked targets", async () => {
  vi.mocked(execSync).mockReturnValue("[]");

  const provider = new TargetsProvider("any/path/to/workspace");
  expect(await provider.getChildren()).toEqual([]);
});

// test("getChildren should return a list of peeked targets if Pants returns peeked targets", async () => {


const samplePeekStdOut = `[
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
        },
        "goals": []
    },
    {
        "address": "examples/python/helloworld:libhelloworld",
        "target_type": "python_sources",
        "dependencies": [],
        "goals": [],
        "sources": [
            "examples/python/helloworld/helloworld/__init__.py"
        ],
        "sources_fingerprint": "c3e76ec6d53c7ecfaaacaf46b9a4586d7b564ede53ff69c5264452c012cebf20",
        "sources_raw": [
            "**/*.py"
        ]
    }
]`;

const samplePeekResults: PeekResult[] = [
    {
      address: "examples/python/helloworld:helloworld-pex",
      target_type: "pex_binary",
      goals: [],
    },
    {
      address: "examples/python/helloworld:libhelloworld",
      target_type: "python_sources",
        goals: [],
    },
];