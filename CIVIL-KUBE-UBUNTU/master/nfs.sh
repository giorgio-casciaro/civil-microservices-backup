sudo apt-get install nfs-kernel-server

cat <<EOF >  /etc/exports
/var/nfs        127.0.0.1(rw,sync,no_subtree_check)
/var/nfs        192.168.33.100(rw,sync,no_subtree_check)
/var/nfs        192.168.33.101(rw,sync,no_subtree_check)
/var/nfs        192.168.33.102(rw,sync,no_subtree_check)
/var/nfs        192.168.33.103(rw,sync,no_subtree_check)
/var/nfs        192.168.33.104(rw,sync,no_subtree_check)
/var/nfs        192.168.33.105(rw,sync,no_subtree_check)
/var/nfs        192.168.33.106(rw,sync,no_subtree_check)
/var/nfs        192.168.33.107(rw,sync,no_subtree_check)
/var/nfs        192.168.33.108(rw,sync,no_subtree_check)
/var/nfs        192.168.33.109(rw,sync,no_subtree_check)

EOF

mkdir /var/nfs
chmod 755 /var/nfs

sudo systemctl restart nfs-kernel-server
sudo systemctl enable nfs-kernel-server

cat <<EOF >  ./pvNfs.yaml
apiVersion: v1
kind: PersistentVolume
metadata:
  name: nfs
spec:
  capacity:
    storage: 20Gi
  accessModes:
    - ReadWriteOnce
  persistentVolumeReclaimPolicy: Recycle
  nfs:
    server: 192.168.33.100
    path: "/var/nfs"
EOF

kubectl apply -f ./pvNfs.yaml
