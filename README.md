# Suspenders

Suspenders is a (very) alpha VS Code extension to provide [Pants](https://github.com/pantsbuild/pants) users with some quality-of-workflow improvements.

The extension is loaded upon there being a `pants.toml` file in the workspace root.

## Available Functionality

Suspenders functionality is very limited at the moment.

The preliminary aims are related to streamlining [project introspection](https://www.pantsbuild.org/docs/project-introspection) by creating a view container which shows source roots, targets, etc.

In addition, the command palette has been enhanced with several pants specific commands:

- Run `check` goal on all targets
- Run `fmt` goal on all targets
- Run `lint` goal on all targets
- Run `test` goal on all targets

## Using Pants

Pants has recently added first-party support for NodeJS/Javascript files (more than just formatters), but there is no Typescript support as of: `PANTS_SHA=7fca4215f67b3756bd2ac723cb4cefcf83273ab3 pants fmt ::`.

## Important Links

- [Pants Documentation](https://www.pantsbuild.org/)
- [Pants Slack channel](https://www.pantsbuild.org/docs/getting-help#slack)

## Feature Requests and Bugs

Any suggestions or issues can be added to the Suspenders Github issue list: https://github.com/RobotPajamas/suspenders/issues
