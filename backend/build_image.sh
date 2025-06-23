#!/bin/bash

#Second parameter is optional and it's version, by default its v0.0.1
VERSION="${2:-v0.0.1}"
REGISTRY_PATH=127.0.0.0:5000/
IMAGE_NAME=$1:$VERSION
docker image build --tag $IMAGE_NAME -f ./Dockerfile .
docker tag $IMAGE_NAME $REGISTRY_PATH$IMAGE_NAME
docker push $REGISTRY_PATH$IMAGE_NAME