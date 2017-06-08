job "hashi-ui" {
  # The "region" parameter specifies the region in which to execute the job. If
  # omitted, this inherits the default region name of "global".
  # region = "global"

  # The "datacenters" parameter specifies the list of datacenters which should
  # be considered when placing this task. This must be provided.
  datacenters = ["dc1"]

  type = "service"

  # constraint {
  #   attribute = "${attr.kernel.name}"
  #   value     = "linux"
  # }

  constraint {
    operator  = "distinct_hosts"
    value     = "true"
  }

  update {
    # The "stagger" parameter specifies to do rolling updates of this job every
    # 10 seconds.
    stagger = "10s"

    # The "max_parallel" parameter specifies the maximum number of updates to
    # perform in parallel. In this case, this specifies to update a single task
    # at a time.
    max_parallel = 1
  }

  group "hashi-ui" {
    count = 3

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

    task "hash-ui" {
      driver = "docker"

      config {
        image = "jippi/hashi-ui:latest"
        network_mode = "host"
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

      # artifact {
      #   source = "http://foo.com/artifact.tar.gz"
      #   options {
      #     checksum = "md5:c4aa853ad2215426eb7d70a21922e794"
      #   }
      # }

      resources {
        cpu    = 500 # 500 MHz
        memory = 256 # 256MB
        network {
          mbits = 10
          port "http" {
            static = 3000
          }
        }
      }

      service {
        name = "hash-ui-service"
        tags = ["global", "hash-ui"]
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
