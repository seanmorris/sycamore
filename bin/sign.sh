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

INPUT=$1;

[[ -f ${INPUT} ]] || exit;


PUBLIC_KEY_URL=${STATIC_ORIGIN}/sycamore.pkcs8;
BASE_INPUT=${1#messages/};
USER_ID=$(shasum -a256 docs/sycamore.pub  | cut -d " " -f 1);
TYPE=$(file -ib --mime-type ${INPUT});
NOW=$(date +%s);

ASSERTS=post

[[ $# -gt 1 ]] && {
	ASSERTS=$2;
}

test -f $INPUT || exit 1;

# mkdir -p $(dirname $OUTPUT);

>&2 echo "Generating the header.";

TEMP_DIR=$(mktemp -d -p ./tmp)
OUTPUT=$(mktemp -p ${TEMP_DIR});
HEADER_FILE=$(mktemp -p ${TEMP_DIR});
SIGNATURE_FILE=$(mktemp -p ${TEMP_DIR});

cat << EOF > ${HEADER_FILE}
{
	"authority": "${STATIC_ORIGIN}"
	, "author":  "${AUTHOR}"
	, "asserts": "${ASSERTS}"
	, "respond": null
	, "name":    "${BASE_INPUT}"
	, "key":     "${PUBLIC_KEY_URL}"
	, "uid":     "${USER_ID}"
	, "mime":    "${TYPE}"
	, "issued":  ${NOW}
	, "topics:": []
}
EOF

printf '🍁\n' > ${OUTPUT};

>&2 echo "Measure and append the header...";

(wc -c  < ${HEADER_FILE} | perl -lpe '$_=pack "L",$_') >> ${OUTPUT};

cat ${HEADER_FILE} >> ${OUTPUT};

>&2 echo "Measure and append the original message...";

(wc -c  < ${INPUT} | perl -lpe '$_=pack "L",$_') >> ${OUTPUT};

cat ${INPUT} >> ${OUTPUT};

>&2 echo "Generate the signature.";

echo '-----BEGIN RSA SIGNATURE-----' > ${SIGNATURE_FILE};

openssl dgst -sha1 -sign ${PRIVATE_KEY} ${OUTPUT} \
	| openssl base64 \
	>> ${SIGNATURE_FILE};

echo '-----END RSA SIGNATURE-----' >> ${SIGNATURE_FILE};

>&2 echo "Measure and append the signature...";

(wc -c  < ${SIGNATURE_FILE} | perl -lpe '$_=pack "L",$_') >> ${OUTPUT};

cat ${SIGNATURE_FILE} >> ${OUTPUT};

cat ${OUTPUT} | base64 -w0 | curl 'https://backend.warehouse.seanmorr.is/publish/sycamore.seanmorr.is::posts' \
  -H 'origin: https://warehouse.seanmorr.is' \
  -H 'content-type: undefined' \
  -X POST --data-binary @-

>&2 echo "Cleaning up...";# 

cat ${OUTPUT};

rm ${HEADER_FILE} ${SIGNATURE_FILE} ${OUTPUT};

rmdir ${TEMP_DIR};

>&2 echo "Done.";# 
