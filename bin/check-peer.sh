set -euo pipefail;

LATEST=0

PEER_HOST=https://sycamore.seanmorr.is;
PEER_FEED=2021/06/05/1622926800.sfd;
PEER_LIST=config/syndicate.txt

cat ${PEER_LIST} | while read PEER_URL; do {
	
	PEER_HOST=${PEER_URL#https:\/\/}
	PEER_PATH=docs/peers/@"${PEER_HOST}";
	FEED_LIST=${PEER_PATH}/index.html;
	FEED_FILE=${PEER_PATH}/feeds/${PEER_FEED};
	FEED_PATH=$(dirname "${FEED_FILE}");

	mkdir -p ${FEED_PATH};

	curl ${PEER_URL} > ${FEED_LIST};

	mkdir -p $(dirname ${FEED_FILE});
	
	cat ${FEED_LIST} | while read LINE; do {

		FEED_URL=${LINE};
		FEED_BASE=$(basename $FEED_URL);
		FEED_TIME=${FEED_BASE%%.*};

		curl ${PEER_URL}/${FEED_URL} > ${FEED_FILE};
		echo $FEED_URL " " $FEED_TIME;

		cat ${FEED_FILE} | while read LINE; do {

			MSG_TIME=${LINE%% *};
			MSG_NAME=${LINE##* };

			[[ $LATEST -lt $MSG_TIME  ]] && {
				
				MSG_FILE=${PEER_PATH}/messages/${MSG_NAME}.smsg;
				MSG_PATH=$(dirname ${MSG_FILE});

				mkdir -p ${MSG_PATH};

				curl -s https://sycamore.seanmorr.is/messages/${MSG_NAME}.smsg > ${MSG_FILE};
			
			}

		}; done;

	}; done;

}; done;

exit;


