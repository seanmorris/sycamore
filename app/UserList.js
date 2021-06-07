import { View } from 'curvature/base/View';

import { UserModel } from './UserModel';
import { UserDatabase } from './UserDatabase';

import { Github } from './Github';

export class UserList extends View
{
	template = require('./user-list.html');

	constructor(args)
	{
		super(args);

		this.args.profiles = [];

		UserDatabase.open('users', 1).then(database => {
			const query = {
				store:   'users'
				, index: 'uid'
				, type:  UserModel
			};
			
			database.select(query)
				.each(result => this.args.profiles.push(result));
		});
	}

	removeMode()
	{
		this.args.removeMode = this.args.removeMode ? null : 'remove-mode';
	}

	deleteUser(event, user, index)
	{
		if(!user)
		{
			return;
		}

		UserDatabase.open('users', 1)
			.then(database => database.delete('users', user));

		delete this.args.profiles[index];

		const github = new Github('seanmorris/sycamore');

		github.get('docs/syndicating.json').then(original => {

			const profiles = this.args.profiles.filter(x=>x);

			return github.put({
				location: 'docs/syndicating.json'
				, data:   JSON.stringify(profiles, null, 4)
				, sha:    original.sha
			});
		});
	}
}
