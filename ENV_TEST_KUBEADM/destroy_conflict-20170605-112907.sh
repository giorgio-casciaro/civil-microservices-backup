#!/bin/sh
cd master
vagrant destroy
cd ..

cd node01
vagrant destroy
cd ..

# cd node02
# vagrant destroy
# cd ..
#
# cd node03
# vagrant destroy
# cd ..
