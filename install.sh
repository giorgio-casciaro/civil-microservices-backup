#!/bin/bash
set -x
cd NPM/jesus
npm install
sudo npm link
cd ../..
cd NPM/cqrs
npm install
sudo npm link
cd ../..
npm install
