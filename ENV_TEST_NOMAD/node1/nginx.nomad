job "nginx" {
  datacenters = ["dc1"]

  type = "system"


  update {
    stagger = "10s"
    max_parallel = 1
  }

  group "nginx" {
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

    task "nginx" {
      driver = "docker"

      #artifact {
      #  source = "http://192.168.1.201:8500/v1/kv/nginx?raw"
      #  destination = "/config/nginx.conf"
      #}

      config {
        image = "nginx:latest"
        command = "nginx"
        args = [ "-g", "daemon off;", "-c", "/config/nginx.conf"]
        network_mode = "host"
        interactive = true
      }

      template {
        data = <<EOH
        events {
            worker_connections  1024;
        }

        http {
          client_max_body_size 500M;
          include       /etc/nginx/mime.types;
          default_type  application/octet-stream;
          server {
              listen 80 ;

              location / {
                  root /usr/share/nginx/html;
              }

          }
        }

        EOH

        destination = "/config/nginx.conf"
      }

      env {

      }

      resources {
        cpu    = 500 # 500 MHz
        memory = 256 # 256MB
        network {
          mbits = 10
          port "http" {
            static = 80
          }
        }
      }

      service {
        name = "nginx-service"
        tags = ["global", "nginx"]
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
