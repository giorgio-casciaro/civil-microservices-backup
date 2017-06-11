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


      config {
        image = "nginx:latest"
        command = "nginx"
        args = [ "-g", "daemon off;", "-c", "/nginx.conf"]
        network_mode = "host"
        interactive = true
        volumes = ["nginx.conf:/nginx.conf" ]
        dns_servers = ["127.0.0.1:8600"]
      }

      // artifact {
      //   source = "http://192.168.1.201:8500/v1/kv/nginx?raw"
      //   destination = "/config/nginx.conf"
      // }

      template {
        change_mode = "signal"
        change_signal ="SIGHUP"
        data = <<EOH
        events { worker_connections 1024; }
        http {
          {{range services}} {{$name := .Name}} {{$service := service .Name}}
          upstream {{$name}} {
            zone upstream-{{$name}} 64k;
            {{range $service}}server {{.Address}}:{{.Port}} max_fails=3 fail_timeout=60 weight=1;
            {{else}}server 127.0.0.1:65535; # force a 502{{end}}
          } {{end}}

          server {
            listen 80;

            location / {
              root /usr/share/nginx/html/;
              index index.html;
            }

            location /stub_status {
              stub_status;
            }

          {{range services}} {{$name := .Name}}
            location /{{$name}} {
              proxy_pass http://{{$name}};
            }
          {{end}}

          }

          server {
            listen 81 ;
            location /ws/ {
              proxy_http_version 1.1;
              proxy_set_header Upgrade $http_upgrade;
              proxy_set_header Connection "upgrade";
              proxy_pass http://hashi-ui-service/ws/;
            }
            location / {
              proxy_pass http://hashi-ui-service;
            }
          }

        }

        EOH

        destination = "nginx.conf"
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
