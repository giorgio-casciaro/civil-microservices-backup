apt-get install -y haproxy



cat <<EOF >  /etc/haproxy/haproxy.cfg
global
        user haproxy
        group haproxy
        daemon
        maxconn 4096
defaults
        mode    tcp
        balance leastconn
        timeout client      30000ms
        timeout server      30000ms
        timeout connect      3000ms
        retries 3


frontend nginx
        bind *:80
        default_backend nginx

backend nginx
        server srv1 127.0.0.1:30080

frontend nginxssl
        bind *:443
        default_backend nginxssl

backend nginxssl
        server srv1 127.0.0.1:30443

frontend dashboard
        bind *:1001
        default_backend dashboard

backend dashboard
        server srv1 127.0.0.1:31079


frontend test1
        bind *:81
        default_backend test1

backend test1
        server srv1 127.0.0.1:30081

frontend test2
        bind *:82
        default_backend test2

backend test2
        server srv1 127.0.0.1:30082
EOF


haproxy -f /etc/haproxy/haproxy.cfg -D  -st
