import { Router } from 'curvature/base/Router';

import { RootView } from './RootView';
import { FeedView } from './FeedView';

import { UserView } from './UserView';
import { UserModel } from './UserModel';
import { UserDatabase } from './UserDatabase';

const view = new RootView;

UserDatabase.syncUsers();

const routes = {
	'': () => {
		const feed = new FeedView;
		
		feed.loadFeeds();

		return feed;
	}

	, 'user/%uid': args => new UserView(args)
	, 'messages/%mid': args => new FeedView(args)
};

Router.listen(view, routes);

view.listen(
	document
	, 'DOMContentLoaded'
	, event => view.render(document.body)
	, {once: true}
);
