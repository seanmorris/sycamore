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

INPUT=$1;

[[ -f ${INPUT} ]] || exit;

BASE_INPUT=${1#messages/};
OUTPUT=docs/messages/${BASE_INPUT}.smsg;
PUBLIC_KEY_URL=${STATIC_HOSTNAME}/sycamore.pkcs8;
USER_ID=$(shasum -a256 docs/sycamore.pub  | cut -d " " -f 1);
TYPE=$(file -ib --mime-type ${INPUT});
NOW=$(date +%s);

REQUEST=post

test -f $INPUT || exit 1;

mkdir -p $(dirname $OUTPUT);

>&2 echo "Generating the header.";

cat << EOF > ${OUTPUT}.HEAD
{
	"authority": "${STATIC_HOSTNAME}"
	, "key":     "${PUBLIC_KEY_URL}"
	, "name":    "${BASE_INPUT}"
	, "author":  "${AUTHOR}"
	, "uid":     "${USER_ID}"
	, "request": "${REQUEST}"
	, "type":    "${TYPE}"
	, "issued":  ${NOW}
	, "respond": null
	, "topic:":  []
}
EOF

>&2 echo "Starting output...";

printf '🍁\n' > ${OUTPUT};

>&2 echo "Measure and add the header...";

(wc -c  < ${OUTPUT}.HEAD | perl -lpe '$_=pack "L",$_') >> ${OUTPUT};

cat ${OUTPUT}.HEAD >> ${OUTPUT};

>&2 echo "Measure and add the original message...";

(wc -c  < ${INPUT} | perl -lpe '$_=pack "L",$_') >> ${OUTPUT};

cat ${INPUT} >> ${OUTPUT};

>&2 echo "Generate the signature.";

echo '-----BEGIN RSA SIGNATURE-----' > ${OUTPUT}.SIGN;

openssl dgst -sha1 -sign ${PRIVATE_KEY} ${OUTPUT} \
	| openssl base64 \
	>> ${OUTPUT}.SIGN;

echo '-----END RSA SIGNATURE-----' >> ${OUTPUT}.SIGN;

>&2 echo "Measure and add the signature...";

(wc -c  < ${OUTPUT}.SIGN | perl -lpe '$_=pack "L",$_') >> ${OUTPUT};

cat ${OUTPUT}.SIGN >> ${OUTPUT};

jq -Rs '.' ${OUTPUT} | curl 'https://backend.warehouse.seanmorr.is/publish/sycamore.seanmorr.is::posts' \
  -H 'origin: https://warehouse.seanmorr.is' \
  -H 'content-type: undefined' \
  -X POST --data-binary @-

>&2 echo "Cleaning up...";# 

rm ${OUTPUT}.HEAD ${OUTPUT}.SIGN;

>&2 echo "Done.";# 
