import { Database } from 'curvature/model/Database';
import { UserModel } from './UserModel';

export class UserDatabase extends Database
{
	static syncUsers()
	{
		fetch('/syndicating.json')
		.then(response => response.json())
		.then(profiles => UserDatabase.open('users', 1).then(database => {
			for(const profile of profiles)
			{
				const query = {
					store:   'users'
					, index: 'uid'
					, range: profile.uid
					, type:  UserModel
				};
				
				database.select(query).one().then(result => {

					if(result.record)
					{
						result.record.consume(profile);
						
						database.update('users', result.record);
					}
					else
					{
						const user = UserModel.from(profile);

						database.insert('users', user);						
					}
				});
				
			}		
		}));
	}

	_version_1(database)
	{
		const messageStore = this.createObjectStore('users', {keyPath: 'uid', unique: true});

		messageStore.createIndex('name', 'name', {unique: false});
		messageStore.createIndex('url',  'url',  {unique: false});
		messageStore.createIndex('uid',  'uid',  {unique: true});
	}
}
