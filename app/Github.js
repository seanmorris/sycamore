export class Github
{
	constructor(repository)
	{
		this.repository = repository;
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
			, Accept:       'application/vnd.github.v3.json'
		};

		return fetch(
			'https://api.github.com/repos/'
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
			, Accept:       'application/vnd.github.v3.json'
		};

		const gitHubToken = this.getToken();
		const method = 'PUT';
		const body   = JSON.stringify(postChange);
		const mode   = 'cors';

		const credentials = 'omit';

		console.log(gitHubToken);

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
				+ this.repository
				+ '/contents/'
				+ location
			, {method, headers, body, mode}
		).then(response => response.json());
	}
}
