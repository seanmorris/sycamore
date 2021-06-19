import { View } from 'curvature/base/View';

import { UserList } from './UserList';
import { Matrix } from './Matrix';

const matrix = new Matrix;

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

	openSettings()
	{
		this.args.settings = this.args.settings ? null : new UserList;
	}
}
