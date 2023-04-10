import * as vscode from "vscode";

export class TestsProvider {
  constructor(private readonly controller: vscode.TestController) {
    // Using the new Peek modifications, find all `test`able targets and create a test item for each
    controller.items.add(controller.createTestItem("test", "Test 1"));
    controller.items.add(controller.createTestItem("test1", "Test 2"));
    controller.items.add(controller.createTestItem("test2", "Test 3"));
  }

  public refresh(): void {}
}
