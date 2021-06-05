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

COMMIT=`git log -2 --format='%H' | tail -n1`;

mkdir -p $FEED_DIR;

git diff ${COMMIT} --name-only content/ | while read NAME; do {

	echo `date +%s` ${NAME#content/} >> $FEED_DIR/${NOW}.sfd;

}; done;