#!/bin/bash
rm -rf dist/
yarn build
yarn uglifyjs dist/index.js -o dist/index.js
