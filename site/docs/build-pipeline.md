# Build pipeline

`yarn build` is the canonical command for producing the TikZJax runtime. It deliberately leaves the compiler implementation unchanged and orchestrates the existing tools around the new `build/` and `dist/` boundaries.

## 1. Clean runtime outputs

```bash
yarn clean:runtime
```

This recreates empty `build/` and `dist/` directories.

## 2. Generate the Jison parser

```bash
yarn build:parser
```

Input:

```text
src/compiler/parser.jison
```

Output:

```text
build/parser.js
```

The generated parser references the maintained Pascal compiler modules in `src/compiler/pascal/`.

## 3. Merge TeX/e-TeX WEB sources

```bash
yarn build:tie
```

The `tie` step starts from:

```text
vendor/texlive/texk/tex.web
```

and applies the ordered change list defined by:

```text
src/tex/changes/change-order
```

including the e-TeX change file from `vendor/texlive/etexdir/etex.ch` and the project-specific change files.

Output:

```text
build/tex.web
```

## 4. Tangle WEB to Pascal

```bash
yarn build:tangle
```

`tangle` runs inside `build/` and produces the Pascal source and string pool there:

```text
build/tex.p
build/tex.pool
```

## 5. Compile Pascal to WebAssembly

```bash
yarn build:compile
```

The existing compiler implementation in `src/compiler/compile.js` compiles:

```text
build/tex.p
```

to:

```text
build/out.wasm
```

## 6. Asyncify and optimize

```bash
yarn build:asyncify-wasm
```

Binaryen's `wasm-opt` applies Asyncify and optimization to create:

```text
build/tex.wasm
```

The Asyncify imports remain the same as in the original project:

```text
library.reset
library.getfilesize
```

## 7. Initialize TeX and create the memory dump

```bash
yarn build:initex
```

`scripts/build/initex.js` loads `build/tex.wasm`, initializes the TeX/LaTeX runtime, loads the TikZ driver configuration and writes the initialized memory to:

```text
build/core.dump
```

It also records the files used while creating the dump in `build/initex-files.json`.

## 8. Stage the canonical deliverables

```bash
yarn build:dist
```

This step copies the two canonical artifacts from `build/` into `dist/`:

```text
build/tex.wasm  ───────────────► dist/tex.wasm
build/core.dump ───────────────► dist/core.dump
```

## 9. Create gzip artifacts

```bash
yarn build:gzip
```

Compression is deliberately separate from both staging and deployment:

```text
dist/tex.wasm  ────────────────► dist/tex.wasm.gz
dist/core.dump ────────────────► dist/core.dump.gz
```

## Complete command

All runtime steps above are executed by:

```bash
yarn build
```

The build does **not** require a sibling TikZJax checkout. Deployment is a separate operation.
