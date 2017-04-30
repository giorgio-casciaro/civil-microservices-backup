# base service
microservice di base:
  - avvia jesus server (api su vari channels: upd,http,ecc) e
  - gestisce la comunicazione del dominio basandosi su schema condiviso (rpc con validation),
  - passa/astrae per methods,js:
    - log
    - authentication
    - autorization

#### test
il servizio dovrebbe testare la comunicazione all'avvio,
i dati in entrata ed uscita devono sempre essere dichiarati prima dell'avvio


#### TODO IN TEST
- [x] da transports a channels -> un channel contiene serialization (simple json,webpack) + compression (gzip)  + transport (udp, zeromq, http)
- [x] getSharedConfig(service,submodule,...) diventa
  - getNetConfig(service|*)
  - getEventsIn(service|*)
  - getEventsOut(service|*)
  - getMethodsConfig(service|*)


- [ ] testConnections -> testa la compatibilità fra i vari  jsonschema (service 1 out schema-> service2 in schema, service 1 in schema -> service2 out schema)
- [ ] zeromq channel
- [ ] udp channel


- [ ] add cache a require('./domain/methods')
- [ ] add cache a require('./domain/methods')
