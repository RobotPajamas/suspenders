# Note: This will currently not work!

The merged code is in the process of being cleaned up and re-written, and it requires a change to `peek` that has not been mainlined. So, for a few weeks, this source code will be super janky.

# Suspenders

Suspenders is a (very) alpha VS Code extension to provide [Pants](https://github.com/pantsbuild/pants) users with some quality-of-workflow improvements.

**Note:** A lot of this functionality is proof-of-concept, as Pants requires some additions and optimizations to be able to provide a good experience in VS Code. This extension is being used to determine what can be done, and what needs to be added to Pants. As features are added in Pants, those features can remove the "proof-of-concept" label from this extension.

The extension is loaded upon there being a `pants.toml` file in the workspace root.

## Available Functionality

Suspenders functionality is very limited at the moment.

The preliminary aims are related to streamlining [project introspection](https://www.pantsbuild.org/docs/project-introspection) by creating a view container which shows source roots, targets, etc.

In addition, the command palette has been enhanced with several pants specific commands:

- Run `check` goal on all targets
- Run `fmt` goal on all targets
- Run `lint` goal on all targets
- Run `test` goal on all targets

### BUILD LSP

Experimental build file LSP support was added in [PR #105](https://github.com/RobotPajamas/suspenders/pull/105). It currently requires a manual step of opening the command palette and selecting "Pants: Re-generate BUILD LSP data". This generates BUILD file Python stubs, and restarts `pyright` which now knows to look for those stubs.

## Recommended Plugins

- [Even Better TOML](https://marketplace.visualstudio.com/items?itemName=tamasfe.even-better-toml) - Provides syntax highlighting for `pants.toml` files, and allows using a Pants.toml JSON schema for validation.

## Using Pants

Pants has recently added first-party support for NodeJS/Javascript files (more than just formatters), but there is no Typescript support as of: `PANTS_SHA=7fca4215f67b3756bd2ac723cb4cefcf83273ab3 pants fmt ::`.

## Important Links

- [Pants Documentation](https://www.pantsbuild.org/)
- [Pants Slack channel](https://www.pantsbuild.org/docs/getting-help#slack)

## Feature Requests and Bugs

Any suggestions or issues can be added to the Suspenders Github issue list: https://github.com/RobotPajamas/suspenders/issues
