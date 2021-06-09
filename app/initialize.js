import { Router } from 'curvature/base/Router';

import { RootView } from './RootView';
import { FeedView } from './FeedView';

import { UserView } from './UserView';
import { UserModel } from './UserModel';
import { UserDatabase } from './UserDatabase';

import { MessageModel } from './MessageModel';

import { WarehouseConsole } from './WarehouseConsole';

const view = new RootView;

UserDatabase.syncUsers();

const routes = {
	'': args => {
		const feed = new FeedView({...args, showForm: true});
		
		feed.loadFeeds();

		return feed;
	}

	, 'messages/%mid': args => {

		const feedView = new FeedView(args);

		MessageModel.fromUrl('/messages/' + args.mid + '.smsg').then(message => {

			feedView.displayPost(message);

		});

		return feedView;

	}
	, 'user/%uid':     args => new UserView(args)
	, 'warehouse':     args => new WarehouseConsole(args)
};

Router.listen(view, routes);

view.listen(
	document
	, 'DOMContentLoaded'
	, event => view.render(document.body)
	, {once: true}
);
