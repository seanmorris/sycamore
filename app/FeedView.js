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

export class FeedView extends View
{
	template = require('feed.html');
	postSet  = new Set;

	constructor(args)
	{
		super(args);

		this.args.posts = this.args.posts || [];
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

		if(!this.args.inputPost)
		{
			return;
		}

		const filename = `messages/post-${Date.now()}.md`;

		const github = new Github('seanmorris/sycamore');

		const putter = github.put({
			data:       this.args.inputPost + "\n"
			, location: filename
			, message:  'Sycamore self-edit.'
			, branch:   'master'
			, sha:      ''
		});

		putter.then(() => this.args.inputPost = '');

		return putter;
	};
}
