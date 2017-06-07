ufw allow ssh # sshd on port 22, be careful to not get locked out!
ufw allow 6443 # remote, secure Kubernetes API access
ufw allow 80
ufw allow 443
ufw default deny incoming # deny traffic on every other port, on any interface
ufw enable


apt-get install -y docker.io

EOF
sudo cat <<EOF >  /etc/systemd/system/docker.service.d/10-docker-opts.conf
Environment="DOCKER_OPTS=--iptables=false --ip-masq=false"
EOF

systemctl restart docker

curl -s https://packages.cloud.google.com/apt/doc/apt-key.gpg | apt-key add -
cat <<EOF > /etc/apt/sources.list.d/kubernetes.list
deb http://apt.kubernetes.io/ kubernetes-xenial-unstable main
EOF
apt-get update
apt-get install -y kubelet kubeadm kubectl kubernetes-cni

#
# EOF
# sudo cat <<EOF >  /tmp/master-configuration.yml
# apiVersion: kubeadm.k8s.io/v1alpha1
# kind: MasterConfiguration
# api:
#   advertiseAddress: 10.0.1.1
# etcd:
#   endpoints:
#   - http://10.0.1.1:2379
#   - http://10.0.1.2:2379
#   - http://10.0.1.3:2379
# apiServerCertSANs:
#   - <PUBLIC_IP_KUBE1>
# EOF
# kubeadm init --config /tmp/master-configuration.yml
#
#
# # create symlink for the current user in order to gain access to the API server with kubectl
# [ -d $HOME/.kube ] || mkdir -p $HOME/.kube
# ln -s /etc/kubernetes/admin.conf $HOME/.kube/config
#
# # install Weave Net
# kubectl apply -f https://git.io/weave-kube-1.6
#
# # allow traffic on the newly created weave network interface
# ufw allow in on weave
# ufw reload
#
#
# # install jq, a powerful tool for querying and manipulating JSON
# apt-get install jq
#
# # apply patch to kube-proxy
# kubectl -n kube-system get ds -l 'k8s-app=kube-proxy' -o json \
#   | jq '.items[0].spec.template.spec.containers[0].command |= .+ ["--proxy-mode=userspace"]' \
#   | kubectl apply -f - && kubectl -n kube-system delete pods -l 'k8s-app=kube-proxy'
#
#   kubectl create clusterrolebinding permissive-binding \
  # --clusterrole=cluster-admin \
  # --user=admin \
  # --user=kubelet \
  # --group=system:serviceaccounts
