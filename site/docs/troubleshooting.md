# Troubleshooting

## `tie` or `tangle` not found

Run:

```bash
yarn doctor
```

and verify that your TeX Live installation provides the WEB tools. The build cannot merge or tangle the TeX WEB source without them.

## `wasm-opt` not found

Install project dependencies first:

```bash
yarn install
```

The project depends on Binaryen and the build invokes `wasm-opt` through Yarn's command resolution.

## `yarn test` cannot find `fpc`

The comparison test suite needs Free Pascal when a cached reference output is unavailable. Install Free Pascal or run only the runtime build/validation commands if you are not working on compiler tests.

## MkDocs is missing

`yarn dev`, `yarn dev:lan` and `yarn build:docs` require MkDocs. Install MkDocs 1.x and Material for MkDocs in your Python environment.

## `yarn deploy:tikzjax` cannot find TikZJax

The local deploy scripts expect sibling checkouts:

```text
parent/
├── web2js/
└── tikzjax/
```

Build and validation do not require this layout; only deployment does.

## `dist/` validation fails

Rebuild from scratch:

```bash
yarn build
yarn validate:dist
```

Do not manually gzip the artifacts. `yarn build:gzip` owns creation of both `.gz` files and uses maximum gzip compression.

## GitHub Pages workflow says Pages is not configured

For the first publication, configure the repository once:

```text
Settings → Pages → Build and deployment → Source → GitHub Actions
```

Then re-run the failed Pages workflow or push a new commit to `main`.

## Release workflow rejects the tag

The tag must exactly match `v` plus the `package.json` version.

Example:

```text
package.json version: 1.0.4
required tag:        v1.0.4
```

Correct the version/tag relationship before creating a release. Do not bypass this check because TikZJax needs to be able to identify which Web2js runtime release produced its artifacts.
