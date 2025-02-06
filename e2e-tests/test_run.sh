#!/bin/sh
set -ex
cd /app
nohup npm run start
sleep 5
cd /app/e2e-tests
npm run test
