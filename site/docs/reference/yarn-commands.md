# Yarn command reference

Web2js uses Yarn 4.17.1. Install dependencies reproducibly with:

```bash
yarn install --immutable
```

| Command | Purpose |
| --- | --- |
| `yarn doctor` | Check required/optional system tools |
| `yarn dev` | Serve the MkDocs site locally |
| `yarn dev:lan` | Serve MkDocs on `0.0.0.0` for LAN testing |
| `yarn clean` | Remove runtime and documentation outputs |
| `yarn build` | Produce all four files in `dist/` |
| `yarn build:parser` | Generate `build/parser.js` from Jison grammar |
| `yarn build:tie` | Merge TeX/e-TeX WEB and change files |
| `yarn build:tangle` | Generate Pascal source/string pool |
| `yarn build:compile` | Compile Pascal to `build/out.wasm` |
| `yarn build:asyncify-wasm` | Asyncify/optimize to `build/tex.wasm` |
| `yarn build:initex` | Generate `build/core.dump` |
| `yarn build:dist` | Copy canonical raw artifacts from `build/` to `dist/` |
| `yarn build:gzip` | Create the two `.gz` files from the raw files already in `dist/` |
| `yarn validate:dist` | Verify the four runtime artifacts and gzip identity |
| `yarn gen:all` | Generate TikZ/TeX runtime metadata |
| `yarn build:all` | Runtime build + metadata generation |
| `yarn build:docs` | Build MkDocs into `public/` |
| `yarn build:full` | Runtime + metadata + documentation |
| `yarn build:full:check` | Full build plus architecture and `dist/` checks |
| `yarn bfc` | Alias for `build:full:check` |
| `yarn test` | Pascal compiler comparison tests |
| `yarn test:tex-packages` | Execute TeX package probes |
| `yarn javascript:check` | Run ESLint without modifications |
| `yarn architecture:check` | Verify expected refactored layout |
| `yarn deploy:tikzjax:runtime` | Copy the four `dist/` artifacts to `../tikzjax` |
| `yarn deploy:tikzjax:tex-files` | Merge generated TeX file names into TikZJax |
| `yarn deploy:tikzjax` | Regenerate merged TeX file list, then run both TikZJax deployment operations |
| `yarn zip` | Create a Git-aware source-project ZIP |
