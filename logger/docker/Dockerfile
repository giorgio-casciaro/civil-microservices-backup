FROM node:6-alpine

RUN apk add --update --no-cache  bash
# RUN apk add --update --no-cache nodejs
# RUN apk add --update --no-cache zeromq-dev


# USER root

# RUN npm i -g @sematext/logagent


RUN rm -rf /tmp/*.tar.gz /var/cache/apk/*

# COPY ./scripts /scripts
RUN apk add --update --no-cache make g++
RUN apk add --update --no-cache python

COPY ./service /service
WORKDIR  /service
RUN npm install
# WORKDIR  /service
ENTRYPOINT ["bash"]
