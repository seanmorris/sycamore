import { View } from 'curvature/base/View';

const view = View.from(
	`<ul class = "messages" cv-each = "posts:post">
		<li data-type = "[[post.type]]">
			<section>
				<div class = "avatar"></div>
				<span class = "author">[[post.author]]</span>
			</section>
			
			<section>
				<span class = "body">[[post.slug]]</span>
			</section>
			
			<section>
				<a href = "/messages/[[post.name]]">go</a>
			</section>
		</li>
	</ul>`
);

view.args.posts = [];

fetch('feeds.list').then(response => response.text()).then(feedList => {

	const feeds = feedList.split(/\n/);

	for(const feed of feeds)
	{
		if(!feed) { continue; }

		fetch(feed).then(response => response.text()).then(feed => {

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

					view.args.posts.push({
						name:     message.header.name
						, type:   message.header.type
						, author: message.header.author
						, slug:   message.header.type.substr(0, 10) === 'text/plain' 
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
