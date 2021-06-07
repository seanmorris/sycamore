import { Model } from 'curvature/model/Model';

import { MessageDatabase } from './MessageDatabase';

export class MessageModel extends Model {
	
	signature;
	header;
	body;
	url;
	id;

	static get keyProps() { return ['url', 'class'] }
	
	get authority() { return this.header && this.header.authority }
	get issued() { return this.header && this.header.issued }
	get name() { return this.header && this.header.name }

	static fromString(messageBytes, dbCheck = true)
	{
		const slug = messageBytes.substring(0, 3);
		
		const headerHex = messageBytes.substr(3, 10);
		const headerLen = parseInt(headerHex, 16);
		const header    = messageBytes.substr(14, headerLen);
		
		const bodyStart = headerLen + 25;

		const bodyHex = messageBytes.substr(headerLen + 14, 10);
		const bodyLen = parseInt(bodyHex, 16);
		const body    = messageBytes.substr(bodyStart, bodyLen);

		const signatureStart = bodyStart + bodyLen + 1;
		
		const signatureHex = messageBytes.substr(signatureStart, 10);
		const signatureLen = parseInt(signatureHex, 16);
		const signature    = messageBytes.substr(bodyStart + bodyLen + 12);

		const headerObject = JSON.parse(header);

		const url = headerObject.authority + '/' + headerObject.name;

		const skeleton = {
			class: 'message'
			, header: headerObject
			, body
			, signature
			, url: headerObject.authority + '/' + headerObject.name
		};

		const message = new MessageModel;

		message.consume(skeleton);

		if(!dbCheck)
		{
			return Promise.resolve(message);
		}

		return MessageDatabase.open('messages', 1).then(database => {

			const query  = {
				store: 'messages',
				index: 'url',
				range: message.url,
				type:  MessageModel
			};
			
			return database.select(query).one().then(result => {
			
				const record = result.record;

				if(!record)
				{
					const message = MessageModel.fromString(messageBytes, false)
					.then(message => {
						database.insert('messages', message);
					});
					
				}
				else if(message.issued > record.issued)
				{
					record.consume(message);

					database.update('messages', record);
				}

				return record;
			});
		});
	}
};
