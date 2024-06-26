/**
 * A Typescript/VSCode port of the utils/generate-json-schema concept that will need to be built into Pants eventually
 * Instead of creating a PR and waiting for that to be released first (which would limit LSP functionality to probably 2.23+),
 * makes sense to hack together a quick TS version and use this as a backport
 */

import { AllHelpInfo } from "../pants";

/**
 * From the `pants help-all` JSON string, create the file content for a json-schema for the pants.toml file
 * This module does not perform I/O operations
 *
 * @param help_json The output of `pants help-all`
 * @returns JSON Schema file content
 */
export function generateJsonSchema(help_json: string): string {
  const helpInfo: AllHelpInfo = JSON.parse(help_json);

  let schema: { [key: string]: any } = {};
  schema["$schema"] = "http://json-schema.org/draft-04/schema#";
  schema["description"] = "Pants configuration file schema: https://www.pantsbuild.org/";
  schema["additionalProperties"] = true;
  schema["type"] = "object";

  let ruleset: { [key: string]: any } = {};
  for (const [scope, options] of Object.entries(helpInfo.scope_to_help_info)) {
    let sanitizedScope = scope || "GLOBAL";
    ruleset[sanitizedScope] = {
      description: helpInfo.scope_to_help_info[scope].description,
      type: "object",
      properties: {},
    };
    ruleset = buildScopeProperties(
      ruleset,
      [...options.basic, ...options.advanced],
      sanitizedScope
    );
  }

  schema["properties"] = ruleset;
  return JSON.stringify(schema, null, 2);
}

const PYTHON_TO_JSON_TYPE_MAPPING: { [key: string]: string } = {
  str: "string",
  bool: "boolean",
  list: "array",
  int: "number",
  float: "number",
  dict: "object",
};

const ENV_SPECIFIC_OPTION_DEFAULTS: { [key: string]: any } = {
  pants_config_files: ["<buildroot>/pants.toml"],
  pants_subprocessdir: "<buildroot>/.pants.d/pids",
  pants_distdir: "<buildroot>/dist",
  pants_workdir: "<buildroot>/.pants.d/workdir",
  local_store_dir: "$XDG_CACHE_HOME/lmdb_store",
  named_caches_dir: "$XDG_CACHE_HOME/named_caches",
};

const VERSION_MAJOR_MINOR = "2.21"; // TODO: Hardcoded - pull from pants.toml

function buildScopeProperties(
  ruleset: { [key: string]: any },
  options: { [key: string]: any }[],
  scope: string
): { [key: string]: any } {
  for (const option of options) {
    const properties = ruleset[scope]["properties"];

    properties[option["config_key"]] = {
      description: description(option, scope),
      default: getDefault(option),
    };
    if (option["choices"]) {
      properties[option["config_key"]]["enum"] = option["choices"];
    } else {
      const typ = PYTHON_TO_JSON_TYPE_MAPPING[option["typ"]];
      if (typ) {
        if (option.fromfile) {
          properties[option["config_key"]]["oneOf"] = [{ type: typ }, { type: "string" }];
        } else {
          properties[option["config_key"]]["type"] = typ;
        }
      }
    }
  }
  return ruleset;
}

function description(option: { [key: string]: any }, section: string): string {
  const option_help: string = option["help"].replace("\n", "").split("\n")[0];
  const option_name: string = option["config_key"];
  const simplified_option_help = simplifiedDescription(option_help);
  const url = `https://www.pantsbuild.org/v${VERSION_MAJOR_MINOR}/docs/reference-${section.toLowerCase()}#${option_name}`;
  return `${simplified_option_help}\n${url}`;
}

function simplifiedDescription(description: string): string {
  const match = description.match(/^.*?\./s);
  return match ? match[0] : description;
}

function getDefault(option: { [key: string]: any }): any {
  return ENV_SPECIFIC_OPTION_DEFAULTS[option["config_key"]] || option["default"];
}
