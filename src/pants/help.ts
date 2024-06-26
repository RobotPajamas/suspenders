/**
 * "All available help info."
 * Corresponds to `AllHelpInfo` in help_info_extracter.py in Pants
 * Commenting the fields we don't need here
 */
export interface AllHelpInfo {
  scope_to_help_info: { [key: string]: OptionScopeHelpInfo };
  // name_to_goal_info: { [key: string]: any };
  name_to_target_type_info: { [key: string]: TargetTypeHelpInfo };
  // name_to_rule_info: { [key: string]: any };
  // name_to_api_type_info: { [key: string]: any };
  // name_to_backend_help_info: { [key: string]: any };
  // name_to_build_file_info: { [key: string]: any };
  // env_var_to_help_info: { [key: string]: any };
}

/**
 * "A container for help information for a scope of options."
 * Corresponds to `OptionScopeHelpInfo` in help_info_extracter.py in Pants
 */
export interface OptionScopeHelpInfo {
  advanced: OptionHelpInfo[];
  basic: OptionHelpInfo[];
  deprecated: OptionHelpInfo[];
  deprecated_scope?: string;
  description: string;
  is_goal: boolean;
  provider: string;
  scope: string;
}

/**
 * "A container for help information for a single option.""
 * Corresponds to `OptionHelpInfo` in help_info_extracter.py in Pants
 * Commenting the fields we don't need here (and/or that I don't feel like porting)
 */
export interface OptionHelpInfo {
  choices?: string[];
  comma_separated_choices?: string;
  comma_separated_display_args: string;
  config_key: string;
  default: string;
  deprecation_active: boolean;
  deprecated_message?: string;
  display_args: string[];
  env_var: string;
  fromfile: boolean;
  help: string;
  removal_version?: string;
  removal_hint?: string;
  scoped_cmd_line_args: string[];
  target_field_name?: string;
  typ: string;
  unscoped_cmd_line_args: string[];
  // value_history?: OptionValueHistory;
}

/**
 * "A container for help information for a target type."
 * Corresponds to `TargetTypeHelpInfo` in help_info_extracter.py in Pants
 */
export interface TargetTypeHelpInfo {
  alias: string;
  description: string;
  fields: TargetFieldHelpInfo[];
  provider: string;
  summary: string;
}

/**
 * "A container for help information for a field in a target type."
 * Corresponds to `FieldHelpInfo` in help_info_extracter.py in Pants
 */
export interface TargetFieldHelpInfo {
  alias: string;
  default?: string;
  description: string;
  provider: string;
  required: boolean;
  type_hint: string;
}
