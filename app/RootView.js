import { View } from 'curvature/base/View';

import { UserList } from './UserList';
import { Github } from './Github';

export class RootView extends View
{
	template = require('./root.html');

	constructor(args)
	{
		super(args);

		this.args.profileName  = 'Sycamore';
		this.args.profileTheme = 0 ? 'red-dots' : 'maple-tree';

	}

	matrixLoginClicked(event)
	{
		matrix.initSso(location.origin);
	}

	githubLoginClicked(event)
	{
		Github.login();
	}

	openSettings()
	{
		this.args.settings = this.args.settings ? null : new UserList;
	}
}
