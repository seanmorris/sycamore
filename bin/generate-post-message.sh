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
BASE_INPUT=${1#messages/};
OUTPUT=docs/messages/${BASE_INPUT}.smsg;
PUBLIC_KEY_URL=${STATIC_HOSTNAME}/sycamore.pub;
TYPE=$(file -b --mime-type);
NOW=$(date +%s);

test -f $INPUT || exit 1;

mkdir -p $(dirname $OUTPUT);

>&2 echo "Generating the header.";

cat << EOF > ${OUTPUT}.HEAD
{
	"authority": "${STATIC_HOSTNAME}"
	, "name":    "${BASE_INPUT}"
	, "author":  "${AUTHOR}"
	, "issued":  ${NOW}
	, "request": "post" 
	, "respond": null
	, "type":    "${TYPE}"
	, "key"   :  "${PUBLIC_KEY_URL}"
}
EOF

>&2 echo "Starting output...";

printf '🍁\n' > ${OUTPUT};


>&2 echo "Measure and add the header...";

printf "%8x\n" $(wc -c  < ${OUTPUT}.HEAD) >> ${OUTPUT};
cat ${OUTPUT}.HEAD >> ${OUTPUT};

>&2 echo "Measure and add the original message...";

printf "%8x\n" $(wc -c  < ${INPUT}) >> ${OUTPUT};
cat ${INPUT} >> ${OUTPUT};
printf "\n" >> ${OUTPUT};

>&2 echo "Generating the signature.";
cat ${OUTPUT} \
	| ssh-keygen -Y sign -f ${PRIVATE_KEY} -n sycamore \
	> ${OUTPUT}.SIGN;

>&2 echo "Measure and add the signature...";
printf "%8x\n" $(wc -c  < ${OUTPUT}.SIGN) >> ${OUTPUT};
cat ${OUTPUT}.SIGN >> ${OUTPUT};

>&2 echo "Cleaning up...";# 
rm ${OUTPUT}.HEAD ${OUTPUT}.SIGN;

>&2 echo "Done.";# 