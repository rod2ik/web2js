# Project layout

```text
web2js/
├── .github/
│   └── workflows/         # GitHub Pages and automatic Release workflows
├── src/
│   ├── compiler/          # Pascal parser/compiler implementation
│   ├── runtime/           # WebAssembly host library and memory constants
│   └── tex/               # Project-specific TeX WEB changes/resources
├── vendor/
│   └── texlive/           # Imported TeX/e-TeX source material
├── scripts/
│   ├── build/             # Build orchestration, initex, gzip, validation
│   ├── deploy/            # Local deployment to ../tikzjax
│   ├── generate/          # TikZ/TeX metadata generators
│   ├── runtime/           # Local TeX runtime runner
│   └── test/              # Test runners
├── spec/                  # Pascal test fixtures
├── tex_packages/          # TeX package probes and generated metadata
├── tikz_libs/             # TikZ library probes and generated metadata
├── build/                 # Disposable intermediate build state
├── dist/                  # Four final TikZJax runtime artifacts
├── site/                  # MkDocs source + Python docs requirements
├── public/                # Generated documentation site
├── Dockerfile
├── package.json
└── yarn.lock
```

The key rules are:

- maintained compiler/runtime source belongs in `src/`;
- build/deploy/test orchestration belongs in `scripts/`;
- imported third-party TeX source belongs in `vendor/`;
- disposable intermediates belong in `build/`;
- the four TikZJax runtime deliverables belong in `dist/`;
- documentation source belongs in `site/`;
- GitHub automation belongs in `.github/workflows/`.
