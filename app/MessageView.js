import { View } from 'curvature/base/View';
import { Tag } from 'curvature/base/Tag';
import { Sycamore } from './Sycamore';
import { EventDatabase } from './matrix/EventDatabase';
import { EventModel as MatrixEvent } from './matrix/EventModel';

export class MessageView extends View
{
	template = require('./message.html');

	constructor(...args)
	{
		super(...args);

		this.args.comments = [];
		this.args.likes = 0;
		this.likers = new Set;
		this.args.showComments = false;

		const messageId = this.args.event.event_id;

		this.selector = IDBKeyRange.bound(
			[messageId, 0]
			, [messageId, Infinity]
		);

		Promise.all([EventDatabase.open('events', 1), matrix.getToken()]).then(([database, token])=>{

			const store = 'events';
			// const index = 'replyTo+time';
			const range = this.selector;
			const type  = MatrixEvent;

			database.select({store, index:'replyTo+time', range, type}).each(record => {

				if(!record.sender)
				{
					return;
				}

				if(!record.content.sycamore)
				{
					return;
				}

				if(!record.content.sycamore.replyTo)
				{
					return;
				}

				const eventKey = [record.content.sycamore.replyTo, record.received];

				if(!this.selector.includes(eventKey))
				{
					return;
				}

				matrix.getUserProfile(record.sender).then(profile => {

					const getMedia = matrix.getMedia(profile.avatar_url);

					return getMedia;

				}).then(blobUrl => {

					const comment = {
						body: record.content.body
						, image: blobUrl
						, sender: record.sender
					};

					this.args.comments.push(comment);
				});
			});

			database.select({store, index:'reactTo+time', range, type}).each(record => {

				if(!record.sender)
				{
					return;
				}

				if(this.likers.has(record.sender))
				{
					return;
				}

				if(!record.content.sycamore)
				{
					return;
				}

				if(record.content.sycamore.reactTo === messageId)
				{
					this.likers.add(record.sender);
					this.args.likes++;
				}
			});

			database.addEventListener('write', dbEvent => {

				if(!dbEvent.detail.record.sender)
				{
					return;
				}

				matrix.getUserProfile(dbEvent.detail.record.sender).then(profile => {
					if(dbEvent.detail.subType !== 'insert')
					{
						return;
					}

					const event = dbEvent.detail.record;

					if(!event.content.sycamore)
					{
						return;
					}

					if(event.content.sycamore.reactTo === messageId)
					{
						this.args.likes++;
					}

					if(!event.content.sycamore.replyTo)
					{
						return;
					}

					const comment = {
						body: event.content.body
						, image: profile.avatar_url_local
						, sender: dbEvent.detail.record.sender
					};

					const eventKey = [event.content.sycamore.replyTo, event.received];

					if(!this.selector.includes(eventKey))
					{
						return;
					}

					this.args.comments.push(comment);
				});
			});
		});
	}

	formatTime(time)
	{
		return new Date( time * 1000 )
	}

	verifiedClass(flag)
	{
		if(flag === true)
		{
			return 'verified';
		}
		else if(flag === false)
		{
			return 'verify-failed';
		}
		else if(flag === null)
		{
			return 'verify-pending';
		}
	}

	createComment(event)
	{
		event.preventDefault();

		if(!this.args.commentInput)
		{
			return;
		}

		Sycamore.getSettings().then(settings => {

			const matrixEvent = this.args.event;
			const message = {
				msgtype: 'm.text'
				, body:  this.args.commentInput
				, sycamore: {
					profile:   'https://sycamore.seanmorr.is/'
					, private: settings.privateFeed
					, public:  settings.publicFeed
					, replyTo: this.args.eventId
				}
			};

			const roomId = matrixEvent.content.sycamore.public;

			return matrix.putEvent(roomId, 'm.room.message', message)

		}).then(() => {

			this.args.commentInput = '';

		});
	}

	createLike(event)
	{
		event.preventDefault();

		Sycamore.getSettings().then(settings => {

			const matrixEvent = this.args.event;
			const message = {
				msgtype: 'm.text'
				, body:  '👍'
				, sycamore: {
					profile:   'https://sycamore.seanmorr.is/'
					, private: settings.privateFeed
					, public:  settings.publicFeed
					, reactTo: this.args.event.event_id
				}
			};

			const roomId = matrixEvent.content.sycamore.public;

			return matrix.putEvent(roomId, 'm.room.message', message)

		}).then(() => {

			this.args.commentInput = '';

		});
	}

	toggleComments()
	{
		this.args.showComments = !this.args.showComments;
	}
}
