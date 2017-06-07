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
