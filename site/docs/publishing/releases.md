# GitHub Releases

A pushed version tag creates a GitHub Release automatically.

## Single source of truth for the version

The project version has one canonical source:

```text
package.json → version
```

For example:

```json
"version": "1.0.4"
```

The Git tag must be exactly that version prefixed with `v`.

## Required order

First update `package.json` to the release version and validate the project. For example, for version `1.0.4`:

```json
"version": "1.0.4"
```

Then commit and push normally:

```bash
git add .
git commit -m "Prepare 1.0.4"
git push
```

After the commit is on GitHub, create and push the tag:

```bash
git tag v1.0.4
git push origin v1.0.4
```

The tag push triggers:

```text
git push origin v1.0.4
   │
   ▼
.github/workflows/release.yml
   │
   ├── verify tag == v + package.json version
   ├── reconstruct dist/core.dump from dist/core.dump.gz
   ├── node scripts/architecture-check.mjs
   ├── node scripts/build/validate-dist.mjs
   ├── node scripts/create-project-zip.mjs
   ├── generate release notes
   ▼
GitHub Release
```

## Why the Release workflow does not run `yarn install`

The Release workflow does not compile Web2js from source. It validates and packages the runtime that was already built and tested locally before the tag was created.

The scripts used by the workflow rely only on Node.js built-ins and standard GitHub runner tools. Installing the full Yarn dependency graph would unnecessarily compile the native `node-kpathsea` dependency and require the TeX/Kpathsea development environment.

Therefore the Release workflow deliberately avoids `yarn install`.

## Release assets

Each automatic release attaches:

```text
web2js-X.Y.Z-project.zip
tex.wasm
tex.wasm.gz
core.dump
core.dump.gz
```

This makes the release useful both as a complete source/project snapshot and as an explicit distribution point for the four runtime artifacts.

## Safety check: tag and package version

The workflow refuses to publish a release when the tag does not match `package.json`.

For example:

```text
package.json: 1.0.4
accepted tag: v1.0.4
rejected tag: v1.0.5
```

This prevents an accidental mismatch between source version and GitHub Release version.

## Why the workflow validates but does not rebuild the runtime

The release workflow validates the four `dist/` artifacts rather than rebuilding the entire TeX runtime on GitHub. `dist/core.dump` is not committed because it exceeds GitHub's regular Git object limit; the workflow reconstructs it byte-for-byte from the tracked `dist/core.dump.gz` before validation.

A full Web2js runtime build depends on the TeX WEB toolchain and on the exact TeX environment used to generate `core.dump`. The intended release workflow is therefore:

```text
local development machine
   │
   ├── yarn install --immutable
   ├── yarn bfc
   ├── inspect/test the resulting runtime
   ├── commit the validated trackable dist/ artifacts (`core.dump.gz`, not raw `core.dump`)
   ▼
GitHub tag
   │
   ├── reconstruct raw core.dump
   ├── validate committed artifacts
   ▼
GitHub Release
```

This keeps releases deterministic with respect to the runtime that was actually tested before the tag was created.
