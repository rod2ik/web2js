# TikZJax integration

Web2js and TikZJax are intentionally separate repositories. Web2js **builds the TeX engine/runtime**; TikZJax **loads and orchestrates that runtime in the browser**.

A typical development layout is:

```text
Documents/dev/
├── web2js/
└── tikzjax/
```

## Responsibility boundary

```text
TeX / e-TeX WEB sources
        │
        ▼
      Web2js
        │
        ├── compiler + WEB build pipeline
        ├── WebAssembly generation
        ├── initex / LaTeX initialization
        ├── package/library probing
        ▼
web2js/dist/
├── tex.wasm
├── tex.wasm.gz
├── core.dump
└── core.dump.gz
        │
        │ yarn deploy:tikzjax
        ▼
      TikZJax
        │
        ├── browser worker/runtime loader
        ├── TeX file loading
        ├── TikZJax configuration
        ├── rendering / fallback / cache
        ▼
SVG/HTML rendering in the browser
```

This separation is deliberate. Web2js is not intended to become an npm-facing browser library; TikZJax is the consumer-facing browser project.

## The four-file runtime contract

Web2js produces exactly four final artifacts:

```text
dist/tex.wasm
dist/tex.wasm.gz
dist/core.dump
dist/core.dump.gz
```

`tex.wasm` contains executable TeX engine logic. `core.dump` contains the initialized WebAssembly memory after the LaTeX/TikZ format has been prepared.

The compressed pair is what TikZJax normally serves/loads in the browser. The uncompressed pair is kept as the canonical build output and is useful for validation, reproducibility and release assets.

The invariant is:

```text
gunzip(tex.wasm.gz)  == tex.wasm
gunzip(core.dump.gz) == core.dump
```

`yarn validate:dist` checks this contract.

## Runtime deployment

Build and validate Web2js first:

```bash
cd web2js
yarn build
yarn validate:dist
```

Then copy the four runtime artifacts to the sibling TikZJax checkout:

```bash
yarn deploy:tikzjax:runtime
```

The operation is intentionally a copy-only handoff:

```text
web2js/dist/tex.wasm       -> tikzjax/tex.wasm
web2js/dist/tex.wasm.gz    -> tikzjax/tex.wasm.gz
web2js/dist/core.dump      -> tikzjax/core.dump
web2js/dist/core.dump.gz   -> tikzjax/core.dump.gz
```

It does **not** rebuild or recompress anything. This means the exact artifacts validated in Web2js are the artifacts handed to TikZJax.

## TeX runtime file metadata

The runtime also needs to know which TeX files can be requested dynamically. Web2js probes TikZ libraries and optional TeX packages, then generates a merged runtime list.

Relevant commands are:

```bash
yarn gen:tikz-libs
yarn gen:tikz-packages
yarn gen:tex-files
```

or all three together:

```bash
yarn gen:all
```

The merged generated file is:

```text
build/tex_files.generated.json
```

Deploy it into TikZJax with:

```bash
yarn deploy:tikzjax:tex-files
```

The deploy script merges missing entries into TikZJax's `tex_files.json` rather than making TikZJax discover packages independently.

## Complete local handoff

For normal development, use the combined command:

```bash
yarn deploy:tikzjax
```

It performs:

```text
gen:tex-files
   │
   ├── deploy:tikzjax:tex-files
   └── deploy:tikzjax:runtime
```

The command assumes `../tikzjax` exists. `yarn build`, `yarn bfc`, the tests and the Web2js documentation do not require a TikZJax checkout.

## Validating the handoff in TikZJax

After deployment:

```bash
cd ../tikzjax
yarn bfc
yarn dev
```

TikZJax's local vendor workflow then builds/synchronizes the current TikZJax `dist/` only when needed. This is the important end-to-end test:

```text
Web2js source
   ↓
Web2js runtime artifacts
   ↓
yarn deploy:tikzjax
   ↓
TikZJax build
   ↓
TikZJax local vendor
   ↓
MkDocs/browser rendering
```

A new `preloaded format=latex ...` date in the browser console is a useful confirmation that the newly generated `core.dump.gz` is actually being consumed.

## Release order

When both projects change together, publish Web2js first and TikZJax second. See [Publishing Web2js and TikZJax](publishing/release-order.md).
