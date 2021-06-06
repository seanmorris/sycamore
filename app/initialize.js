import { View } from 'curvature/base/View';

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
					const headerLen = messageBody.substring(4, 12);

					console.log(headerLen);
					
					const headerLenBytes = Uint8Array.from(headerLen);

					console.log(slug, headerLen, headerLenBytes);
				});

			}
		});
	}
});

document.addEventListener('DOMContentLoaded', function() {
	const view = View.from(
		`<ul>
			<li cv-each = "posts:post">
				<a href = "/messages/[[post.name]]">[[post.name]]</a>
			</li>
		</ul>`
	);

	view.render(document.body);
});
