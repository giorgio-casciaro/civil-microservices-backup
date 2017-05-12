#/bin/bash
#
# #docker stop mongo
# docker stop elas
# docker stop aerospike
#
# #docker rm mongo
# docker rm elas
# docker rm aerospike
#
# #docker run -d --name mongo -p 27017:27017 mvertes/alpine-mongo
# # docker run -d --name elas elasticsearch -Etransport.host=0.0.0.0 -Ediscovery.zen.minimum_master_nodes=1
# docker run -d -v "$PWD/aerospike.conf":"/etc/aerospike/aerospike.conf" --name aerospike -p 3000:3000 -p 3001:3001 -p 3002:3002 -p 3003:3003 aerospike/aerospike-server
docker-compose down -v
docker-compose down
docker network prune --force
sleep 1

sudo sysctl -w vm.max_map_count=262144
# docker run  --name elas -p 9200:9200 -p 9300:9300 itzg/elasticsearch:latest
docker-compose up -d aerospike
docker-compose up -d elasticsearch
docker-compose up -d admin
docker-compose up -d smtp
docker-compose up -d www
# docker-compose run users
# docker-compose run users --entrypoint "sh -c \"cd /service/ && npm run watch_test\""
# docker-compose up aerospike-amc  &
