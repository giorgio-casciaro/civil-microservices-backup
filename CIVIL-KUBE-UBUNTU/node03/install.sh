# systemctl disable firewalld
# systemctl stop firewalld
#
# yum -y install ntp
# systemctl start ntpd
# systemctl enable ntpd
#
#
# setenforce 0
# cat <<EOF >  /etc/selinux/config
# # This file controls the state of SELinux on the system.
# # SELINUX= can take one of these three values:
# #     enforcing - SELinux security policy is enforced.
# #     permissive - SELinux prints warnings instead of enforcing.
# #     dapt-get install -y kubelet kubeadm kubectl kubernetes-cniargeted - Targeted processes are protected,
# #     minimum - Modification of targeted policy. Only selected processes are protected.
# #     mls - Multi Level Security protection.
# SELINUXTYPE=targeted
# EOF
#
sudo -s

cat <<EOF >  /etc/hosts
192.168.33.100 kube-master
192.168.33.101 kube-node-01
192.168.33.102 kube-node-02
192.168.33.103 kube-node-03
192.168.33.104 kube-node-04
192.168.33.105 kube-node-05
192.168.33.106 kube-node-06

EOF


apt-get update && apt-get install -y apt-transport-https curl
curl -s https://packages.cloud.google.com/apt/doc/apt-key.gpg | apt-key add -

cat <<EOF >  /etc/apt/sources.list.d/kubernetes.list
deb http://apt.kubernetes.io/ kubernetes-xenial main
EOF
cat /etc/apt/sources.list.d/kubernetes.list

apt-get update
apt-get install -y docker.io
apt-get install -y kubelet kubeadm kubectl kubernetes-cni
apt-get install nfs-common

# kubeadm init --token=b68c42.b6bc83b6a136e3cf --pod-network-cidr 10.244.0.0/16  --api-advertise-addresses 192.168.33.100
# kubeadm join --token=b68c42.b6bc83b6a136e3cf 192.168.33.100
