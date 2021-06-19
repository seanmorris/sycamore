#!/usr/bin/env make

.PHONY: all clean sign-messages
# .PHONY: docs/contact-card.json sign-messages

MESSAGE_SOURCES=$(shell find ./messages/ -type f)
MESSAGE_TARGETS=${MESSAGE_SOURCES:./messages/%=./docs/messages/%.smsg}

sign-messages: ${MESSAGE_TARGETS}

docs/messages/%.smsg: messages/%
	bin/sign.sh $@ > $@;

docs/contact-card.json: .env
	bin/generate-contact-card.sh > docs/contact-card.json

docs/contact-card.json.smsg: docs/contact-card.json
	bin/sign.sh docs/contact-card.json > docs/contact-card.json.smsg

all: sign-messages docs/contact-card.json.smsg

clean:
	rm ./docs/messages/*.smsg docs/contact-card.json docs/contact-card.json.smsg
