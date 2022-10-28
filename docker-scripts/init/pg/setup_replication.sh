#!/bin/bash
export PGDATA=/var/lib/postgresql/data

set -e
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    CREATE USER test REPLICATION LOGIN CONNECTION LIMIT 100 PASSWORD 'test';
EOSQL

set -e
cat >>${PGDATA}/postgresql.conf <<EOF
wal_level = logical
max_wal_senders = 5
max_replication_slots = 5
EOF
