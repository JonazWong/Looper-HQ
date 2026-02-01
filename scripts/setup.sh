#!/bin/bash
echo "Setting up Looper HQ..."
pnpm install
cp .env.example .env
echo "Setup complete! Run: pnpm docker:up"
