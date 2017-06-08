export NODE_IP=192.168.1.201
export SERVERS="[\"192.168.1.201\", \"192.168.1.202\",\"192.168.1.203\"]"

# ENV VARS
sudo cat <<EOF >  /etc/environment
CONSUL_HTTP_ADDR=http://$NODE_IP:8500
NOMAD_ADDR=http://$NODE_IP:4646
NODE_IP=$NODE_IP
SERVERS=$SERVERS
EOF
export CONSUL_HTTP_ADDR=http://$NODE_IP:8500
export NOMAD_ADDR=http://$NODE_IP:4646

# UPDATE
sudo apt-get update
sudo apt-get install -y  apt-transport-https  ca-certificates  curl  software-properties-common  unzip

# DOCKER
if [ ! -f "/vagrant/dockergpc" ]; then curl -sSL -o /vagrant/dockergpc https://download.docker.com/linux/ubuntu/gpg ; fi
sudo apt-key add /vagrant/dockergpc
sudo add-apt-repository \
   "deb [arch=amd64] https://download.docker.com/linux/ubuntu \
   $(lsb_release -cs) \
   stable"
sudo apt-get update
sudo apt-get install -y docker-ce
sudo systemctl enable docker
sudo systemctl start docker

# CONSUL
if [ ! -f "/vagrant/consul.zip" ]; then curl -sSL https://releases.hashicorp.com/consul/0.8.3/consul_0.8.3_linux_amd64.zip -o /vagrant/consul.zip ; fi

unzip /vagrant/consul.zip
sudo chmod +x consul
sudo mv consul /usr/bin/consul
sudo mkdir -p /etc/consul.d
sudo mkdir -p /var/consul
sudo chmod a+w /etc/consul.d
sudo chmod a+w /var/consul

sudo cat <<EOF >  /etc/consul.d/consul.json
{
"bind_addr": "$NODE_IP",
"client_addr": "$NODE_IP",
"data_dir": "/var/consul",
"log_level": "DEBUG",
"server": true,
"ui": true,
"bootstrap_expect": 3,
"encrypt": "viIWiDibfrFw68JS2gR5zA==",
"rejoin_after_leave": true,
"retry_join": $SERVERS
 }
EOF

sudo cat <<EOF >  /etc/systemd/system/consul.service
[Unit]
Description=consul agent
Requires=network-online.target
After=network-online.target

[Service]
Restart=on-failure
ExecStart=/usr/bin/consul agent -config-dir=/etc/consul.d/
ExecReload=/bin/kill -HUP $MAINPID

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl enable consul.service
sudo systemctl stop consul
sudo systemctl start consul

# NOMAD
if [ ! -f "/vagrant/nomad.zip" ]; then curl -sSL https://releases.hashicorp.com/nomad/0.5.6/nomad_0.5.6_linux_amd64.zip -o /vagrant/nomad.zip ; fi

unzip /vagrant/nomad.zip
sudo chmod +x nomad
sudo mv nomad /usr/bin/nomad
sudo mkdir -p /etc/nomad.d
sudo chmod a+w /etc/nomad.d
sudo mkdir -p /var/lib/nomad
sudo chmod a+w /var/lib/nomad
sudo mkdir -p /var/log/nomad
sudo chmod a+w /var/log/nomad


# sudo chmod a+wrx /vagrant/nomad

# sudo cp /vagrant/server.hcl /etc/nomad.d/
#  data_dir  = "/var/lib/nomad"

sudo cat <<EOF >  /etc/nomad.d/nomad.hcl

  bind_addr = "$NODE_IP"
  log_level = "DEBUG"
  enable_syslog = true

  data_dir  = "/var/lib/nomad"

  server {
    enabled          = true
    bootstrap_expect = 3
    retry_join       = $SERVERS
  }

  client {
    enabled       = true
    options = {
      docker.privileged.enabled = true
    }
  }
  consul {
    address = "$NODE_IP:8500"
  }
EOF

sudo cat <<EOF >  /etc/systemd/system/nomad.service
[Unit]
Description=Nomad
Requires=consul.service
After=consul.service

[Service]
Restart=on-failure
ExecStart=/usr/bin/nomad agent -config=/etc/nomad.d/nomad.hcl
ExecStop=/usr/bin/nomad node-drain -enable -self -yes
ExecReload=/bin/kill -HUP $MAINPID

[Install]
WantedBy=multi-user.target
EOF
#ExecStop=/usr/bin/nomad node-drain -enable -self -yes
#ExecStartPost=/usr/bin/nomad node-drain -disable -self -yes

#ExecStartPre=rm -rf /var/lib/nomad/*
# cat /etc/nomad.d/nomad.hcl
# sudo nomad agent -config=/etc/nomad.d/nomad.hcl
sudo systemctl enable nomad.service
sudo systemctl stop nomad
sudo systemctl start nomad
# cat /etc/systemd/system/nomad.service

# sudo docker run -e NOMAD_ENABLE=1 -e NOMAD_ADDR=http://$NODE_IP:4646 -e CONSUL_ENABLE=1 -e CONSUL_ADDR=$NODE_IP:8500 -e CONSUL_ACL_TOKEN=viIWiDibfrFw68JS2gR5zA== -e LOG_LEVEL=DEBUG -p 8000:3000 jippi/hashi-ui

# sleep 30;
# sudo nomad run /vagrant/nginx.nomad
# sudo nomad run /vagrant/hashi-ui.nomad
