# Deployment Guide

## Building the Docker Image
docker build -t ghcr.io/narqulie/colouring_page_generator:latest .
## Publishing to GitHub Container Registry 
docker push ghcr.io/narqulie/colouring_page_generator:latest

## Deployment and Execution
### Pulling the Image
docker pull ghcr.io/narqulie/colouring_page_generator:latest
### Running the Container
docker run -p 8000:8000 ghcr.io/narqulie/colouring_page_generator:latest
