# web2js

`web2js` turns TeX/e-TeX WEB sources into the WebAssembly runtime used by [TikZJax](https://github.com/rod2ik/tikzjax).

Its main deliverable is **not an npm library**. It is a four-file runtime contract:

```text
dist/
├── tex.wasm
├── tex.wasm.gz
├── core.dump
└── core.dump.gz
```

## What Web2js owns

Web2js is responsible for:

- merging TeX/e-TeX WEB sources and project change files;
- tangling WEB to Pascal;
- compiling Pascal to WebAssembly;
- applying Binaryen Asyncify/optimization;
- running `initex` and serializing initialized WebAssembly memory;
- probing optional TikZ libraries and TeX packages;
- generating TeX runtime file metadata;
- handing the validated runtime to TikZJax.

TikZJax is responsible for browser-side loading, configuration, caching, error handling and rendering.

## Relationship with TikZJax

```text
TeX WEB sources
      │
      ▼
   Web2js
      │
      ├── tex.wasm(.gz)
      ├── core.dump(.gz)
      └── TeX runtime file metadata
      │
      │ yarn deploy:tikzjax
      ▼
   TikZJax
      │
      ▼
TikZ / LaTeX in the browser
```

This dependency direction is why Web2js should normally be released before a TikZJax version that consumes a new runtime.

## Most common commands

```bash
yarn doctor
yarn build
yarn validate:dist
yarn bfc
yarn deploy:tikzjax
yarn dev
```

## Automatic publishing

A normal push to `main` builds and deploys this documentation to GitHub Pages.

A pushed tag such as:

```bash
git tag v1.0.4
git push origin v1.0.4
```

creates a GitHub Release automatically and attaches the project ZIP plus the four runtime artifacts.

Continue with [Getting started](getting-started.md), the [build pipeline](build-pipeline.md), or the detailed [TikZJax integration](tikzjax-integration.md).
