#JVM elasticSearch problem
# sudo cat <<EOF >  /etc/systemd/system/weave.service
# vm.max_map_count=262144
# EOF
# sudo cat <<EOF >  /etc/sysctl.conf
# vm.max_map_count=262144
# EOF
#
# sudo cat <<EOF >  /etc/rc.local
# #!/bin/sh -e
# sudo sysctl -w vm.max_map_count=262144
# exit 0
# EOF
#
# sysctl -w vm.max_map_count=262144


sudo apt-get update
sudo apt-get install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    software-properties-common

curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
sudo add-apt-repository \
   "deb [arch=amd64] https://download.docker.com/linux/ubuntu \
   $(lsb_release -cs) \
   stable"
sudo apt-get update
sudo apt-get install -y docker-ce
sudo systemctl enable docker
sudo systemctl start docker

sudo apt install unzip
curl -sSL -o nomad.zip  https://releases.hashicorp.com/nomad/0.5.6/nomad_0.5.6_linux_amd64.zip
unzip nomad.zip
sudo chmod +x nomad
sudo mv nomad /usr/bin/nomad
sudo mkdir -p /etc/nomad.d
sudo chmod a+w /etc/nomad.d
sudo mkdir -p /opt/nomad/data
sudo mkdir -p /var/log/nomad
sudo chmod a+w /var/log/nomad
# sudo cp /vagrant/server.hcl /etc/nomad.d/

echo Fetching Consul...
curl -sSL https://releases.hashicorp.com/consul/0.8.3/consul_0.8.3_linux_amd64.zip -o consul.zip
echo Installing Consul...
unzip consul.zip
sudo chmod +x consul
sudo mv consul /usr/bin/consul
sudo mkdir -p /etc/consul.d
sudo chmod a+w /etc/consul.d
sudo mkdir -p /opt/consul/data
sudo mkdir -p /var/log/consul
sudo chmod a+w /var/log/consul
# sudo cp /vagrant/consul.json /etc/consul.d/

# sudo cat <<EOF >  /etc/apt/sources.list.d/kubernetes.list
# deb http://apt.kubernetes.io/ kubernetes-xenial main
# EOF
# sudo apt-get install -y kubelet kubeadm kubectl
# sudo systemctl enable kubelet
# sudo systemctl start kubelet
#
# sudo kubeadm init --apiserver-advertise-address 192.168.33.100 --token=b68c42.b6bc83b6a136e3cf
 # kubernetes-cni

# sudo apt-get install -y apt-transport-https curl
# sudo curl -s https://packages.cloud.google.com/apt/doc/apt-key.gpg | sudo apt-key add -
#
# sudo cat <<EOF >  /etc/apt/sources.list.d/kubernetes.list
# deb http://apt.kubernetes.io/ kubernetes-xenial main
# EOF
# sudo cat /etc/apt/sources.list.d/kubernetes.list
#
# sudo apt-get update
# sudo apt-get install -y docker.io
# sudo apt-get install -y kubelet kubeadm kubectl kubernetes-cni
# sudo apt-get install -y mc
#
# sudo kubeadm reset
# sudo kubeadm init --apiserver-advertise-address 192.168.33.100 --token=b68c42.b6bc83b6a136e3cf
#
# sudo cp /etc/kubernetes/admin.conf $HOME/
# sudo chown $(id -u):$(id -g) $HOME/admin.conf
# export KUBECONFIG=$HOME/admin.conf
#
#
# kubectl apply -f /weave.yaml
#
# kubectl create -f https://git.io/kube-dashboard

# sleep 20
#
# kubectl proxy --api-prefix=/ --address='192.168.33.100' --disable-filter=true
# kubectl taint nodes kube-master dedicated-
