#!/bin/bash

# Google Colab Rendering Script for VisionCraft
# This script sets up the environment and starts the rendering worker.

echo "🚀 Setting up VisionCraft Rendering Environment..."

# 1. Install System Dependencies
apt-get update
apt-get install -y ffmpeg chromium-browser

# 2. Install Node.js (if not present)
if ! command -v node &> /dev/null
then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
fi

# 3. Clone Repository (User should ideally do this or we can guide them)
# if [ ! -d "visioncraft" ]; then
#   git clone <YOUR_REPO_URL>
#   cd visioncraft
# fi

# 4. Install NPM Dependencies
npm install

# 5. Start the Automated Watcher
echo "👀 Starting the Render Watcher..."
echo "New videos will be processed automatically!"
npm run remotion:watch
