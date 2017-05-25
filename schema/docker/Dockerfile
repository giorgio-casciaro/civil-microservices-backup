FROM giorgiocasciaro/alpine-node-lua-aerospike:v1
# RUN apk add --update --repository http://nl.alpinelinux.org/alpine/edge/main libwebp-dev fftw-dev  && \
#   apk add --update \
#   --repository http://dl-3.alpinelinux.org/alpine/edge/testing \
#   libwebp-dev fftw-dev vips-dev \
#   && rm -rf /var/cache/apk/*
COPY . /service
RUN rm -r /service/node_modules
RUN mkdir /sharedSchema/
RUN ls /service
RUN mv /service/node_modules_compiled /service/node_modules
WORKDIR  /service
ENTRYPOINT ["sh","-c","'npm start'"]
# ENTRYPOINT ["bash"]
