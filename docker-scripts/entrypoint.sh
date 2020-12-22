#!/usr/bin/env bash
# Wait until database is ready
/app/docker-scripts/wait-for-it.sh ${MYSQL_HOST:-localhost}:${MYSQL_PORT:-3306} -s -t 0 -- /app/docker-scripts/start-server.sh
