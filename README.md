# web2js

This is a Pascal compiler that targets WebAssembly, designed specifically to compile TeX.

## Getting started

The following assumes you have TeX running on your machine (e.g., that `tangle` is available), and that you have the
necessary TeX files installed on your system.

A quick path to generate the tex.wasm and core.dump files is

```sh
npm install
npm run build
```

Note that newer versions of TeX are not compatible with this system. This is known to work with texlive 2019. Since this
is not usually available on newer distributions of Linux a `Dockerfile` is included that provides a compatible Ubuntu
20.04 system to work with. To build and run the docker container execute the following.

```sh
docker build -t web2js .
docker run -it --rm -v `pwd`:/opt/web2js web2js
```

Inside the container run the previous commands to generate the tex.wasm and core.dump files.

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
wasm-opt --asyncify --pass-arg=asyncify-ignore-indirect --pass-arg=asyncify-imports@library.reset -O4 out.wasm -o tex.wasm
```

Note that if you want to unwind/rewind other imports in the library, remove the asyncify-imports part from the above
command or specifically add the imports to that part.

Produce the memory dump corresponding to the WebAssembly binary.

```sh
node initex.js
```

To test the assembly and core dump run

```sh
node tex.js sample.tex
```

If you remove `\\def\\pgfsysdriver{pgfsys-ximera.def}`, re-run `node initex.js`, compile `sample.tex` by running

```sh
node tex.js sample.tex
```

This outputs sample.dvi. Convert to pdf to view using dvipdf (or dvips and ps2pdf).

Alternately change

```js
library.setInput("\n&latex \\documentclass...}\n\n",
```

in initex.js to

```js
library.setInput("\n&latex\n\n",
```

to generate a general latex compiler. To use it uncomment the first three lines of sample.tex, and run

```sh
node tex.js sample.tex
```
