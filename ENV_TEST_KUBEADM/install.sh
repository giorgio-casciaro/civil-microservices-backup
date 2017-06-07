#!/bin/sh
cd master
vagrant up --provision
# vagrant ssh -- sudo cp /etc/kubernetes/admin.conf \$HOME/ && sudo chown $(id -u):$(id -g) \$HOME/admin.conf && export KUBECONFIG=\$HOME/admin.conf
# vagrant ssh -- kubectl apply -f https://git.io/weave-kube-1.6
# vagrant ssh -- kubectl create -f https://git.io/kube-dashboard
# vagrant ssh -- kubectl proxy --api-prefix=/ --address='192.168.33.100' --disable-filter=true
cd ..

cd node01
vagrant up --provision
# vagrant ssh -- sudo sysctl -w vm.max_map_count=262144
cd ..

# cd node02
# vagrant up --provision
# # vagrant ssh -- sudo sysctl -w vm.max_map_count=262144
# cd ..
#
# cd node03
# vagrant up --provision
# # vagrant ssh -- sudo sysctl -w vm.max_map_count=262144
# cd ..
