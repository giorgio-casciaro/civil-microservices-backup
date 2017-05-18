# jesus
Javascript Microservice Comunication Manager:
jesus is a cross-service multichannel (http,tcp,upd) comunication (rpc, events) layer

FEATURES:
- rpc and event managment
- various response types: noResponse, aknowlegment, response, stream
- various channels:udp,http,socket
- CHANNEL = serialization -> compression -> tranport , ES. compressedHttp = JSON -> gzip -> http/rest
- event's channel selected by event/rpc config (ex. log event on udp, domain event on http/rest)
- All requests and responses (for rpc and events) are described with jsonschema

REQUIRE:
- schema manager, a way to share info between microservice (etcd,consul,memcache,redis,ecc)

TODO:
- the compatibility between microservices is tested at start
- eliminate babel await/async dependecy
- channels based on zeromq
- TLS connnection encryption based on certificates (protection of the exchanged on single comunication)
- specific message encryption (only messages with the right certificate can decrypt)
- comunication between microservice and jesus based on unixsocket: not npm module require, language agnostic comunication, deployable on kubernetes as Daemonset (one jesus server per node, comunication based on unixsocket)

#### EXAMPLE
- Microservice 1
  - JesusClient EVENT : find services listening for event and loop rpc
    - JesusClient RPC : validate message and data (based on receiver method jsonschema), find right transport and send
      - ChannelClient : encode/compress message and send request
        - ChannelServer : receive request and decode/decompress message
          - JesusServer : receive message and call dervice method
            - Microservice 2 function


#### OBJS
- Msg (rpc call) = { Method, Data, Meta}
- Method = method to call
- Data = method data defined in jsonschema
- Meta = { corrid, userid, from, reqInTimestamp, reqOutTimestamp, channel}
- Channel = serialization (simple json,webpack) + compression (gzip)  + channel
- Schema = share data schema between services

<!--<img src="https://cdn.rawgit.com/giorgio-casciaro/jesus/master/svg/test.svg"> -->
