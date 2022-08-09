# Suspenders

Keep those Pants up

## Heads up

I've never written a VS Code Extension before, so this repo is basically just a hack to learn about the VS Code APIs and seeing what is possible and what isn't.

None of this code should be presumed to be "good", "clean", "reasonable", "correct", etc...

The end goal of this extension is to make Pants introspection a bit easier, as well as some commands in the Command Palette to save some typing.

## How to Use?

There is no package or distribution yet, so you'll need to perform the following to test out this repo (explained here: https://code.visualstudio.com/api/get-started/your-first-extension).

```bash
npm install
npm run compile

# Ensure this repo is opened in VS Code
code .

# Press F5 to run this extension in a new "Extension Development Host" window
```

If there is a `pants.toml` in the workspace root of the newly opened window, the Suspenders extension will activate in the Activity Bar - and the Pants commands will be available in the palette.
