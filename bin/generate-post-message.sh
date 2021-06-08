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

[[ -f ${INPUT} ]] || exit;

INPUT=$1;
BASE_INPUT=${1#messages/};
OUTPUT=docs/messages/${BASE_INPUT}.smsg;
PUBLIC_KEY_URL=${STATIC_HOSTNAME}/sycamore.pub;
USER_ID=$(shasum -a256 docs/sycamore.pub  | cut -d " " -f 1);
TYPE=$(file -ib --mime-type ${INPUT});
NOW=$(date +%s);

REQUEST=post

# [[ -z $2 ]] && {
# } || {
# 	REQUEST=$2
# }

test -f $INPUT || exit 1;

mkdir -p $(dirname $OUTPUT);

>&2 echo "Generating the header.";

cat << EOF > ${OUTPUT}.HEAD
{
	"authority": "${STATIC_HOSTNAME}"
	, "name":    "${BASE_INPUT}"
	, "author":  "${AUTHOR}"
	, "uid":     "${USER_ID}"
	, "issued":  ${NOW}
	, "request": "${REQUEST}" 
	, "respond": null
	, "topic:":  []
	, "type":    "${TYPE}"
	, "key"   :  "${PUBLIC_KEY_URL}"
}
EOF

>&2 echo "Starting output...";

printf '🍁\n' > ${OUTPUT};

>&2 echo "Measure and add the header...";

wc -c  < ${OUTPUT}.HEAD

printf '0x%08x\n' $(wc -c  < ${OUTPUT}.HEAD) >> ${OUTPUT};

cat ${OUTPUT}.HEAD >> ${OUTPUT};

>&2 echo "Measure and add the original message...";

printf '0x%08x\n' $(wc -c  < ${INPUT}) >> ${OUTPUT};

cat ${INPUT} >> ${OUTPUT};

>&2 echo "Generating the signature.";

cat ${OUTPUT} \
	| ssh-keygen -Y sign -f ${PRIVATE_KEY} -n sycamore \
	> ${OUTPUT}.SIGN;

printf "\n" >> ${OUTPUT};

>&2 echo "Measure and add the signature...";

printf '0x%08x\n' $(wc -c  < ${OUTPUT}.SIGN) >> ${OUTPUT};

cat ${OUTPUT}.SIGN >> ${OUTPUT};

jq -Rs '.' ${OUTPUT} | curl 'https://backend.warehouse.seanmorr.is/publish/sycamore.seanmorr.is::posts' \
  -H 'origin: https://warehouse.seanmorr.is' \
  -H 'content-type: undefined' \
  -X POST --data-binary @-

>&2 echo "Cleaning up...";# 

rm ${OUTPUT}.HEAD ${OUTPUT}.SIGN;

>&2 echo "Done.";# 
