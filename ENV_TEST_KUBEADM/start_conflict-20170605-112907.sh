#!/bin/sh
cd master
vagrant up
vagrant ssh -- kubectl proxy --api-prefix=/ --address='192.168.33.100' --disable-filter=true
cd ..

cd node01
vagrant up
# vagrant ssh -- sudo sysctl -w vm.max_map_count=262144
cd ..

# cd node02
# vagrant up
# # vagrant ssh -- sudo sysctl -w vm.max_map_count=262144
# cd ..
#
# cd node03
# vagrant up
# # vagrant ssh -- sudo sysctl -w vm.max_map_count=262144
# cd ..
