find messages/ -type f -not -path '*/\.*' | xargs -I{} bash bin/generate-post-message.sh {}
