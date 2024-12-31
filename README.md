# web2js

This is a Pascal compiler that targets WebAssembly, designed specifically to compile TeX.

## Getting started

The following assumes you have TeX running on your machine (e.g., that `tangle` is available), and that you have the
necessary TeX files installed on your system.

A quick path to generate the `tex.wasm` and `core.dump` files is

```sh
npm install
npm run build
```

Note that this is known to work with TeXLive 2023. A `Dockerfile` is included that provides a compatible Ubuntu 24.04
system to work with. To build and run the docker container execute the following.

```sh
docker build -t web2js .
docker run -it --rm -v `pwd`:/opt/web2js web2js
```

Inside the container execute `npm run build` to generate the `tex.wasm` and `core.dump` files.

More details on the build process are below.

Install node modules.

```sh
npm install
```

Generate the Pascal parser.

```sh
npm run build:parser
```

The contents of the `texk` and `etexdir` subdirectories were simply copied from tug.org via

```sh
mkdir texk
rsync -a --delete --exclude=.svn tug.org::tldevsrc/Build/source/texk/web2c/tex.web texk
rsync -a --delete --exclude=.svn tug.org::tldevsrc/Build/source/texk/web2c/etexdir .
```

Tie the TeX WEB source and e-TeX change file.

```sh
tie -m tex.web texk/tex.web etexdir/etex.ch date.ch tex-final-end.ch
```

Produce the Pascal source by tangling.

```sh
tangle -underline tex.web etex.sys
```

You will now have the Pascal source `tex.p` along with `tex.pool` which contains the strings.

Compile the `tex.p` sources to get the WebAssembly binary `out.wasm`.

```sh
node compile.js tex.p out.wasm
```

The above three commands can all be run with

```sh
npm run build:wasm
```

Then optimize and asyncify the wasm binary by running

```sh
wasm-opt --asyncify --pass-arg=asyncify-ignore-indirect \
  --pass-arg=asyncify-imports@library.reset,library.getfilesize -O4 out.wasm -o tex.wasm
```

Note that if you want to unwind/rewind other imports in the library, add the imports to the asyncify-imports part in the
above command.

Produce the memory dump corresponding to the WebAssembly binary.

```sh
node initex.js
```

To test the assembly and core dump run

```sh
node tex.js tex_packages/pgfplots.tex
```

Remove `\\def\\pgfsysdriver{pgfsys-ximera.def}` from `initex.js`, re-run `node initex.js`, and compile
`tex_packages/pgfplots.tex` by running

```sh
node tex.js tex_packages/pgfplots.tex
```

This will output `tex_packages/pgfplots.dvi`. Convert to pdf to view using `dvipdf` (or `dvips` and `ps2pdf`).

Alternately change

```js
library.setInput("\n&latex\n\\documentclass...\n\n",
```

in `initex.js` to

```js
library.setInput("\n&latex\n\n",
```

to generate a general latex compiler. To use it uncomment the first two lines of `tex_packages/pgfplots.tex.tex`, and
run

```sh
node tex.js tex_packages/pgfplots.tex
```
