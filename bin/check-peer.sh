LATEST=0

PEER_HOST=https://sycamore.seanmorr.is;
PEER_FEED=2021/06/05/1622926800.sfd;
PEER_PATH=docs/peers/@seanmorris;
FEED_FILE=${PEER_PATH}/feeds/${PEER_FEED};

mkdir -p $(dirname ${FEED_FILE});

curl -s ${PEER_HOST}/feeds/${PEER_FEED} > ${FEED_FILE};

cat ${FEED_FILE} | while read LINE; do {

	MSG_TIME=${LINE%% *};
	MSG_NAME=${LINE##* };

	[[ $LATEST -lt $MSG_TIME  ]] && {
		
		MSG_FILE=${PEER_PATH}/messages/${MSG_NAME}.smsg;
		MSG_PATH=$(dirname ${MSG_FILE});

		mkdir -p ${MSG_PATH};

		echo https://sycamore.seanmorr.is/messages/${MSG_NAME}.smsg;
		
		# curl -s https://sycamore.seanmorr.is/messages/${MSG_NAME}.smsg > ${MSG_FILE};
	
	}

}; done;