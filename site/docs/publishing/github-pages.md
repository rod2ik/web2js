# GitHub Pages

Web2js publishes its MkDocs documentation to GitHub Pages automatically from the `main` branch.

## Normal workflow

Once GitHub Pages has been enabled for the repository, normal documentation publishing requires no special command beyond the usual Git workflow:

```bash
git add .
git commit -m "Update documentation"
git push
```

A push to `main` triggers:

```text
git push
   │
   ▼
.github/workflows/pages.yml
   │
   ├── checkout
   ├── Node.js + Yarn 4.17.1
   ├── yarn install --immutable
   ├── Python + MkDocs dependencies
   ├── yarn build:docs
   ├── upload public/
   ▼
GitHub Pages
```

The published URL is:

```text
https://rod2ik.github.io/web2js/
```

## One-time GitHub configuration

For the first publication only, open the repository on GitHub and configure:

```text
Settings
└── Pages
    └── Build and deployment
        └── Source: GitHub Actions
```

After that one-time setting, pushes to `main` are sufficient. The workflow can also be started manually from the **Actions** tab because it supports `workflow_dispatch`.

## What Pages builds

The Pages workflow does **not** rebuild TeX, WebAssembly, `core.dump`, or the TikZJax runtime. It builds only the documentation from `site/`:

```bash
yarn build:docs
```

This is intentional. Documentation publication should remain fast and should not require the full TeX WEB toolchain on GitHub-hosted runners.

The generated site is written to:

```text
public/
```

and `public/` is uploaded as the GitHub Pages artifact.

## Documentation dependencies

Python dependencies required by CI live in:

```text
site/requirements.txt
```

The project keeps MkDocs below version 2 and Material for MkDocs below version 10.

## Local equivalent

Use:

```bash
yarn dev
```

or, for another device on the same network:

```bash
yarn dev:lan
```

For a strict local production build equivalent to CI:

```bash
yarn build:docs
```
