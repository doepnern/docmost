#!/bin/bash
set -e
docker build --network=host -t ghcr.io/doepnern/docmost:latest .
docker push ghcr.io/doepnern/docmost:latest