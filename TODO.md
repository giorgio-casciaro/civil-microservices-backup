# civil-microservices

## TODO

- rivedere users getPermissions
- data di nascita timestamp anche negativo
- schema clean function after some time
- user eliminare status -> tenere singoli status (emailConfirmed,password setted ecc.)
- revoke token: aerospike with autoremove after token expires
- token expires gestiti da users o ms ad hoc? (altri mcroservice chiamano user per verificare token valido)

- user gestiscono in autonomia l'upload della pic

- servizio uplodad :
  - carica il file nella sottodir più libera
  - gestisce il protocollo tusd per l'upload
  - effettua l'hash del file per evitare duplicati
  - ridimensiona e comprime immagini

- app->i18n->getTranslations("it")

- app->i18n->createRawString("group","rawstring")
- app->i18n->createCldrLink("rawstring","CldrLink")
- app->i18n->createTranslatedString("it","rawstring","translated string")

- admin autodeploy

- admin diventa app

## FRONTEND

- front end client: le chiamate all'api dovrebbero essere registrate e messe in una queue (se la connessione non è disponibile vengono reinviate)
- service worker
- vue tutte le modifiche devono passare mediante store -

  ## JESUS

- jesus rivedere tests

  - eliminare tap->microtest e co->async
  - semplificare net test
  - usare microtest

- ripulire errori di validazione
- prevedere object per error con message per solo stringa

## DOCKERS

- command al post di entrypoint

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

feClient.get("service","call",args,cacheTimeout) feClient.getLive("id","service","call",args) feClient.stopLive("id")

front end modular store

- modificato da feClient -> feClientMutations
- modificato da app -> appMutations
- all mutations sended to server on error

front end app -usa lo store in lettura, scrive direttamente sullo store tramite mutations e invia comandi a feClient

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
