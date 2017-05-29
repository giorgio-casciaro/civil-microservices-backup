sudo -s

# cat <<EOF >  /etc/hosts
# 192.168.33.100 kube-master
# 192.168.33.101 kube-node-01
# 192.168.33.102 kube-node-02
# 192.168.33.103 kube-node-03
# 192.168.33.104 kube-node-04
# 192.168.33.105 kube-node-05
# 192.168.33.106 kube-node-06
#
# EOF


#JVM elasticSearch problem
cat <<EOF >  /etc/sysctl.conf
vm.max_map_count=262144
EOF
sysctl -w vm.max_map_count=262144


apt-get update && apt-get install -y apt-transport-https curl
curl -s https://packages.cloud.google.com/apt/doc/apt-key.gpg | apt-key add -

cat <<EOF >  /etc/apt/sources.list.d/kubernetes.list
deb http://apt.kubernetes.io/ kubernetes-xenial main
EOF
cat /etc/apt/sources.list.d/kubernetes.list

apt-get update
apt-get install -y docker.io
apt-get install -y kubelet kubeadm kubectl kubernetes-cni
apt-get install mc

kubeadm init --token=b68c42.b6bc83b6a136e3cf   --api-advertise-addresses 192.168.33.100
kubectl apply -f https://git.io/weave-kube


# aggiungere --cluster-cidr=10.32.0.0/12 a proxy daemonset
# gcr.io/google_containers/kube-proxy-amd64:v1.5.4
# Environment variables:
# -
# Commands:
# kube-proxy
# --cluster-cidr=10.32.0.0/12
# --kubeconfig=/run/kubeconfig
