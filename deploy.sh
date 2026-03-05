#!/bin/bash

cd backend
./build_image.sh smarter-web-backend 0.9.0
cd ../frontend
./build_image.sh smarter-web-frontend 0.9.0
cd ..
docker stack deploy -c ./docker-compose.yaml smarter-website
