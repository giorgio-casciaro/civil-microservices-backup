kubectl proxy --disable-filter=true --address='192.168.33.100'

kubectl exec busybox -it -- sh

ELASTICSEARCH
sudo sysctl -w vm.max_map_count=262144


http://stackoverflow.com/questions/39872332/how-to-fix-weave-net-crashloopbackoff-for-the-second-node

DASHDOARD
kubectl create -f https://rawgit.com/kubernetes/dashboard/master/src/deploy/kubernetes-dashboard.yaml

HEAPSTER
git clone https://github.com/kubernetes/heapster.git
cd heapster/deploy/
sh kube.sh start
cd ../..



kubectl get nodes
kubectl get pods -n kube-system
kubectl describe pod <pod-name>
kubectl describe -n kube-system pod kubernetes-dashboard-3203962772-rskfs

kubectl exec mongo-0 -c mongodb -i -t bash
kubectl exec front-https-1688246205-ptm6b -n civil-connect -ti sh

nginx -c /etc/nginx-config-dir/nginx.conf -s reload


kubectl proxy --api-prefix=/ --address='192.168.33.100' --disable-filter=true

http://192.168.33.100:8001/ui

vagrant ssh -c "sudo cat /home/vagrant/devstack/local.conf" > local.conf

vagrant box add ./centos72_kubernetes15_worker.box --name centos72_kubernetes15_worker
vagrant init

heapster
https://github.com/kubernetes/heapster/tree/master/deploy/kube-config/influxdb
