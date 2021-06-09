import { View } from 'curvature/base/View';

import { UserModel } from './UserModel';
import { UserDatabase } from './UserDatabase';

export class UserView extends View
{
	template = require('./user.html');

	constructor(args)
	{
		super(args);

		UserDatabase.open('users', 1).then(database => {
			const query = {
				store:   'users'
				, index: 'uid'
				, range: args.uid
				, type:  UserModel
			};
			
			database.select(query).one().then(({result,record}) => {
				Object.assign(this.args, record);
			});
		});
	}
}
