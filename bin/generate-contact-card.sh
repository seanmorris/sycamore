#!/usr/bin/env bash
set -euxo pipefail;

test -f .env && {
	>&2 echo "Loading .env file.";
	set -o allexport;
	source .env;
	set +o allexport
} \
|| {
	>&2 echo "Notice: .env file not found.";
}

USER_ID=$(shasum -a256 .ssh/sycamore.pub  | cut -d " " -f 1);
OUTPUT=docs/contact-card.json

cat << EOF > ${OUTPUT}
{
	"name":  "${AUTHOR}"
	, "uid": "${USER_ID}"
	, "url": "${STATIC_HOSTNAME}"
	, "img": "${STATIC_HOSTNAME}/avatar.jpg"
	, "hub": "https://hub.sycamore.seanmorr.is/"
	, "key": "$(cat .ssh/sycamore.pub)"
	, "issued": "$(date +%s)"
	, "about":  "Tantus labor non sit casus."
}
EOF