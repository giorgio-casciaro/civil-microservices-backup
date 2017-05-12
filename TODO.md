# civil-microservices

## TODO
- revoke token: aerospike with autoremove after token expires
- token expires gestiti da users (altri mcroservice chiamano user per verificare token valido)
- security in lib
- front end admin area
- front end client
- admin autodeploy
- jesus publichttp cors
- schema clean function after some time
- service worker
- www su localhost con redirect su tutti i service
- vue server su 8080, abilitare cors da localhost:8080
- eliminare getEmailconfimartionCode, sostituire con stub smtp
- rendere publica cartella email con listing su nginx
- le chiamate all'api dovrebbero essere registrate e messe in una queue (se la connessione non è disponibile vengono reinviate)
- smtp -> testmode -> se true non invia smtp e permette getEmailCode
- rivedere users getPermissions
- jesus
  - http public deve prendere get vars
  - filtrare richieste non presenti in schema
  - passare variabile get methods/schema a canali in ascolto

## DOCKERS
- command al post di entrypoint
-
## KUBERNETES

## ADMIN AREA
- admin get all services schema
- proxy service api call
- test area
  - lista service/method
  - test method call
- input server
- select service/method

## AUTODEPLOY
- from docker compose to kubernetes test
- from kubernetes test to production

## API CLIENT
front end client:
- astrae la gestione delle connessioni con il server e la sincronizzazione dei dati
- gestisce coda di chiamate asyncrone al server
- gestisce streaming in download (events)
- aggiorna il db sul browser
- aggiorna lo store che vue usa per la visualizzazione

feClient.get("service","call",args,cacheTimeout)
feClient.getLive("id","service","call",args)
feClient.stopLive("id")

front end modular store
  - modificato da feClient -> feClientMutations
  - modificato da app -> appMutations
  - all mutations sended to server on error

front end app
  -usa lo store in lettura, scrive direttamente sullo store tramite mutations e invia comandi a feClient


### LISTS QUERIES uses cases
- DASHBOARDS
  - all public dashboards
  - most popular dashboards
  - my dashboards

- POSTS
  - all public posts from all my dashboards
  - all posts sended to me from all my dashboards
  - all posts sended to my tags/groups from all my dashboards
  - all posts from dashboard x
    - all public posts from dashboard x
    - all posts sended to me from dashboard x
    - all posts sended to my user's tags from dashboard x

- USERS
  - all users from dashboard x
  - all users from dashboard x tag y
  - all users tags/groups from dashboard x
