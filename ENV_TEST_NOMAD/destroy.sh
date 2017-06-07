#!/bin/sh
cd node1
vagrant destroy
cd ..

cd node2
vagrant destroy
cd ..

cd node3
vagrant destroy
cd ..
