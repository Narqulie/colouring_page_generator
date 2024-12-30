# Deployment Guide

## Building and publishing to GitHub Container Registry
docker buildx build --platform linux/amd64,linux/arm64 -t ghcr.io/narqulie/colouring_page_generator:latest --push . 

## Deployment and Execution
### Pulling the Image
docker pull ghcr.io/narqulie/colouring_page_generator:main
### Running the Container
docker run -p 8000:8000 ghcr.io/narqulie/colouring_page_generator:main
