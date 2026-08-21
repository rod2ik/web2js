# Development

## Package manager

Web2js uses **Yarn 4.17.1** through Corepack and the `node_modules` linker configured in `.yarnrc.yml`.

For a reproducible install:

```bash
yarn install --immutable
```

## Documentation development

`web2js` is a compiler/build toolchain rather than a browser application, so `yarn dev` is intentionally assigned to MkDocs:

```bash
yarn dev
```

Default address:

```text
http://127.0.0.1:8000/
```

For another machine or phone on the same LAN:

```bash
yarn dev:lan
```

This binds MkDocs to `0.0.0.0:8000`. Override the port with `WEB2JS_DEV_PORT` if needed.

## Runtime development

Use granular commands when working on one phase of the compiler:

```bash
yarn build:parser
yarn build:tie
yarn build:tangle
yarn build:compile
yarn build:asyncify-wasm
yarn build:initex
yarn build:dist
yarn build:gzip
```

For normal use, prefer:

```bash
yarn build
```

so dependencies between stages are respected.

## Tests

The Pascal compiler comparison suite is:

```bash
yarn test
```

It uses fixtures in `spec/` and Free Pascal (`fpc`) to obtain reference output when the cache does not already contain it.

TeX package probes can be checked with:

```bash
yarn test:tex-packages
```

JavaScript lint checking is available separately:

```bash
yarn javascript:check
```

## Full workflows

```bash
yarn build:all
```

builds the four runtime artifacts and regenerates TikZ/TeX probe metadata.

```bash
yarn build:full
```

adds the strict MkDocs documentation build.

```bash
yarn bfc
```

runs `build:full:check`: full runtime build, metadata generation, documentation build, architecture checks and `dist/` validation.

The historical Pascal comparison suite remains an explicit command because it additionally requires Free Pascal.

## Working with TikZJax

The usual cross-project loop is:

```bash
cd ../web2js
yarn bfc
yarn deploy:tikzjax

cd ../tikzjax
yarn bfc
yarn dev
```

See [TikZJax integration](tikzjax-integration.md) for the complete handoff model.

## Project ZIP

```bash
yarn zip
```

creates a Git-aware project archive next to the checkout. Generated `build/`, `public/`, caches and `node_modules/` stay excluded. The ignored raw `dist/core.dump` is added explicitly when present, so a normal local/release ZIP still contains all four runtime artifacts.
