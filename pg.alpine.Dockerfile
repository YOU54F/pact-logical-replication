# builder step is required for wal2json support in alpine
FROM postgres:15-alpine AS builder_wal2json

RUN apk add --no-cache build-base git clang-dev llvm10-dev
RUN git clone https://github.com/eulerto/wal2json.git /tmp/wal2json
WORKDIR /tmp/wal2json
RUN USE_PGXS=1 make && make install

FROM postgres:15-alpine

# copy the wal2json plugin
COPY --from=builder_wal2json /tmp/wal2json/wal2json.so /usr/local/lib/postgresql/

COPY ./docker-scripts/init/pg/ /docker-entrypoint-initdb.d/

RUN chmod 0666 ./docker-entrypoint-initdb.d/setup_replication.sh
