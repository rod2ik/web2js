# Publishing Web2js and TikZJax

Web2js should be released **before** the TikZJax version that consumes its new runtime.

## Why Web2js comes first

The dependency direction is:

```text
Web2js
   │
   │ produces
   ▼
tex.wasm(.gz) + core.dump(.gz) + TeX runtime file metadata
   │
   │ deployed into
   ▼
TikZJax
   │
   │ packages/serves the runtime in the browser
   ▼
TikZ / LaTeX rendering
```

TikZJax depends on artifacts produced by Web2js. Web2js does not depend on a published TikZJax release to build its runtime.

## Recommended release sequence

### 1. Finish and validate Web2js

```bash
cd web2js
yarn install --immutable
yarn bfc
```

Test anything relevant to the runtime, then commit and push Web2js.

### 2. Release Web2js

After `package.json` contains the intended version:

```bash
git tag vX.Y.Z
git push origin vX.Y.Z
```

Wait for the automatic GitHub Release workflow to succeed.

### 3. Deploy Web2js into the local TikZJax checkout

```bash
yarn deploy:tikzjax
```

This transfers the runtime contract into the sibling TikZJax checkout.

### 4. Validate TikZJax with that runtime

```bash
cd ../tikzjax
yarn install --immutable
yarn bfc
yarn dev
```

The TikZJax documentation site should report the new preloaded format date and use its local vendor runtime during development.

### 5. Commit and release TikZJax

Only after the new Web2js runtime has been validated inside TikZJax should the corresponding TikZJax commit/tag be published.

## Source of truth at each stage

| Stage | Source of truth |
| --- | --- |
| Web2js development | maintained source + generated `dist/` |
| Web2js release | validated `dist/` artifacts; `core.dump` reconstructed from tracked `core.dump.gz` in CI |
| Local bridge | `yarn deploy:tikzjax` |
| TikZJax validation | TikZJax local runtime/vendor build |
| TikZJax release | validated TikZJax tagged commit |
