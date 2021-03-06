#!/usr/bin/env bash
set -euxo pipefail;

test -f .env && {
	set -o allexport;
	source .env;
	set +o allexport
} || {
	>&2 echo "Notice: .env file not found.";
}

HOUR=$(echo '60*60' | bc);
NOW=$(echo `date '+%s'`/${HOUR}*${HOUR} | bc);

FEED_DIR=docs/feeds/`date +%Y/%m/%d`;

mkdir -p $FEED_DIR;

git diff HEAD~1 --name-only messages/ | while read NAME; do {

	echo `date +%s` ${NAME#messages/} >> $FEED_DIR/${NOW}.sfd;

}; done;
