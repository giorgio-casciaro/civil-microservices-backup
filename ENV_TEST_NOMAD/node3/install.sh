

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


# NOMAD


curl -sSL https://releases.hashicorp.com/consul/0.8.3/consul_0.8.3_linux_amd64.zip -o consul.zip

unzip consul.zip
sudo chmod +x consul
sudo mv consul /usr/bin/consul
sudo mkdir -p /etc/consul.d
sudo mkdir -p /var/consul
sudo chmod a+w /etc/consul.d

sudo cat <<EOF >  /etc/consul.d/consul.json
{
"bind_addr": "192.168.34.103",
"client_addr": "192.168.34.103",
"datacenter": "dc1",
"data_dir": "/var/consul",
"log_level": "INFO",
"node_name": "ConsulServer3",
"server": true,
"ui": true,
"bootstrap_expect": 3,
"encrypt": "viIWiDibfrFw68JS2gR5zA==",
"rejoin_after_leave": true,
"leave_on_terminate": false,
"skip_leave_on_interrupt": true,
"retry_join": [
  "192.168.34.101:8301",
  "192.168.34.102:8301",
  "192.168.34.103:8301"
  ]
 }
EOF

sudo cat <<EOF >  /etc/systemd/system/consul.service
[Unit]
Description=consul agent
Requires=network-online.target
After=network-online.target

[Service]
Restart=on-failure
ExecStart=/usr/bin/consul agent -config-dir=/etc/consul.d/ -ui
ExecReload=/bin/kill -HUP $MAINPID

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl enable consul.service
sudo systemctl stop consul
sudo systemctl start consul


# NOMAD



curl -sSL -o nomad.zip  https://releases.hashicorp.com/nomad/0.5.6/nomad_0.5.6_linux_amd64.zip
unzip nomad.zip
sudo chmod +x nomad
sudo mv nomad /usr/bin/nomad
sudo mkdir -p /etc/nomad.d
sudo chmod a+w /etc/nomad.d
sudo mkdir -p /var/lib/nomad
sudo chmod a+w /var/lib/nomad

# sudo mkdir -p /var/lib/nomad
# sudo mkdir -p /var/log/nomad
# sudo chmod a+w /var/log/nomad
# sudo cp /vagrant/server.hcl /etc/nomad.d/

sudo cat <<EOF >  /etc/nomad.d/nomad.hcl

  bind_addr = "192.168.34.103"
  log_level = "INFO"

  data_dir  = "/var/lib/nomad"
  region  = "europe"
  datacenter  = "dc1"

  # advertise  {
  #   http = "192.168.34.103"
  #   rpc  = "192.168.34.103"
  #   serf = "192.168.34.103"
  # }

  server {
    enabled          = true
    bootstrap_expect = 3
    retry_join       = ["192.168.34.101", "192.168.34.102","192.168.34.103"]
  }

  client {
    enabled       = true
    options = {
      docker.privileged.enabled = true
    }
  }
EOF


sudo cat <<EOF >  /etc/systemd/system/nomad.service
[Unit]
Description=consul agent
Requires=network-online.target
After=network-online.target

[Service]
Restart=on-failure
ExecStart=/usr/bin/nomad agent -config=/etc/nomad.d/nomad.hcl
ExecReload=/bin/kill -HUP $MAINPID

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl enable nomad.service
sudo systemctl stop nomad
sudo systemctl start nomad


sudo cat <<EOF >  /etc/environment
NOMAD_ADDR=http://192.168.34.103:4646
EOF
export NOMAD_ADDR=http://192.168.34.103:4646
