#!/bin/bash

echo "Init"
npm i

echo "build TypeDef"
pushd TypeDef
tsc
popd

echo "Build project"
tsc

echo "Build pkgs"
npm run pkg

