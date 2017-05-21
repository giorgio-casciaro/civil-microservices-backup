#!/bin/bash
#set -x
MICROSERVICE_ID="civil-microservices-users-compiler";
MICROSERVICE_DOCKER_IMAGE_NAME="giorgiocasciaro/civil-microservices-users-compile:v1";

# cd docker
docker build --tag $MICROSERVICE_ID -t $MICROSERVICE_DOCKER_IMAGE_NAME  -f "./Dockerfile" ../..

docker run -it  giorgiocasciaro/civil-microservices-users-compile:v1
