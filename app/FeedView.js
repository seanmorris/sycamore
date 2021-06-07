import { View } from 'curvature/base/View';
import { Model } from 'curvature/model/Model';

import { MessageModel } from './MessageModel';

import { UserModel } from './UserModel';
import { UserDatabase } from './UserDatabase';

export class FeedView extends View
{
	template = require('feed.html');
	postSet  = new Set;

	constructor(args)
	{
		super(args);

		this.args.posts = [];
	}

	loadFeeds(feedUrl = '/feeds.list')
	{
		fetch(feedUrl).then(response => response.text()).then(feedList => {

			const feeds = feedList.split(/\n/);

			for(const feed of feeds)
			{
				if(!feed) { continue; }

				this.loadFeed(feed);
			}
		});
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

	loadMessage(messageUrl)
	{
		fetch('/messages/' + messageUrl + '.smsg')
		.then(response => response.text())
		.then(messageBody => this.displayPost(messageBody));
	}

	displayPost(messageBytes)
	{
		const message = MessageModel.fromString(messageBytes).then(message => {
			
			if(!message || !message.url || this.postSet.has(message.url))
			{
				return;
			}

			const viewArgs = {
				name:        message.name
				, uid:       message.header.uid
				, type:      message.header.type
				, time:      new Date( message.header.issued * 1000 )
				, timecode:  message.header.issued
				, author:    message.header.author
				, authority: message.header.authority
				, slug:      message.header.type.substr(0, 10) === 'text/plain'
					? message.body.substr(0, 140)
					: null
			};

			this.args.posts.push(viewArgs);

			this.postSet.add(message.url);
		});
	};

	createPost(event)
	{
		event.preventDefault();

		if(!this.args.inputPost)
		{
			return;
		}

		const raw = view.args.inputPost;

		const message = 'Sycamore self-edit.';
		const content = btoa(unescape(encodeURIComponent(raw)));
		const branch  = 'master';
		const sha     = '';

		const postChange = {message, content, sha};

		const headers = {
			'Content-Type': 'application/json'
			, Accept:       'application/vnd.github.v3.json'
		};

		const gitHubToken = JSON.parse(sessionStorage.getItem('sycamore::github-token'));
		const method = 'PUT';
		const body   = JSON.stringify(postChange);
		const mode   = 'cors';

		const credentials = 'omit';

		if(gitHubToken && gitHubToken.access_token)
		{
			headers.Authorization = `token ${gitHubToken.access_token}`;
		}
		else
		{
			return;
		}

		const filepath = 'messages';
		const filename = `post-${Date.now()}.md`;

		return fetch(
			'https://api.github.com/repos/seanmorris/sycamore'
				+ '/contents/'
				+ (filepath)
				+ (filepath ? '/' : '')
				+ (filename)
			, {method, headers, body, mode}
		).then(response => response.json()
		).then(response => this.args.inputPost = '');
	};

	follow(event, post)
	{
		const openDb    = UserDatabase.open('users', 1);
		const fetchCard = fetch(post.authority + '/contact-card.json').then(r => r.json());

		Promise.all([openDb, fetchCard]).then(([database, contactCard]) => {

			const query = {
				store:   'users'
				, index: 'uid'
				, range: post.uid
				, type:  UserModel
			};

			return database.select(query).one().then(result => {

				const record = result.record;

				if(!record)
				{
					const user = UserModel.from(contactCard);

					database.insert('users', user);
				}
				else
				{
					record.consume(contactCard);

					database.update('users', record);
				}

				const query = {
					store:   'users'
					, index: 'uid'
					, type:  UserModel
				};

				return database.select(query).each(record => {

					console.log(record);

					return record;

				});

			}).then(profiles => {

				console.log(profiles);

				// github.get('docs/syndicating.json').then(original => {

				// 	const profiles = this.args.profiles.filter(x=>x);

				// 	return github.put({
				// 		location: 'docs/syndicating.json'
				// 		, data:   JSON.stringify(profiles, null, 4)
				// 		, sha:    original.sha
				// 	});
				// });
			});

		});
	}
}
