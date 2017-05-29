#!/bin/bash
#set -x
docker run -v "$PWD/../":"/service"  giorgiocasciaro/alpine-node-compiler:v3
