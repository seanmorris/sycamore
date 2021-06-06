import { View } from 'curvature/base/View';

const createPost = event => {
	const raw = this.window.args.plain.args.content;

	const branch  = 'master';
	const message = 'Nynex self-edit.';
	const content = btoa(unescape(encodeURIComponent(raw)));
	const sha     = this.window.args.sha;

	// const url = new URL(this.window.args.url).pathname;

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

	return fetch(
		'https://api.github.com/repos/seanmorris/sycamore'
			+ '/contents/'
			+ this.window.args.filepath
			+ (this.window.args.filepath ? '/' : '')
			+ this.window.args.filename
		, {method, headers, body, mode}
	).then(response => response.json()
	).then(json => {
		this.window.args.sha = json.content.sha;
	});
}

const view = View.from(
	`
	<section class = "app theme-[[profileTheme]]">

		<section class = "header">
		
			<div class = "branding">
				<h1><a cv-link = "/">[[profileName]]</a></h1>
				<small>A <a cv-link = "https://github.com/seanmorris/sycamore">Sycamore</a> [[profileType]]</small>
			</div>
			
			<div class = "menu">
				<a cv-on = "click:githubLoginClicked">
					<img class = "icon" src = "/user.svg">
				</a>
			</div>
		
		</section>

		<form class = "post">
			<input type = "text" placeholder = "Write a post!" />
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
}

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
					
					const slug      = messageBody.substring(0, 3);
					
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

					const message = {header: JSON.parse(header), body, signature};

					console.log(message.header.issued * 1000);

					view.args.posts.push({
						name:       message.header.name
						, type:     message.header.type
						, time:     new Date( message.header.issued * 1000 )
						, timecode: message.header.issued
						, author:   message.header.author
						, slug:     message.header.type.substr(0, 10) === 'text/plain' 
							? message.body.substr(0, 140)
							: null
					});
				});

			}
		});
	}
});

document.addEventListener('DOMContentLoaded', function() {
	view.render(document.body);
});
