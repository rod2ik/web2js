# Project architecture

The refactored layout separates maintained source code, third-party source material, build intermediates, deliverables, tooling and documentation.

## Maintained source: `src/`

```text
src/
├── compiler/
│   ├── compile.js
│   ├── index.js
│   ├── parser.jison
│   └── pascal/
├── runtime/
│   ├── commonMemory.js
│   └── library.js
└── tex/
    ├── changes/
    └── pgfsys-ximera.def
```

`src/compiler/` contains the Pascal-to-WebAssembly compiler and grammar. `src/runtime/` contains the host functions and memory configuration shared by the generated TeX runtime. `src/tex/changes/` contains the web change files applied to TeX/e-TeX.

## Third-party TeX sources: `vendor/`

```text
vendor/texlive/
├── texk/
└── etexdir/
```

These files originate from the TeX/Web2C/e-TeX source tree. They are build inputs, but they are not the project-specific compiler implementation, so `vendor/` communicates their role more accurately than the repository root.

## Tooling: `scripts/`

```text
scripts/
├── build/
├── deploy/
├── generate/
├── runtime/
└── test/
```

Build orchestration, gzip creation, local TikZJax deployment, probe generation and test runners are kept out of `src/`. This keeps the source tree focused on the compiler/runtime itself.

## Intermediate files: `build/`

`build/` is disposable. It contains generated parser code, merged WEB source, tangled Pascal, intermediate WebAssembly and initialization data.

Typical contents are:

```text
build/
├── parser.js
├── tex.web
├── tex.p
├── tex.pool
├── out.wasm
├── tex.wasm
├── core.dump
├── initex-files.json
└── tex_files.generated.json
```

## Deliverables: `dist/`

`dist/` contains only the four runtime files consumed/deployed by the TikZJax workflow.

See [Runtime artifacts](artifacts.md).
