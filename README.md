# web2js

`web2js` is the TeX build/compiler toolchain that produces the WebAssembly runtime consumed by [TikZJax](https://github.com/rod2ik/tikzjax).

Its primary deliverable is not an npm package. It is the four-file runtime contract:

```text
dist/
├── tex.wasm
├── tex.wasm.gz
├── core.dump
└── core.dump.gz
```

Web2js owns compilation, TeX/LaTeX initialization and TeX-file metadata generation. TikZJax owns browser-side loading, configuration and rendering.

## Quick start

```bash
yarn --version  # expected: 4.17.1
yarn install --immutable
yarn doctor
yarn build
yarn validate:dist
```

For the most complete local validation:

```bash
yarn bfc
```

To deploy the validated runtime and generated TeX file metadata into a sibling `../tikzjax` checkout:

```bash
yarn deploy:tikzjax
```

## Documentation

The documentation source lives in `site/`.

```bash
yarn dev
```

For LAN access:

```bash
yarn dev:lan
```

The public documentation is deployed automatically to GitHub Pages after a push to `main`:

```text
https://rod2ik.github.io/web2js/
```

The first Pages publication requires one repository setting: **Settings → Pages → Source → GitHub Actions**.

## Releases

After `package.json` contains the desired version and the validated changes have been committed/pushed:

```bash
git tag vX.Y.Z
git push origin vX.Y.Z
```

The tag automatically creates a GitHub Release with generated notes, a complete project ZIP and the four runtime artifacts.

## Project structure

- `src/` — maintained compiler/runtime source;
- `vendor/texlive/` — imported TeX/e-TeX source material;
- `scripts/` — build, generation, test and deployment tooling;
- `build/` — disposable intermediate build files;
- `dist/` — the four final TikZJax runtime artifacts;
- `site/` — MkDocs documentation source;
- `.github/workflows/` — automatic Pages and Release workflows.

For the full architecture and the Web2js ↔ TikZJax workflow, see the MkDocs documentation.
