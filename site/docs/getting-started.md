# Getting started

## Requirements

The runtime build combines Node.js tooling with the traditional TeX WEB toolchain. You need:

- Node.js;
- Yarn 4.17.1 through Corepack;
- a TeX Live installation containing `tie`, `tangle`, LaTeX and the TeX files loaded during format initialization;
- the project dependencies installed with Yarn;
- Binaryen's `wasm-opt`, supplied by the `binaryen` package and resolved through Yarn.

The Pascal comparison test suite additionally requires Free Pascal (`fpc`). Documentation development requires MkDocs and Material for MkDocs.

Use the environment diagnostic first:

```bash
yarn doctor
```

## Install JavaScript dependencies

Check the expected Yarn version:

```bash
yarn --version
```

Expected:

```text
4.17.1
```

Install reproducibly:

```bash
yarn install --immutable
```

On a fresh machine, enable Corepack first if necessary:

```bash
corepack enable
```

## Build the TikZJax runtime

```bash
yarn build
```

Successful completion creates exactly:

```text
dist/tex.wasm
dist/tex.wasm.gz
dist/core.dump
dist/core.dump.gz
```

Validate them with:

```bash
yarn validate:dist
```

The validator confirms that all four files exist and that each `.gz` expands byte-for-byte to its uncompressed counterpart.

## Full validation

For the normal complete project build/check workflow:

```bash
yarn bfc
```

`bfc` is the short alias for `build:full:check`.

## Documentation

Install the Python documentation dependencies when needed:

```bash
python -m pip install -r site/requirements.txt
```

Start the local site:

```bash
yarn dev
```

Expose it on the local network:

```bash
yarn dev:lan
```

Both commands run MkDocs from `site/`, so paths in `site/mkdocs.yml` resolve identically locally and in GitHub Pages CI.

## Next steps

- understand the [build pipeline](build-pipeline.md);
- inspect the [runtime artifacts](artifacts.md);
- read the complete [TikZJax integration](tikzjax-integration.md);
- see the [Yarn command reference](reference/yarn-commands.md).
