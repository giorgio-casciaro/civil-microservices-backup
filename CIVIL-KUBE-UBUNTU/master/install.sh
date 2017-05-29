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
apt-get install nfs-common

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

# kubeadm init --token=b68c42.b6bc83b6a136e3cf --pod-network-cidr 10.244.0.0/16  --api-advertise-addresses 192.168.33.100
# kubeadm join --token=b68c42.b6bc83b6a136e3cf 192.168.33.100

# export ARCH=amd64
# curl -sSL "https://github.com/coreos/flannel/blob/master/Documentation/kube-flannel.yml?raw=true" | sed "s/amd64/${ARCH}/g" | kubectl create -f -








# curl https://raw.githubusercontent.com/kubernetes/helm/master/scripts/get > get_helm.sh
# chmod 700 get_helm.sh
# ./get_helm.sh
#
# helm install --set config.LEGO_EMAIL=giorgio.casciaro@gmail.com stable/kube-lego
#
# EXAMPLE INGRESS YAML:
#
# apiVersion: extensions/v1beta1
# kind: Ingress
# metadata:
#   namespace: foo
#   annotations:
#     kubernetes.io/ingress.class: nginx
#     # Add to generate certificates for this ingress
#     kubernetes.io/tls-acme: 'true'
# spec:
#   rules:
#     - host: www.example.com
#       http:
#         paths:
#           - backend:
#               serviceName: exampleService
#               servicePort: 80
#             path: /
#   tls:
#     # With this configuration kube-lego will generate a secret in namespace foo called `example-tls`
#     # for the URL `www.example.com`
#     - hosts:
#         - "www.example.com"
#       secretName: example-tls
#

#


# helm init
# helm install stable/nginx-ingress


# The nginx-ingress controller has been installed.
# It may take a few minutes for the LoadBalancer IP to be available.
# You can watch the status by running 'kubectl --namespace default get services -o wide -w dozing-bear-nginx-ingress-controller'
#
# An example Ingress that makes use of the controller:
#
#   apiVersion: extensions/v1beta1
#   kind: Ingress
#   metadata:
#     annotations:
#       kubernetes.io/ingress.class: nginx
#     name: example
#     namespace: foo
#   spec:
#     rules:
#       - host: www.example.com
#         http:
#           paths:
#             - backend:
#                 serviceName: exampleService
#                 servicePort: 80
#               path: /
#     # This section is only required if TLS is to be enabled for the Ingress
#     tls:
#         - hosts:
#             - www.example.com
#           secretName: example-tls
#
# If TLS is enabled for the Ingress, a Secret containing the certificate and key must also be provided:
#
#   apiVersion: v1
#   kind: Secret
#   metadata:
#     name: example-tls
#     namespace: foo
#   data:
#     tls.crt: <base64 encoded cert>
#     tls.key: <base64 encoded key>
#   type: kubernetes.io/tls



# helm install --name basemongo \
#   --set mongodbRootPassword=on324_234g4325,mongodbUsername=basemongo,mongodbPassword=sdfs6fdg__dfgdfg_gdf,mongodbDatabase=base_db \
#     stable/mongodb
#
# NOTES:
# MongoDB can be accessed via port 27017 on the following DNS name from within your cluster:
# basemongo-mongodb.default.svc.cluster.local
#
# To connect to your database run the following command:
#
#    kubectl run basemongo-mongodb-client --rm --tty -i --image bitnami/mongodb --command -- mongo --host basemongo-mongodb -p on324_234g4325
