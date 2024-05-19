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

// TODO: Grabbed this from https://github.com/microsoft/pyright/blob/496e50f65c8d3aecc43dcbc9b960d633cafe0c94/packages/vscode-pyright/src/extension.ts#L96
// Spend some time cleaning it up for our purposes
export function createLanguageClient(context: vscode.ExtensionContext): LanguageClient {
  let serverModule = context.asAbsolutePath(
    path.join("node_modules", "pyright", "langserver.index.js")
  );
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

            // TODO: Hardcoding this as a proof-of-concept, but this should probably be part of Suspenders config
            if (item.section === "python.analysis") {
              (result[i] as any).stubPath = "./.pants.d";
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
  const fileContent = generateBuiltins(result);
  // Write file to .pants.d/__builtins__.pyi
  const builtinsPath = path.join(runner.buildRoot, ".pants.d", "__builtins__.pyi");
  await vscode.workspace.fs.writeFile(vscode.Uri.file(builtinsPath), Buffer.from(fileContent));
  logger.info(`Wrote __builtins__.pyi to ${builtinsPath}`);
}

function isThenable<T>(v: any): v is Thenable<T> {
  return typeof v?.then === "function";
}

// export
