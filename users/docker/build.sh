#!/bin/bash
#set -x
#
#docker stop "baseServiceCompiler"
docker run -v "$PWD/../":"/service"  giorgiocasciaro/civil-microservices-users-compile:v1
