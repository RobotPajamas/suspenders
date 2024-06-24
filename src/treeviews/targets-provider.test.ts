import { Address, Pants, PeekResult } from "../pants";
import { SpawnSyncReturns, spawnSync } from "child_process";
import {
  TargetsProvider,
  createTargetMap,
  mapPeekResultsToTargets,
  peek,
} from "./targets-provider";
import { FolderTreeItem, Target, TargetTreeItem } from "./tree-item";

vi.mock("child_process");

test("peek should return an empty list if Pants does not return any targets", async () => {
  const runner = new Pants("any/path/to/workspace");

  vi.mocked(spawnSync).mockReturnValue({ ...spawned, stdout: "" });
  expect(await peek(runner, "::")).toEqual([]);

  // vi.mocked(spawnSync).mockReturnValue("{}");
  // expect(await peek(runner, "::")).toEqual([]);

  vi.mocked(spawnSync).mockReturnValue({ ...spawned, stdout: "[]" });
  expect(await peek(runner, "::")).toEqual([]);
});

test("peek should return a list of PeekResults if Pants returns targets", async () => {
  const runner = new Pants("any/path/to/workspace");

  vi.mocked(spawnSync).mockReturnValue({ ...spawned, stdout: samplePeekStdOut });
  expect(await peek(runner, "::")).containSubset(samplePeekResults);
});

test("mapPeekResultsToTargets should map the incoming peek results to Targets", () => {
  expect(mapPeekResultsToTargets([])).toEqual([]);
  expect(mapPeekResultsToTargets(samplePeekResults)).toEqual(sampleTargets);
});

test("createTargetMap should create a map of targets keyed by their path", () => {
  expect(createTargetMap([])).toEqual(new Map<string, Target[]>());
  expect(createTargetMap(sampleTargets)).toEqual(sampleTargetMap);
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
  vi.mocked(spawnSync).mockReturnValue({ ...spawned, stdout: "[]" });

  const provider = new TargetsProvider("any/path/to/workspace");
  expect(await provider.getChildren()).toEqual([]);
});

test("getChildren should return a list of PantsTreeItems if Pants returns peeked targets", async () => {
  vi.mocked(spawnSync).mockReturnValue({ ...spawned, stdout: samplePeekStdOut });

  const provider = new TargetsProvider("any/path/to/workspace");
  const children = await provider.getChildren();
  expect(JSON.stringify(children)).toEqual(JSON.stringify(expectedSimplifiedPantsTreeItems));
});

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

const sampleTargets: Target[] = [
  {
    address: new Address("examples/python/helloworld", "helloworld-pex"),
    type: "pex_binary",
  },
  {
    address: new Address("examples/python/helloworld", "libhelloworld"),
    type: "python_sources",
  },
];

const sampleTargetMap = new Map<string, Target[]>([
  [
    "examples/python/helloworld",
    [
      {
        address: new Address("examples/python/helloworld", "helloworld-pex"),
        type: "pex_binary",
      },
      {
        address: new Address("examples/python/helloworld", "libhelloworld"),
        type: "python_sources",
      },
    ],
  ],
]);

const expectedSimplifiedPantsTreeItems = [
  {
    subtree: {
      id: "examples/python/helloworld",
      name: "examples",
      targets: [
        {
          address: { path: "examples/python/helloworld", targetName: "helloworld-pex" },
          type: "pex_binary",
        },
        {
          address: { path: "examples/python/helloworld", targetName: "libhelloworld" },
          type: "python_sources",
        },
      ],
      children: {},
    },
    buildRoot: "any/path/to/workspace",
    iconPath: {},
  },
];

const spawned: SpawnSyncReturns<string> = {
  stdout: "",
  stderr: "",
  pid: 42,
  output: ["", ""],
  signal: null,
  status: 0,
  error: undefined,
};
