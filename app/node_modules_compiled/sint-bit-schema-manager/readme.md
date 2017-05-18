# schemaManager
servizio che permette lo sharing di informazioni fra microservice
basandosi su un semplice nfs condiviso

- get(): funzione per recuperare la configurazione
- updateSchema(): richiama ad intervalli regolari l'aggiornamento del servizio locale, se le nuove informazioni hanno un checksum differente dalla cache viene avviata la scrittura del file json del servizio


#### test
il servizio dovrebbe testare la comunicazione all'avvio,
i dati in entrata ed uscita devono sempre essere dichiarati prima dell'avvio


#### TODO
- [x] tests
