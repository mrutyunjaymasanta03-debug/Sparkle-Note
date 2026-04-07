#!/usr/bin/env bash
# Start MongoDB and keep it running in background
MONGOD_DATA_DIR="${HOME}/.mongodb/data"
MONGOD_LOG="${HOME}/.mongodb/mongod.log"
MONGOD_PID="${HOME}/.mongodb/mongod.pid"

mkdir -p "$MONGOD_DATA_DIR"

# Kill any existing mongod
if [ -f "$MONGOD_PID" ]; then
  OLD_PID=$(cat "$MONGOD_PID")
  kill "$OLD_PID" 2>/dev/null || true
  rm -f "$MONGOD_PID"
fi

# Start mongod in background
mongod \
  --dbpath "$MONGOD_DATA_DIR" \
  --logpath "$MONGOD_LOG" \
  --logappend \
  --port 27017 \
  --bind_ip 127.0.0.1 \
  --fork \
  --pidfilepath "$MONGOD_PID"

echo "MongoDB started (PID: $(cat $MONGOD_PID))"
