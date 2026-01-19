#!/bin/bash

# MMO Trainer Server Startup Script
# Place this in .output/server/ after building

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

export NODE_ENV=${NODE_ENV:-production}
export PORT=${PORT:-3000}
export HOST=${HOST:-0.0.0.0}

if [ ! -f "index.js" ]; then
    echo "Error: index.js not found. Make sure you're in the .output/server directory."
    exit 1
fi

echo "Starting MMO Trainer server..."
echo "Port: $PORT"
echo "Host: $HOST"
echo "Environment: $NODE_ENV"

exec node index.js
