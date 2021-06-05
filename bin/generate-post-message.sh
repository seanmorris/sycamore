#!/usr/bin/env bash
set -euo pipefail;

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
BASE_INPUT=${1#content/};
OUTPUT=docs/messages/${BASE_INPUT}.smsg;
NOW=`date +%s`
PUBLIC_KEY_URL=${STATIC_HOSTNAME}/sycamore.pub

test -f $INPUT || exit 1;

>&2 echo "Generating the header.";

cat << EOF > ${OUTPUT}.HEAD
{
	"authority": "${STATIC_HOSTNAME}"
	, "name":    "${BASE_INPUT}"
	, "author":  "${AUTHOR}"
	, "key"   :  "${PUBLIC_KEY_URL}"
	, "issued":  ${NOW}
	, "request": "post" 
	, "respond": null
}
EOF

>&2 echo "Generating the signature.";

cat ${INPUT} \
	| ssh-keygen -Y sign -n sycamore -f ${PRIVATE_KEY} \
	> ${OUTPUT}.SIGN;

>&2 echo "Starting output...";

printf '#!/usr/bin/env sycamore\n' > ${OUTPUT};

>&2 echo "Measure and add the header...";

printf "%8x\n" $(wc -c  < ${OUTPUT}.HEAD) >> ${OUTPUT};
cat ${OUTPUT}.HEAD >> ${OUTPUT};

>&2 echo "Measure and add the signature...";

printf "%8x\n" $(wc -c  < ${OUTPUT}.SIGN) >> ${OUTPUT};
cat ${OUTPUT}.SIGN >> ${OUTPUT};

>&2 echo "Measure and add the original message...";

printf "%8x\n" $(wc -c  < ${INPUT}) >> ${OUTPUT};
cat ${INPUT} >> ${OUTPUT};

>&2 echo "Cleaning up...";# 
rm ${OUTPUT}.HEAD ${OUTPUT}.SIGN;

>&2 echo "Done.";# 