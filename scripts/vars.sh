#!/bin/bash
Entrypoint="./src/index.ts"
OutPath="./dist"
OutName="myrodlbot"

AllowedPaths="./" # Needed for path resolutions
AllowedExecutables="./bin/yt-dlp,./bin/yt-dlp.exe,yt-dlp,ffmpeg"
AllowedDomains="api.telegram.org,api.github.com,github.com,objects.githubusercontent.com"
AllowedEnv="DEBUG,BOT_TOKEN,BOT_TOKEN_DEV"

Targets=("x86_64-unknown-linux-gnu" "x86_64-pc-windows-msvc" "x86_64-apple-darwin" "aarch64-apple-darwin") # all supported targets

DenoArgs="--allow-run=$AllowedExecutables --allow-net=$AllowedDomains --allow-read=$AllowedPaths --allow-write=$AllowedPaths --allow-env=$AllowedEnv"