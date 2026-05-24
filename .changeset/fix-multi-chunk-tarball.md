---
"@arethetypeswrong/core": patch
---

Fix crash on packages whose tarball gunzips into multiple chunks

`extractTarball` assigned `unzipped = chunk` in the `Gunzip` streaming callback,
which keeps only the last emitted chunk. fflate emits multiple chunks for larger
tarballs, so for any package big enough to decompress into more than one chunk
the callback discarded everything but the final (often empty) chunk. `untar`
then returned zero files and the next line crashed with
`Cannot read properties of undefined (reading 'filename')` on `data[0]`.

The chunks are now concatenated before being passed to `untar`, so larger
packages are handled correctly.
