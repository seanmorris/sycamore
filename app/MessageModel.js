import { Model } from 'curvature/model/Model';

import { MessageDatabase } from './MessageDatabase';

export class MessageModel extends Model {
	
	verified = null;

	signature;
	segments;
	header;
	body;
	url;
	id;

	static get keyProps() { return ['url', 'class'] }
	
	get authority() { return this.header && this.header.authority }
	get issued() { return this.header && this.header.issued }
	get name() { return this.header && this.header.name }

	verify()
	{
		return fetch(this.header.key).then(r => r.text()).then(keyText => {

			return keyText.replace(/-----[\w\s]+-----/g, '').trim();

		}).then(keyText => {

			const decoded = window.atob(keyText);

			return this.constructor.stringTobuffer(decoded);

		}).then(keyBuffer => {

			return crypto.subtle.importKey(
				'spki'
				, keyBuffer
				, {name: "RSASSA-PKCS1-v1_5", hash: "SHA-1"}
				, true
				, ["verify"]
			);

		}).then(publicKey => {

			const verified = crypto.subtle.verify(
				'RSASSA-PKCS1-v1_5',
				publicKey,
				this.segments.signature,
				this.segments.message,
			);

			return verified;

		}).then(verified => {

			return this.verified = verified;

		});
	}

	static fromSkeleton(skeleton)
	{}

	static fromUrl(url)
	{
		return fetch(url)
		.then(response => response.arrayBuffer())
		.then(buffer   => this.fromBytes(buffer))
	}

	static fromString(str)
	{
		return (new Blob([str], {type: 'text/plain; charset=utf-8'}))
		.arrayBuffer().then(buffer => this.fromBytes(buffer));
	}

	static fromBytes(buffer)
	{
		const init = [
			MessageDatabase.open('messages', 1)
			, this.parseBytes(buffer)
		];

		return Promise.all(init).then(([database, message]) => {

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
					database.insert('messages', message);
				}
				else if(message.issued > record.issued)
				{
					record.consume(message);

					database.update('messages', record);
				}

				setTimeout(()=>message.verify(), 1500 * Math.random());

				return message;
			});
		});
	}

	static parseBytes(buffer)
	{
		const preamble = new Uint32Array(buffer.slice(0, 4))[0];

		// if(preamble !== 2173542384)
		// {
		// 	return Promise.reject('Invalid preamble: ' + preamble);
		// }

		const headLen   = new Uint32Array(buffer.slice(5, 9))[0];
		const headSlice = buffer.slice(10, 10 + headLen);
		const headBlob  = new Blob([headSlice], {type: 'text/plain; charset=utf-8'});

		const headEnd = 10 + headLen;

		return headBlob.text().then(headerText => {

			const header = JSON.parse(headerText);

			Object.freeze(header);

			const bodyLen   = new Uint32Array(buffer.slice(headEnd, headEnd + 4))[0];
			const bodySlice = buffer.slice(headEnd + 5, headEnd + bodyLen + 5);
			const bodyBlob  = new Blob([bodySlice], {type: header.type || 'text/plain; charset=utf-8'});

			const bodyEnd = headEnd + bodyLen + 5;

			const signatureLen   = new Uint32Array(buffer.slice(bodyEnd, bodyEnd + 4))[0];
			const signatureSlice = buffer.slice(bodyEnd + 5, bodyEnd + signatureLen + 5);
			const signatureBlob  = new Blob([signatureSlice], {type: 'text/plain; charset=utf-8'});

			const signatureData  = signatureSlice.slice(30,-29);

			// const blob = new Blob([signatureSlice], {type: 'text/plain; charset=utf-8'});
			// blob.text().then(t => console.log(t));

			const signatureBlob2 = new Blob([signatureData], {type: 'text/plain; charset=utf-8'});

			return signatureBlob2.text().then(signature => {

				const decoded = window.atob(signature);

				const segments = {
					header: headSlice
					, body: bodySlice
					, message:   buffer.slice(0, bodyEnd)
					, signature: this.stringTobuffer(decoded)
				};

				const body = header.type.substr(0,4) === 'text'
					? bodyBlob.text()
					: bodyBlob.arrayBuffer();

				const results = [
					header
					, body
					, signatureBlob.text()
					, segments
				];

				return Promise.all(results);

			});

		}).then(([header, body, signature, segments])=>{

			const url = header.authority + '/' + header.name;

			const skeleton = {header, body, buffer, signature, url, segments};

			const model = new this;

			model.consume(skeleton);

			return model;
		});
	}

	static stringTobuffer(str)
	{
		const buf = new ArrayBuffer(str.length);
		const bufView = new Uint8Array(buf);
		for (let i = 0, strLen = str.length; i < strLen; i++) {
		bufView[i] = str.charCodeAt(i);
		}
		return buf;
	}
}
