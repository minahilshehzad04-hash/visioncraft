#!/bin/bash

# Google Colab Rendering Script for VisionCraft
# This script sets up the environment and starts the rendering worker.

echo "🚀 Setting up VisionCraft Rendering Environment..."

# 1. Install System Dependencies
apt-get update
apt-get install -y ffmpeg chromium-browser \
    libnss3 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libasound2 \
    libpangocairo-1.0-0 \
    libxshmfence1 \
    libxkbcommon0

# 2. Install Node.js (if not present)
if ! command -v node &> /dev/null
then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
fi

# 3. Handle Repository Directory
if [[ "$PWD" == *"/visioncraft" ]]; then
    echo "Already inside visioncraft directory."
elif [ -d "visioncraft" ]; then
    echo "VisionCraft directory found. Navigating into it..."
    cd visioncraft
else
    echo "VisionCraft directory not found. Please ensure you are in the correct directory or clone it."
    # git clone <YOUR_REPO_URL>
    # cd visioncraft
fi

# 4. Install NPM Dependencies
npm install

# 5. Start the Automated Watcher
echo "👀 Starting the Render Watcher..."
echo "New videos will be processed automatically!"
npm run remotion:watch
