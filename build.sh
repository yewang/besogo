#!/bin/sh

all=besogo.all.js
min=besogo.min.js

cat js/* > $all

curl -s \
  -d compilation_level=SIMPLE_OPTIMIZATIONS \
  -d output_format=text \
  -d output_info=compiled_code \
  --data-urlencode "js_code@${all}" \
  http://closure-compiler.appspot.com/compile \
  > $min
