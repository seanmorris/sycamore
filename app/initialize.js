import { Bindable } from 'curvature/base/Bindable';
import { Router } from 'curvature/base/Router';

import { RootView } from './RootView';
import { FeedView } from './FeedView';

import { UserView } from './UserView';
import { UserModel } from './UserModel';

import { MessageModel } from './MessageModel';

import { WarehouseConsole } from './WarehouseConsole';

import { Matrix } from './Matrix';
import { EventModel as MatrixEvent } from './matrix/EventModel';
import { EventDatabase } from './matrix/EventDatabase';

import { SettingsView } from './ui/SettingsView';

import { Sycamore } from './Sycamore';

Object.defineProperty(window, 'matrix',  {value: new Matrix});
Object.defineProperty(window, 'webTorrent', {value: new WebTorrent});
Object.defineProperty(window, 'webTorrentSeed', {value: new WebTorrent});

const routes = {
	'': args => {
		const feed = new FeedView({...args, showForm: true});
		feed.loadFeeds();
		return feed;
	}

	, 'settings': SettingsView

	, 'my-feed': () => {

		Sycamore.getSettings().then(settings => {
			Router.go(`/feed/${settings.privateFeed}`);
		});

	}

	, 'feed/%room_id': args => {
		const feed = new FeedView(args);
		feed.loadFeeds();
		return feed;
	}

	, 'user/%uid': args => new UserView(args)
	, 'warehouse': args => new WarehouseConsole(args)
};

const token = JSON.parse(sessionStorage.getItem('matrix:access-token') || 'false');

let getToken = null;

let isGuest = false;

matrix.addEventListener('login', () => isGuest = false);

if(token)
{
	getToken = Promise.resolve(token);
	isGuest  = token.isGuest;
}
else
{
	getToken = matrix.getGuestToken();
	isGuest  = true;
}

const view = new RootView;

Router.listen(view, routes);

if(Router.query.loginToken)
{
	matrix.completeSso(Router.query.loginToken);
}
else
{
	view.listen(
		document
		, 'DOMContentLoaded'
		, event => view.render(document.body)
		, {once: true}
	);
}

const getDatabase = EventDatabase.open('events', 1);

Promise.all([getDatabase, getToken]).then(([database, access_token]) => {

	Sycamore.checkFeeds(token.user_id);

	matrix.addEventListener('matrix-event', throwEvent => {
		const event = MatrixEvent.from(throwEvent.detail);
		const store = 'events';
		const index = 'event_id';
		const range = event.event_id;
		const type  = MatrixEvent;

		database.select({store, index, range, type}).one().then(res => {
			if(res.index)
			{
				res.record.consume(event);

				database.update('events', res.record);
			}
			else
			{
				database.insert('events', event);
			}
		});
	});

	if(isGuest)
	{
		return;
	}

	matrix.listenForServerEvents();

	matrix.sync().then(res => {

		if(!res || !res.rooms || !res.rooms.join)
		{
			return;
		}

		Object.entries(res.rooms.join).forEach(([room,state]) => {

			if(!state || !state.timeline)
			{
				return;
			}

			if(state.timeline.events)
			{
				return;
			}

			state.timeline.events.forEach(chunk => {
				chunk.room_id = room;

				const event = MatrixEvent.from(chunk);

				const store = 'events';
				const index = 'event_id';
				const range = event.event_id;
				const type  = MatrixEvent;

				database.select({store, index, range, type}).one().then(res => {
					if(res.index)
					{
						res.record.consume(chunk);

						database.update('events', res.record);
					}
					else
					{
						database.insert('events', event);
					}
				});
			});

			if(!state.timeline.prev_batch)
			{
				return;
			}

			matrix.syncRoomHistory(
				room
				, state.timeline.prev_batch
				, chunk => {
					// const event = MatrixEvent.from(chunk);

					// const store = 'events';
					// const index = 'event_id';
					// const range = event.event_id;

					// database.select({store, index, range}).then(res => {
					// 	if(res.index)
					// 	{
					// 		res.record.consume(chunk);

					// 		database.update('events', res.record);
					// 	}
					// 	else
					// 	{
					// 		database.insert('events', event);
					// 	}
					// });
				}
			);
		});
	});
});

