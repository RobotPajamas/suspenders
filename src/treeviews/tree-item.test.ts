import { Address } from "../pants";
import { FolderTreeItem, TargetTreeItem } from "./tree-item";

test("FolderTreeItem canHaveChildren should return true", () => {
  const folderTreeItem = new FolderTreeItem(
    {
      id: "examples/python/helloworld",
      name: "helloworld",
      targets: [],
      children: new Map(),
    },
    "any/path/to/workspace"
  );

  expect(folderTreeItem.canHaveChildren()).toBe(true);
});

test("TargetTreeItem canHaveChildren should return false", () => {
  const targetTreeItem = new TargetTreeItem(
    {
      address: new Address("examples/python/helloworld", "helloworld-pex"),
      type: "pex_binary",
    },
    "any/path/to/workspace"
  );
  expect(targetTreeItem.canHaveChildren()).toBe(false);
});

test("TargetTreeItem getChildren should return an empty list", async () => {
  const targetTreeItem = new TargetTreeItem(
    {
      address: new Address("examples/python/helloworld", "helloworld-pex"),
      type: "pex_binary",
    },
    "any/path/to/workspace"
  );
  expect(await targetTreeItem.getChildren()).toEqual([]);
});
