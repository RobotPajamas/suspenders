import * as path from "path";
import {
  CancellationToken,
  ConfigurationParams,
  ConfigurationRequest,
  LanguageClient,
  LanguageClientOptions,
  ResponseError,
  ServerOptions,
  TransportKind,
} from "vscode-languageclient/node";
import { logger } from "../logging";
import * as vscode from "vscode";
import { Pants } from "../pants";
import { generateBuiltins } from "./builtins";
import { generateJsonSchema } from "./schema";
import liftJson from "./lift.toml.json";

// TODO: Grabbed this from https://github.com/microsoft/pyright/blob/496e50f65c8d3aecc43dcbc9b960d633cafe0c94/packages/vscode-pyright/src/extension.ts#L96
// Spend some time cleaning it up for our purposes
export function createLanguageClient(context: vscode.ExtensionContext): LanguageClient {
  let serverModule = context.asAbsolutePath(
    path.join("node_modules", "pyright", "langserver.index.js")
  );
  logger.debug(`createLanguageClient: Server Module: ${serverModule}`);
  const debugOptions = { execArgv: ["--nolazy", "--inspect=6600"] };

  // TODO: Is stdio necessary? I ran into some errors using node ipc, but maybe those were false positives
  const serverOptions: ServerOptions = {
    run: { module: serverModule, transport: TransportKind.stdio, args: ["--stdio"] },
    debug: {
      module: serverModule,
      transport: TransportKind.stdio,
      args: ["--stdio"],
      options: debugOptions,
    },
  };

  const clientOptions: LanguageClientOptions = {
    // TODO: this can also be a pattern on BUILD files, but I feel like language-based is more "correct"
    documentSelector: [{ scheme: "file", language: "pantsbuild" }],
    middleware: {
      workspace: {
        configuration: async (
          params: ConfigurationParams,
          token: CancellationToken,
          next: ConfigurationRequest.HandlerSignature
        ) => {
          let result = next(params, token);

          if (isThenable(result)) {
            logger.debug("createLanguageClient: Result is Thenable");
            result = await result;
          }
          logger.debug(
            `createLanguageClient: Params: ${JSON.stringify(params)} - Result: ${JSON.stringify(result)}`
          );

          if (result instanceof ResponseError) {
            logger.error(`createLanguageClient: ResponseError: ${JSON.stringify(result)}`);
            return result;
          }

          for (const [i, item] of params.items.entries()) {
            logger.debug(`Entries: ${i} ${JSON.stringify(item)}`);

            // TODO: Hardcoding this as a proof-of-concept, but this should probably be part of Suspenders config (and maybe `.pants.d/suspenders` or `/pyright` or something)
            if (item.section === "python.analysis") {
              (result[i] as any).stubPath = "./.pants.d/suspenders";
            }
          }

          return result;
        },
      },
    },
  };

  return new LanguageClient("PantsBuild LSP Client", serverOptions, clientOptions);
}

export async function generateBuiltinsFile(rootPath?: string) {
  logger.info("Generating __builtins__.pyi file");
  const runner = new Pants(rootPath ?? "");
  const result = await runner.execute([{ goal: "help-all" }]);

  const basePath = path.join(runner.buildRoot, ".pants.d", "suspenders");

  // Write file to .pants.d/__builtins__.pyi
  const builtinsContent = generateBuiltins(result);
  const builtinsPath = path.join(basePath, "__builtins__.pyi");
  await vscode.workspace.fs.writeFile(vscode.Uri.file(builtinsPath), Buffer.from(builtinsContent));
  logger.info(`Wrote __builtins__.pyi to ${builtinsPath}`);

  // Write JSON Schema
  const schemaContent = generateJsonSchema(result);
  const schemaPath = path.join(basePath, "pants.toml.json");
  await vscode.workspace.fs.writeFile(vscode.Uri.file(schemaPath), Buffer.from(schemaContent));
  logger.info(`Wrote pants.schema.json to ${schemaPath}`);

  // Re-write hardcoded Lift JSON schema (due to tamasfe/taplo#322)
  const liftPath = path.join(basePath, "lift.toml.json");
  await vscode.workspace.fs.writeFile(
    vscode.Uri.file(liftPath),
    Buffer.from(JSON.stringify(liftJson, null, 2))
  );
  logger.info(`Wrote lift.toml.json to ${liftPath}`);
}

function isThenable<T>(v: any): v is Thenable<T> {
  return typeof v?.then === "function";
}
