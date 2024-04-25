#!/bin/bash
rm -rf dist/
npm run build
npx uglifyjs dist/index.js -o dist/index.js
