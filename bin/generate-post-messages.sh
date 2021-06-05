#!/usr/bin/env bash
set -euxo pipefail;

test -f .env && {
	>&2 echo "Loading .env file.";
	set -o allexport;
	source .env;
	set +o allexport
} || {
	>&2 echo "Notice: .env file not found.";
}

HOUR=$(echo '60*60' | bc);
NOW=$(echo `date '+%s'`/${HOUR}*${HOUR} | bc);

FEED_DIR=docs/feeds/`date +%Y-%m`/`date +%d`;

mkdir -p $FEED_DIR;

[[ -z $SSH_KEY ]] && ${PRIVATE_KEY} > sycamore_key || ${SSH_KEY} > sycamore_key;

git diff HEAD~1 --name-only content/ | while read NAME; do {
	STATIC_HOSTNAME=${STATIC_HOSTNAME} \
	PRIVATE_KEY=/tmp/key \
		bash bin/generate-post-message.sh ${NAME};
}; done;

rm sycamore_key;