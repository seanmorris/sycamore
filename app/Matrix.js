import { Mixin } from 'curvature/base/Mixin';

import { EventTargetMixin } from 'curvature/mixin/EventTargetMixin';

import { EventModel as MatrixEvent } from './matrix/EventModel';
import { EventDatabase } from './matrix/EventDatabase';

export class Matrix extends Mixin.with(EventTargetMixin)
{
	constructor()
	{
		super();

		this.baseUrl   = 'https://matrix.org/_matrix';
		this.clientUrl = `${this.baseUrl}/client/r0`;
		this.mediaUrl  = `${this.baseUrl}/media/r0`;
	}

	initSso(redirectUri)
	{
		const path = 'login/sso/redirect?redirectUrl=' + redirectUri;

		const ssoPopup = window.open(`${this.clientUrl}/${path}`);

		const ssoListener = event => {
			if(event.origin !== location.origin)
			{
				return;
			}

			const request = JSON.parse(event.data);

			console.log(request);

			if(request.type !== 's.sso.complete')
			{
				return;
			}

			sessionStorage.setItem('matrix:access-token', JSON.stringify(request.data));

			this.listenForServerEvents();
		};

		window.addEventListener('message', ssoListener);
	}

	completeSso(loginToken)
	{
		const path = 'login';
		const body = {
			type:"m.login.token"
			, token: loginToken
			, txn_id: (1/Math.random()).toString(36)
		};

		fetch(`${this.clientUrl}/${path}`, {method: 'POST', body: JSON.stringify(body)})
		.then(response => response.json())
		.then(response => {

			window.opener.postMessage(JSON.stringify({
				type: 's.sso.complete'
				, data: response
			}), location.origin);

			window.close();
		});
	}

	getGuestToken()
	{
		const tokenJson = sessionStorage.getItem('matrix:access-token') || 'false';

		const token = JSON.parse(tokenJson);

		if(token && token.isGuest)
		{
			return Promise.resolve(token);
		}

		const getToken = fetch(`${this.clientUrl}/register?kind=guest`, {method:'POST', body: '{}'}).then(response=>response.json());

		getToken.then(token => {
			token.isGuest = true;
			sessionStorage.setItem('matrix:access-token', JSON.stringify(token))
		});

		return getToken;
	}

	listenForServerEvents()
	{
		const tokenJson = sessionStorage.getItem('matrix:access-token') || 'false';

		const token = JSON.parse(tokenJson);

		if(!token)
		{
			return;
		}

		const listener = `${this.clientUrl}/events?access_token=${token.access_token}`;

		fetch(listener)
		.then(response => response.json())
		.then(response => this.streamServerEvents(response));
	}

	listenForRoomEvents(room_id, from = '')
	{
		const tokenJson = sessionStorage.getItem('matrix:access-token') || 'false';

		const token = JSON.parse(tokenJson);

		if(!token)
		{
			return;
		}

		const listener = `${this.clientUrl}/events?room_id=${room_id}&access_token=${token.access_token}&from=${from}`;

		console.log(listener);

		fetch(listener)
		.then(response => response.json())
		.then(response => this.streamServerEvents(response, room_id));
	}

	getUserAvatar(userId)
	{
		return fetch(`${this.clientUrl}/profile/${userId}`).then(response=>response.json());
	}

	getUserData(userId, type)
	{
		const tokenJson = sessionStorage.getItem('matrix:access-token') || 'false';

		const token = JSON.parse(tokenJson);

		if(!token)
		{
			return;
		}

		return fetch(`${this.clientUrl}/user/${userId}/account_data/${type}?access_token=${token.access_token}`).then(response => response.json());
	}

	putUserData(userId, type, body)
	{
		const tokenJson = sessionStorage.getItem('matrix:access-token') || 'false';

		const token = JSON.parse(tokenJson);

		if(!token)
		{
			return;
		}

		const endpoint = `${this.clientUrl}/user/${userId}/account_data/${type}?access_token=${token.access_token}`;

		return fetch(endpoint, {method: 'PUT', body}).then(response => {
			if(!response.ok)
			{
				const error = new Error("HTTP status code: " + response.status)

				error.status = response.status
				error.response = response

				throw error
			}
			return response

		}).then(response => response.json());
	}

	getMedia(mxcUrl)
	{
		const url = new URL(mxcUrl);

		return fetch(`${this.mediaUrl}/download/${url.pathname.substr(2)}`)
		.then(response => Promise.all([response.arrayBuffer(), response.headers.get('Content-type')]))
		.then(([buffer, type]) => URL.createObjectURL(new Blob([buffer], {type})));
	}

	postMedia(body, filename)
	{
		const tokenJson = sessionStorage.getItem('matrix:access-token') || 'false';

		const token = JSON.parse(tokenJson);

		if(!token)
		{
			return;
		}

		const url = `${this.mediaUrl}/upload?access_token=${token.access_token}`;

		const headers = new Headers({
			'Content-Type': body.type
		});

		const method = 'POST';

		const options = {method, headers, body};

		return fetch(url, options).then(response => response.json());
	}

	putEvent(roomId, type, body)
	{
		const tokenJson = sessionStorage.getItem('matrix:access-token') || 'false';

		const token = JSON.parse(tokenJson);

		if(!token)
		{
			return;
		}

		const url = `${this.clientUrl}/rooms/${roomId}/send/${type}/${Math.random().toString(36)}?access_token=${token.access_token}`;

		const headers = new Headers({
			'Content-Type': body.type
		});

		const method = 'PUT';

		const options = {method, headers, body: JSON.stringify(body)};

		return fetch(url, options).then(response => response.json());
	}

	sync()
	{
		const tokenJson = sessionStorage.getItem('matrix:access-token') || 'false';

		const token = JSON.parse(tokenJson);

		if(!token)
		{
			return Promise.resolve();
		}

		const syncer = `${this.clientUrl}/sync?full_state=true&access_token=${token.access_token}`;

		return fetch(syncer).then(response => response.json());
	}

	getRoomState(room_id)
	{
		const tokenJson = sessionStorage.getItem('matrix:access-token') || 'false';

		const token = JSON.parse(tokenJson);

		if(!token)
		{
			return Promise.resolve();
		}

		const syncer = `${this.clientUrl}/rooms/${room_id}/state?access_token=${token.access_token}`;

		return fetch(syncer).then(response => response.json());
	}

	syncRoom(room_id, from = '')
	{
		const tokenJson = sessionStorage.getItem('matrix:access-token') || 'false';

		const token = JSON.parse(tokenJson);

		if(!token)
		{
			return Promise.resolve();
		}

		const syncer = `${this.clientUrl}/rooms/${room_id}/messages?dir=b&room_id=${room_id}&access_token=${token.access_token}&from=${from}`;

		return fetch(syncer).then(response => response.json());
	}

	syncRoomHistory(room, from, callback = null)
	{
		this.syncRoom(room, from).then(chunk => {
			chunk.chunk && callback && chunk.chunk.forEach(callback);
			return chunk.chunk.length && this.syncRoomHistory(room, chunk.end, callback);
		});
	}

	streamServerEvents(chunkList, room_id)
	{
		console.log(chunkList.end);

		if(room_id)
		{
			this.listenForRoomEvents(room_id, chunkList.end);
		}
		else
		{
			this.listenForServerEvents();
		}

		console.log(chunkList);

		chunkList.chunk && chunkList.chunk.forEach(event => {

			const detail = new MatrixEvent;

			if(!event.event_id)
			{
				event.event_id = 'local:' + (1/Math.random()).toString(36)
			}

			detail.consume(event);

			this.dispatchEvent(new CustomEvent('matrix-event', {detail}));
			this.dispatchEvent(new CustomEvent(detail.type, {detail}));
		});
	}

	getCurrentUserId()
	{
		const tokenJson = sessionStorage.getItem('matrix:access-token') || 'false';

		const token = JSON.parse(tokenJson);

		if(!token)
		{
			return;
		}

		return token.user_id;
	}
}
