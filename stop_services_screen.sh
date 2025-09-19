#!/bin/bash

# Script để dừng screen sessions
echo "🛑 Stopping screen sessions..."

# Stop screen sessions
screen -S backend -X quit 2>/dev/null
screen -S frontend -X quit 2>/dev/null

echo "✅ All screen sessions stopped!"
