import { Bindable } from 'curvature/base/Bindable';
import { View     } from 'curvature/base/View';
import { Model    } from 'curvature/model/Model';
import { Database } from 'curvature/model/Database';

export class MessageDatabase extends Database
{
	_version_1(database)
	{
		const messageStore = this.createObjectStore('messages', {keyPath: 'id', autoIncrement: true});

		messageStore.createIndex('url', ['header.authority', 'header.name'], {unique: true});
		messageStore.createIndex('issued', 'header.issued', {unique: false});
	}
}


class MessageModel extends Model {
	static get keyProps() { return ['url', 'class'] }
	get authority() { return this.header && this.header.authority }
	get issued() { return this.header && this.header.issued }
	get name() { return this.header && this.header.name }
	get url()  { return this.authority + '/' + this.name }
	
	static fromString(messageBody)
	{
		const slug = messageBody.substring(0, 3);
		
		const headerHex = messageBody.substr(3, 10);
		const headerLen = parseInt(headerHex);
		const header    = messageBody.substr(14, headerLen);
		
		const bodyStart = headerLen + 25;

		const bodyHex = messageBody.substr(headerLen + 14, 10);
		const bodyLen = parseInt(bodyHex);
		const body    = messageBody.substr(bodyStart, bodyLen);

		const signatureStart = bodyStart + bodyLen + 1;
		
		const signatureHex = messageBody.substr(signatureStart, 10);
		const signatureLen = parseInt(signatureHex);
		const signature    = messageBody.substr(bodyStart + bodyLen + 12);

		// if(this.header && this.header.issued && this.header.issued > header.issued)
		// {
		// 	return false;
		// }

		const headerObject = JSON.parse(header);

		const url = headerObject.authority + '/' + headerObject.name;

		const skeleton = {class: 'message', header: headerObject, body, signature};

		const message = new MessageModel;

		message.consume(skeleton);

		// console.log(message);

		return message;
	}

	signature;
	header;
	body;
	id;
};

const posts = new Set;

const loadPosts = messageBytes => {

	const message = MessageModel.fromString(messageBytes);

	if(!message.url || posts.has(message.url))
	{
		return;
	}

	const viewArgs = {
		name:       message.name
		, type:     message.header.type
		, time:     new Date( message.header.issued * 1000 )
		, timecode: message.header.issued
		, author:   message.header.author
		, slug:     message.header.type.substr(0, 10) === 'text/plain' 
			? message.body.substr(0, 140)
			: null
	};

	view.args.posts.push(viewArgs);

	posts.add(message.url);

	const query  = {
		store: 'messages',
		index: 'url',
		range: message.url,
		type:  MessageModel
	};

	MessageDatabase.open('messages', 1).then(database => {
		database.select(query).one().then(result => {
			const record = result.record;
			if (!record)
			{
				const message = MessageModel.fromString(messageBytes);
				database.insert('messages', message);
			}
			else
			{
				record.consume(message);
				database.update('messages', record);
			}
		}).catch(error => console.log(error));
	});
};

const view = View.from(
	`
	<section class = "app theme-[[profileTheme]]">

		<section class = "header">
		
			<div class = "branding">
				<h1><a cv-link = "/">[[profileName]]</a></h1>
				<small>A <a cv-link = "https://github.com/seanmorris/sycamore">Sycamore</a> [[profileType]]</small>
			</div>
			
			<div class = "menu">
				<a cv-on = "click:githubLoginClicked(event)">
					<img class = "icon" src = "/user.svg">
				</a>
			</div>
		
		</section>

		<section class = "body">
			<form class = "post" cv-on = "submit:createPost(event)">
				<input type = "text" placeholder = "Write a post!" cv-bind = "inputPost" />
				<input type = "submit" />
			</form>

			<ul class = "messages" cv-each = "posts:post">

				<li data-type = "[[post.type]]">
					
					<section class = "author">
						<div class = "avatar"></div>
						<span class = "author">[[post.author]]</span>
					</section>
					
					<section>
						<small title = "[[post.timecode]]">[[post.time]]</small>
					</section>
					
					<section>
						<span class = "body">[[post.slug]]</span>
					</section>
					
					<section>
						<a cv-link = "/messages/[[post.name]]">
							[[post.name]]
							<img class = "icon" src = "/go.svg" />
						</a>
					</section>
				
				</li>
			</ul>
		</section>

		<section class = "footer">
			&copy; 2021 Sean Morris, All rights reserved.
		</section>

	</section>
	`
);

view.githubLoginClicked = event => {
	const redirectUri = 'https://sycamore.seanmorr.is/github-auth/accept';
	const clientId    = '4c8f4209d3c4ad741d2c';
	const state       = Math.random().toString(36);

	const loginWindow = window.open(
		'https://github.com/login/oauth/authorize'
			+ '?redirect_uri=' + redirectUri
			+ '&client_id=' + clientId
			+ '&scope=public_repo'
			+ '&state=' + state
		, `github-login`
		, `left=100,top=100,width=750,height=500,resizable=0,scrollbars=0,location=0,menubar=0,toolbar=0,status=0`
	);

	const gitHubListener = event => {
		const token = JSON.parse(event.data);

		if(token && token.access_token)
		{
			sessionStorage.setItem('sycamore::github-token', JSON.stringify(token));
		}
		else
		{
			sessionStorage.setItem('sycamore::github-token', '{}');
		}

		loginWindow.close();
	};

	const checkLogin = () => {
		if(!loginWindow.closed)
		{
			return;
		}

		clearInterval(globalThis.loginChecker);

		accept();
	};

	globalThis.loginChecker = setInterval(100, checkLogin);

	window.addEventListener('message', gitHubListener, false);
};

view.createPost = event => {
	event.preventDefault();

	if(!view.args.inputPost)
	{
		return;
	}

	const raw = view.args.inputPost;

	const branch  = 'master';
	const message = 'Sycamore self-edit.';
	const content = btoa(unescape(encodeURIComponent(raw)));
	const sha     = '';

	const postChange  = {message, content, sha};

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
	).then(response => {
		view.args.inputPost = '';
	});
};

view.args.profileTheme = 'red-dots';
view.args.profileName  = 'Sycamore Syndicator';
view.args.profileType  = 'Hub';

view.args.profileTheme = 'maple-tree';
view.args.profileName  = 'Sean Morris';
view.args.profileType  = 'Profile';

view.args.posts = [];

fetch('/feeds.list').then(response => response.text()).then(feedList => {

	const feeds = feedList.split(/\n/);

	for(const feed of feeds)
	{
		if(!feed) { continue; }

		fetch('/' + feed).then(response => response.text()).then(feed => {

			const messageLines = feed.split(/\n/);

			for(const messageLine of messageLines)
			{
				if(!messageLine) { continue; }

				const [messageTime, messageUrl] = messageLine.split(/\s/);

				fetch('/messages/' + messageUrl + '.smsg').then(response => response.text()).then(messageBody => {
					
					loadPosts(messageBody);
					
				});

			}
		});
	}
});

document.addEventListener('DOMContentLoaded', function() {
	view.render(document.body);
});
