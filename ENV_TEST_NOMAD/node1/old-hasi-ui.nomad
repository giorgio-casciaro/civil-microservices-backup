job "hashi-ui" {
  region      = "global"
  datacenters = ["dc1"]
  type        = "service"

  group "server" {
    count = 3

    restart {
      # The number of attempts to run the job within the specified interval.
      attempts = 10
      interval = "5m"

      # The "delay" parameter specifies the duration to wait before restarting
      # a task after it has failed.
      delay = "25s"

     # The "mode" parameter controls what happens when a task has restarted
     # "attempts" times within the interval. "delay" mode delays the next
     # restart until the next interval. "fail" mode does not restart the task
     # if "attempts" has been hit within the interval.
      mode = "delay"
    }

    task "hashi-ui" {
      driver = "docker"

      config {
        image        = "jippi/hashi-ui"
      }

      service {
        name = "hashi-ui"
        tags = ["global", "daemon"]
        port = "http"

        check {
          type     = "http"
          path     = "/"
          interval = "10s"
          timeout  = "2s"
        }
      }

      env {
        NOMAD_ENABLE = 1
        NOMAD_ADDR   = "http://192.168.1.201:8686"
        LOG_LEVEL = "DEBUG"
        CONSUL_ENABLE = 1
        CONSUL_ADDR   = "http://192.168.1.201:8500"
        CONSUL_ACL_TOKEN = "viIWiDibfrFw68JS2gR5zA=="

      }

      resources {

        network {
          mbits = 5

          port "http" {
            static = 3000
          }
        }
      }
    }
  }
}
