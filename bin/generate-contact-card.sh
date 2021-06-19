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

USER_ID=$(shasum -a256 .ssh/private-key.pem  | cut -d " " -f 1);

cat << EOF
{
	"name":     "${AUTHOR}"
	, "issued": "$(date +%s)"
	, "about":  "Tantus labor non sit casus."
	, "uid":    "${USER_ID}"
	, "url":    "${STATIC_ORIGIN}"
	, "img":    "${STATIC_ORIGIN}/avatar.jpg"
	, "key":    "${STATIC_ORIGIN}/public-key.pem"
	, "hub":    "${HUB_ORIGIN}"
}
EOF
