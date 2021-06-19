#!/usr/bin/env bash
set -euo pipefail;

test -f .env && {
	set -o allexport;
	source .env;
	set +o allexport
} \
|| {
	>&2 echo "Notice: .env file not found.";
}

[[ ${DEBUG:-0} -eq 1 ]] && {
	set -x;
}

pack_files() {
	printf '🍁\n';

	for INPUT in $@; do {
		(wc -c  < ${INPUT} | perl -lpe '$_=pack "L",$_');
		echo ${INPUT}
	}; done;

	for INPUT in $@; do {
		cat ${INPUT};
	}; done;
}

pack_files $@;

