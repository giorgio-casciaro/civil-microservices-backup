#!/bin/sh
cd master
vagrant halt
cd ..

cd node01
vagrant halt
cd ..

cd node02
vagrant halt
cd ..

cd node03
vagrant halt
cd ..
