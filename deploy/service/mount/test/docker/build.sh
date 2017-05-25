#!/bin/bash
#set -x
RAW_DOCKER_IMAGE_VERSION=$(cat "version.var.sh")
MICROSERVICE_ID="civil-microservices-deploy-test";
MICROSERVICE_DOCKER_IMAGE_NAME="giorgiocasciaro/$MICROSERVICE_ID";
echo $RAW_DOCKER_IMAGE_VERSION
# cd docker
docker build --tag $RAW_DOCKER_IMAGE_VERSION -t $MICROSERVICE_DOCKER_IMAGE_NAME  -f "./Dockerfile" ..
docker stop $MICROSERVICE_ID
docker rm $MICROSERVICE_ID

#DOCKER CONTAINER
echo "docker exec -i -t --user $MICROSERVICE_USER $MICROSERVICE_ID /bin/bash "
echo "docker push $MICROSERVICE_DOCKER_IMAGE_NAME "

docker run -it --net="host" --name $MICROSERVICE_ID $MICROSERVICE_DOCKER_IMAGE_NAME
