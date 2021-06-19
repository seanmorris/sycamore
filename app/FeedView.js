import { Bindable } from 'curvature/base/Bindable';
import { View } from 'curvature/base/View';
import { Model } from 'curvature/model/Model';

import { MessageView } from './MessageView';
import { MessageModel } from './MessageModel';

import { MessageLinkView } from './MessageLinkView';
import { MessageImageView } from './MessageImageView';
import { MessageAudioView } from './MessageAudioView';
import { MessageVideoView } from './MessageVideoView';
import { MessageYoutubeView } from './MessageYoutubeView';

import { UserModel } from './UserModel';
import { UserDatabase } from './UserDatabase';

import { Github } from './Github';

import { EventDatabase } from './matrix/EventDatabase';

import { EventModel as MatrixEvent } from './matrix/EventModel';

// const room_id = '!FIoireJEFPfTCUfUrL:matrix.org';
// const room_id = '!KaJxaqzQsDrINmbMht:matrix.org';

export class FeedView extends View
{
	template = require('feed.html');
	profiles = new Map;
	postSet  = new Set;

	constructor(args)
	{
		super(args);

		this.args.posts = this.args.posts || [];

		this.args.room_id = this.args.room_id || '!KaJxaqzQsDrINmbMht:matrix.org';

		const tokenJson = sessionStorage.getItem('matrix:access-token') || 'false';

		const token = JSON.parse(tokenJson);

		matrix.getRoomState(this.args.room_id).then(response => {
			response
				.filter(event => event.type === 'm.room.power_levels')
				.forEach(event => {

					this.args.showForm = true;

					if(!(token.user_id in event.content.users))
					{
						console.log('222')
						this.args.showForm = false;
						return;
					}
					// if(event.content.events['m.room.message'] > event.content.users_default)
					// {
					// 	console.log('333')
					// 	this.args.showForm = false;
					// 	return;
					// }
				})
		});

		console.log(this.args.room_id);

		EventDatabase.open('events', 1).then(database => {
			matrix.syncRoomHistory(this.args.room_id, '', event => {
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

						database.insert('events', MatrixEvent.from(event));
					}
				});
			});
		});

		this.selector = IDBKeyRange.bound(
			[this.args.room_id, 'm.room.message', 0]
			, [this.args.room_id, 'm.room.message', Infinity]
		);

		this.listen(matrix, 'matrix-event', thrownEvent => {
			const event = MatrixEvent.from(thrownEvent.detail);

			const eventKey = [event.room_id, event.type, event.received];

			if(this.selector.includes(eventKey))
			{
				const user_id = event.sender || event.user_id;

				const messageView = new MessageView({
					issued: event.origin_server_ts / 1000
					, body: event.content.body
					, header: Bindable.make({ author: user_id })
					, avatar: '/avatar.jpg'
				});

				messageView.preserve = true;

				this.args.posts.push(messageView);

				this.onRemove(()=>messageView.remove());

				this.getProfile(user_id).then(profile => {

					if(!profile.avatar_url_local)
					{
						return;
					}

					messageView.args.avatar = profile.avatar_url_local;
				});
			}

			const store = 'events';
			const index = 'event_id';
			const range = event.event_id;
		});

		matrix.listenForRoomEvents(this.args.room_id);
	}

	loadFeeds(feedUrl)
	{
		EventDatabase.open('events', 1).then(database => {
			const range = this.selector;
			const index = 'room_id+type+time';
			const store = 'events';
			const limit = false;

			const direction = 'next';

			database.select({store, index, range, direction, limit}).each(event => {

				const user_id = event.sender || event.user_id;

				const messageView = this.getEventView(event);

				this.args.posts.push(messageView);

				this.getProfile(user_id).then(profile => {

					if(!profile.avatar_url_local)
					{
						return;
					}

					messageView.args.avatar = profile.avatar_url_local;
				});

				messageView.preserve = true;

				this.onRemove(()=>messageView.remove());
			});
		});
	}

	getEventView(event)
	{
		let messageView;

		const user_id = event.sender || event.user_id;

		switch(event.content.msgtype)
		{
			case 'm.audio':
				messageView = new MessageAudioView({
					issued:    event.origin_server_ts / 1000
					, body:    event.content.body
					, header:  Bindable.make({ author: user_id })
					, avatar: '/avatar.jpg'
					, eventId: event.event_id
					, source:  JSON.stringify(event.content, null, 4)
				});

				matrix.getMedia(event.content.url).then(localUrl => {

					messageView.args.url = localUrl;

					console.log(localUrl);

				});

				break;

			case 'm.video':
				messageView = new MessageVideoView({
					issued:    event.origin_server_ts / 1000
					, body:    event.content.body
					, header:  Bindable.make({ author: user_id })
					, avatar: '/avatar.jpg'
					, eventId: event.event_id
					, source:  JSON.stringify(event.content, null, 4)
				});

				matrix.getMedia(event.content.url).then(localUrl => {

					messageView.args.url = localUrl;

					console.log(localUrl);

				});

				break;

			case 'm.image':
				messageView = new MessageImageView({
					issued:    event.origin_server_ts / 1000
					, body:    event.content.body
					, header:  Bindable.make({ author: user_id })
					, avatar: '/avatar.jpg'
					, eventId: event.event_id
					, source:  JSON.stringify(event.content, null, 4)
				});

				matrix.getMedia(event.content.url).then(localUrl => {

					messageView.args.url = localUrl;

					console.log(localUrl);

				});

				break;


			default:
				messageView = new MessageView({
					issued:    event.origin_server_ts / 1000
					, body:    event.content.body
					, header:  Bindable.make({ author: user_id ?? null })
					, avatar: '/avatar.jpg'
					, eventId: event.event_id
					, source:  JSON.stringify(event.content, null, 4)
				});
		}

		messageView.preserve = true;

		return messageView;

	}

	loadFeed(feed)
	{
		fetch('/' + feed).then(response => response.text()).then(feed => {

			const messageLines = feed.split(/\n/);

			for(const messageLine of messageLines)
			{
				if(!messageLine) { continue; }

				const [messageTime, messageUrl] = messageLine.split(/\s/);

				this.loadMessage(messageUrl);
			}
		});
	}

	getProfile(userId)
	{
		let getProfile;

		if(this.profiles.has(userId))
		{
			getProfile = Promise.resolve(this.profiles.get(userId));
		}
		else
		{
			const profile = {};

			getProfile = matrix.getUserAvatar(userId).then(response => {

				Object.assign(profile, response);

				return response;
			});
		}

		return getProfile.then(profile => {

			if(profile.avatar_url_local)
			{
				return Promise.resolve(profile);
			}

			if(profile.avatar_url)
			{
				const getMedia = matrix.getMedia(profile.avatar_url);

				return getMedia.then(blobUrl => {

					profile.avatar_url_local = blobUrl;

					this.profiles.set(userId, profile);

					return profile;
				});
			}

			this.profiles.set(userId, profile);

			return Promise.resolve(profile);
		});
	}

	loadMessage(messageUrl)
	{
		fetch('/messages/' + messageUrl + '.smsg')
		.then(response => response.arrayBuffer())
		.then(buffer   => MessageModel.fromBytes(buffer))
		.then(message  => this.displayPost(message));
	}

	displayPost(message)
	{
		if(!message || !message.url || this.postSet.has(message.url))
		{
			return;
		}

		const mime = message.header.mime.split(/[\/\s]/);
		const type = mime[0] === 'text'
			? message.name.split('.').pop()
			: mime[0];

		switch(type)
		{
			case 'image':
				this.args.posts.push(new MessageImageView(message));
				break;

			case 'video':
				this.args.posts.push(new MessageVideoView(message));
				break;

			case 'audio':
				this.args.posts.push(new MessageAudioView(message));
				break;

			case 'url':
				const url = new URL(message.body);

				switch(url.host)
				{
					case 'youtube.com':
					case 'www.youtube.com':

						message.videoStart = parseInt(url.searchParams.get('t')) || 0;
						message.videoCode  = url.searchParams.get('v');

						this.args.posts.push(new MessageYoutubeView(message));
						break;

					default:
						this.args.posts.push(new MessageLinkView(message));
						break;
				}
				break;

			default:
				this.args.posts.push(new MessageView(message));
				break;
		}



		this.postSet.add(message.url);
	};

	createPost(event)
	{
		event.preventDefault();

		// if(!this.args.inputPost)
		// {
		// 	return;
		// }

		// const filename = `messages/post-${Date.now()}.md`;

		// const github = new Github('seanmorris/sycamore');

		// const putter = github.put({
		// 	data:       this.args.inputPost + "\n"
		// 	, location: filename
		// 	, message:  'Sycamore self-edit.'
		// 	, branch:   'master'
		// 	, sha:      ''
		// });

		// putter.then(() => this.args.inputPost = '');

		// return putter;
	};

	fileDropped(event)
	{
		console.log(event);

		event.preventDefault();
		event.stopPropagation();

		console.log(event.dataTransfer.items);

		for(const item of event.dataTransfer.items)
		{
			const file = item.getAsFile();
			const baseType = file.type.split('/')[0];

			switch(baseType)
			{
				case 'image':
				case 'video':
				case 'audio':
					matrix.postMedia(file, file.name).then(response => {
						matrix.putEvent('!KaJxaqzQsDrINmbMht:matrix.org', 'm.room.message', {
							msgtype: 'm.' + baseType
							, body:  file.name
							, url:   response.content_uri
							, info: { type: file.type }
						});
					});
					break
				default:
					matrix.postMedia(file, file.name).then(response => {
						matrix.putEvent('!KaJxaqzQsDrINmbMht:matrix.org', 'm.room.message', {
							msgtype: 'm.file'
							, body:  file.name
							, url:   response.content_uri
							, info: { type: file.type }
						});
					});
			}

		}
	}

	fileDragged(event)
	{
		console.log(event);

		event.preventDefault();
		event.stopPropagation();

	}
}
