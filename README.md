# Suspenders

Suspenders is an alpha VS Code extension to provide [Pants](https://github.com/pantsbuild/pants) users with some quality-of-workflow improvements.

This repo contains several proof-of-concepts, as Pants requires some additions and optimizations to be able to provide a good experience in VS Code. However, I've found enough utility in several features (e.g. BUILD LSP and TOML schema), that I would consider this a useful plugin to have for Pants users/developers/maintainers.

## Activation

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

### Pants.toml JSON Schema

There is already a JSON schema file uploaded to schema store for each minor release of Pants (e.g. https://json.schemastore.org/pantsbuild-2.21.0.json). Users can setup [Even Better TOML](https://marketplace.visualstudio.com/items?itemName=tamasfe.even-better-toml) to point to this schema.

Suspenders, however, will generate a `pants.toml` JSON schema for your currently enabled backends upon running "Pants: Re-generate BUILD LSP data". This schema is a subset of the one on schema store.

The only real difference to the user is that the schema store variant might show autocompletions that aren't available until the user activates a specific backend, while the Suspenders-generated version shouldn't have that use case.

## Recommended Plugins

- [Even Better TOML](https://marketplace.visualstudio.com/items?itemName=tamasfe.even-better-toml) - Provides syntax highlighting for `pants.toml` files, and allows using a Pants.toml JSON schema for validation.

## Using Pants

Pants has recently added first-party support for NodeJS/Javascript files (more than just formatters), but there is no Typescript support as of: `PANTS_SHA=7fca4215f67b3756bd2ac723cb4cefcf83273ab3 pants fmt ::`.

## Important Links

- [Pants Documentation](https://www.pantsbuild.org/)
- [Pants Slack channel](https://www.pantsbuild.org/docs/getting-help#slack)

## Feature Requests and Bugs

Any suggestions or issues can be added to the Suspenders Github issue list: https://github.com/RobotPajamas/suspenders/issues
