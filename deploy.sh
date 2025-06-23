#!/bin/bash

cd backend
./build_image.sh watering-web-backend
cd ../frontend
./build_image.sh watering-web-frontend
cd ..
docker stack deploy -c ./docker-compose.yaml watering-website