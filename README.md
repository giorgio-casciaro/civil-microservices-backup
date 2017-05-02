# civil-microservices

per i test con elsasticsearch
sudo sysctl -w vm.max_map_count=262144

 docker network rm $(docker network ls | grep "bridge" | awk '/ / { print $1 }')

docker volume rm $(docker volume ls -qf dangling=true)
docker volume ls -qf dangling=true | xargs -r docker volume rm
