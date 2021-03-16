#!/usr/bin/env bash

# Create config files from templates
cp /app/config/database.yml.external /app/config/database.yml
cp /app/config/configuration.yml.external /app/config/configuration.yml

# Wait until database is ready
/app/docker-scripts/wait-for-it.sh ${MYSQL_HOST:-localhost}:${MYSQL_PORT:-3306} -s -t 0 -- /app/docker-scripts/start-server.sh
