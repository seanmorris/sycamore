import { Router } from 'curvature/base/Router';

import { RootView } from './RootView';
import { FeedView } from './FeedView';

import { UserView } from './UserView';
import { UserModel } from './UserModel';
import { UserDatabase } from './UserDatabase';

import { MessageModel } from './MessageModel';

import { WarehouseConsole } from './WarehouseConsole';

import { Matrix } from './Matrix';
import { EventModel as MatrixEvent } from './matrix/EventModel';
import { EventDatabase } from './matrix/EventDatabase';

import { SettingsView } from './ui/SettingsView';

Object.defineProperty(window, 'matrix', {value: new Matrix});

const view = new RootView;

UserDatabase.syncUsers();

const routes = {
	'': args => {
		const feed = new FeedView({...args, showForm: true});
		
		feed.loadFeeds();

		return feed;
	}

	, 'settings': SettingsView

	, 'feed/%room_id': args => {

		const feed = new FeedView(args);

		feed.loadFeeds();

		return feed;
	}

	// , 'messages/%mid': args => {

	// 	const feedView = new FeedView(args);

	// 	MessageModel.fromUrl('/messages/' + args.mid + '.smsg').then(message => {
	// 		feedView.displayPost(message);
	// 	});

	// 	return feedView;

	// }
	, 'user/%uid': args => new UserView(args)
	, 'warehouse': args => new WarehouseConsole(args)
};

Router.listen(view, routes);

if(Router.query.loginToken)
{
	matrix.completeSso(Router.query.loginToken);
}

view.listen(
	document
	, 'DOMContentLoaded'
	, event => view.render(document.body)
	, {once: true}
);

const tokenJson = sessionStorage.getItem('matrix:access-token') || 'false';

const token = JSON.parse(tokenJson);

let getToken = null;

let isGuest = false;

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

const getDatabase = EventDatabase.open('events', 1);

Promise.all([getDatabase, getToken]).then(([database, access_token]) => {

	matrix.addEventListener('matrix-event', throwEvent => {
		const event = MatrixEvent.from(throwEvent.detail);
		const store = 'events';
		const index = 'event_id';
		const range = event.event_id;

		database.select({store, index, range}).then(res => {
			res.index || database.insert('events', event);
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

			if(state && state.timeline && state.timeline.events)
			{
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
			}

			if(state && state.timeline && state.timeline.prev_batch)
			{
				matrix.syncRoomHistory(
					room
					, state.timeline.prev_batch
					, chunk => {
						const event = MatrixEvent.from(chunk);

						const store = 'events';
						const index = 'event_id';
						const range = event.event_id;

						database.select({store, index, range}).then(res => {
							res.index || database.insert('events', event);
						});
					}
				);
			}
		});
	});
});

