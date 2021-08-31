export class Github
{
	constructor(repository)
	{
		[this.owner, this.repository] = repository.split('/');
	}

	static login()
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


		return new Promise(accept => {
			const gitHubListener = event => {

				console.log(event);

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

				accept();
			};

			const checkLogin = () => {

				if(!loginWindow.closed)
				{
					return;
				}

				accept();

				clearInterval(globalThis.loginChecker);
			};

			globalThis.loginChecker = setInterval(100, checkLogin);

			window.addEventListener('message', gitHubListener, false);
		});
	}

	static getUser()
	{
		const method  = 'GET';
		const mode    = 'cors';
		const headers = {
			'Content-Type': 'application/json'
			, Accept: 'application/vnd.github.v3.json'
		};

		const gitHubToken = JSON.parse(sessionStorage.getItem('sycamore::github-token'));

		if(gitHubToken && gitHubToken.access_token)
		{
			headers.Authorization = `token ${gitHubToken.access_token}`;
		}
		else
		{
			return Promise.reject('No access token found.');
		}

		return fetch(
			'https://api.github.com/user'
			, {method, headers, mode}
		).then(response => response.json());
	}

	getToken()
	{
		const stored = sessionStorage.getItem('sycamore::github-token');

		if(stored)
		{
			return JSON.parse(stored);
		}
	}

	setToken(token)
	{
		return sessionStorage.setItem('sycamore::github-token', token);
	}

	get(location)
	{
		const method = 'GET';
		const mode    = 'cors';
		const headers = {
			'Content-Type': 'application/json'
			, Accept: 'application/vnd.github.v3.json'
		};

		return fetch(
			'https://api.github.com/repos/'
				+ this.owner
				+ '/'
				+ this.repository
				+ '/contents/'
				+ location
			, {method, headers, mode}
		).then(response => response.json());
	}

	put({data, location, message = 'Sycamore self-edit.', branch = 'master', sha = ''})
	{
		const content = btoa(unescape(encodeURIComponent(data)));
		const postChange = {message, content, sha};

		const headers = {
			'Content-Type': 'application/json'
			, Accept: 'application/vnd.github.v3.json'
		};

		const gitHubToken = this.getToken();
		const method = 'PUT';
		const mode   = 'cors';
		const body   = JSON.stringify(postChange);

		const credentials = 'omit';

		if(gitHubToken && gitHubToken.access_token)
		{
			headers.Authorization = `token ${gitHubToken.access_token}`;
		}
		else
		{
			return Promise.reject('No access token found.');
		}

		return fetch(
			'https://api.github.com/repos/'
				+ this.owner
				+ '/'
				+ this.repository
				+ '/contents/'
				+ location
			, {method, headers, body, mode}
		).then(response => response.json());
	}

	fork(toRepoAndOwner)
	{
		const [toOwner, toRepo] = toRepoAndOwner.split('/');

		console.log(toOwner, toRepo);

		const headers = {
			'Content-Type': 'application/json'
			, Accept: 'application/vnd.github.v3.json'
		};

		const gitHubToken = this.getToken();
		const method = 'POST';
		const mode   = 'cors';
		const body   = JSON.stringify({
			owner: toOwner, repo: toRepo
		});

		const credentials = 'omit';

		if(gitHubToken && gitHubToken.access_token)
		{
			headers.Authorization = `token ${gitHubToken.access_token}`;
		}
		else
		{
			return Promise.reject('No access token found.');
		}

		return fetch(
			'https://api.github.com/repos/'
				+ this.owner
				+ '/'
				+ this.repository
				+ '/forks'
			, {method, headers, body, mode}
		).then(response => response.json());
	}

	enablePages()
	{
		const headers = {
			'Content-Type': 'application/json'
			, Accept: 'application/vnd.github.switcheroo-preview+json'
		};

		const gitHubToken = this.getToken();
		const method = 'POST';
		const mode   = 'cors';
		const body   = JSON.stringify({
			source:{branch: "master", path: '/docs'}
		});

		const credentials = 'omit';

		if(gitHubToken && gitHubToken.access_token)
		{
			headers.Authorization = `token ${gitHubToken.access_token}`;
		}
		else
		{
			return Promise.reject('No access token found.');
		}

		return fetch(
			'https://api.github.com/repos/'
				+ this.owner
				+ '/'
				+ this.repository
				+ '/pages'
			, {method, headers, body, mode}
		).then(response => response.json());
	}
}
