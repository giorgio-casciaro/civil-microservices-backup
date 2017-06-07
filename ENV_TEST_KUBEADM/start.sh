#!/bin/sh
cd master
vagrant up
vagrant ssh -- sudo sysctl -w vm.max_map_count=262144
cd ..

cd node01
vagrant up
vagrant ssh -- sudo sysctl -w vm.max_map_count=262144
cd ..

cd node02
vagrant up
vagrant ssh -- sudo sysctl -w vm.max_map_count=262144
cd ..

cd node03
vagrant up
vagrant ssh -- sudo sysctl -w vm.max_map_count=262144
cd ..
