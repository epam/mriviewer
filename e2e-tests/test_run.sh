#!/bin/sh
set -ex
#cd /app
#nohup npm run start
#npm run start
#sleep 5
#cd /app/e2e-tests
npm i
npm run test
