cd docs/
find feeds -type f | grep -v /\\. > feeds.list
find peers/*/feeds -type f | grep -v /\\. >> peers.list