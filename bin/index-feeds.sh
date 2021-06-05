cd docs/
find feeds -type f | grep -v /\\. > index.html
find peers/*/feeds -type f | grep -v /\\. >> peers.html