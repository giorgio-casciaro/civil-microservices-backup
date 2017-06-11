job "hashi-ui" {
  datacenters = ["dc1"]
  type = "service"

  update {
    stagger = "10s"
    max_parallel = 1
  }

  group "hashi-ui" {
    count = 1

    restart {
      attempts = 10
      interval = "5m"
      delay = "25s"
      mode = "delay"
    }

    ephemeral_disk {
      # sticky = true
      # migrate = true
      # MB
      size = 300
    }

    task "hashi-ui" {
      driver = "docker"

      config {
        image = "jippi/hashi-ui:latest"
        #network_mode = "host"
        port_map {
         http = 3000
       }
        interactive = true
      }

      env {
        NOMAD_ENABLE = 1
        NOMAD_ADDR   = "http://192.168.1.201:4646"
        CONSUL_ACL_TOKEN = "viIWiDibfrFw68JS2gR5zA=="
        LOG_LEVEL = "DEBUG"
        CONSUL_ENABLE = 1
        CONSUL_ADDR   = "192.168.1.201:8500"

      }

      resources {
        cpu    = 500 # 500 MHz
        memory = 256 # 256MB
        network {
          mbits = 10
          port "http" {
            # static = 3000
          }
        }
      }

      service {
        name = "hashi-ui-service"
        tags = ["global", "hashi-ui"]
        port = "http"
        check {
          name     = "alive"
          type     = "tcp"
          interval = "10s"
          timeout  = "2s"
        }
      }

    }
  }
}
