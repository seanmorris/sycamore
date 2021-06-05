#!/usr/bin/env bash
set -euo pipefail;

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

FEED_DIR=feeds/`date +%Y-%m`/`date +%d`;

COMMIT=git log -1 --format='%H'

mkdir -p $FEED_DIR;

git diff ${COMMIT}..${COMMIT}~1 --name-only content/ | while read NAME; do {

	echo ${NAME#content/} >> $FEED_DIR/${NOW}.sfd;

}; done;