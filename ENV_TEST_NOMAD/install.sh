#!/bin/sh
cd node1
vagrant up --provision
cd ..

cd node2
vagrant up --provision
cd ..

cd node3
vagrant up --provision
cd ..
