export class Sycamore
{
	static settings = {};

	static getSettings(userId)
	{
		return matrix.getUserData('sycamore.settings').then(response => {

			if(!response)
			{
				return {};
			}

			for(const [k,v] of Object.entries(response))
			{
				this.settings[k] = v;
			}

			return this.settings;
		});
	}

	static checkFeeds(userId)
	{
		Promise.all([matrix.whoAmI(), this.getSettings(userId)]).then(([user, settings]) => {
			let createPublic  = Promise.resolve({room_id: settings.publicFeed});
			let createPrivate = Promise.resolve({room_id: settings.privateFeed});

			if(!settings.publicFeed)
			{
				createPublic = matrix.createRoom('sycamore public feed', '', 'private', [
					{
						type:  'm.room.history_visibility'
						, content: {
							history_visibility: 'world_readable'
						}
					}
					,  {
						type:  'm.room.join_rules'
							, content: { join_rule: 'public'}
					}
					, {
						type:  'm.room.power_levels'
						, content: {
							users_default: 0,
							users: { [user.user_id]: 100 },
							events: {
								'm.room.history_visibility': 100,
								'm.room.canonical_alias': 100,
								'm.room.power_levels': 100,
								'm.room.encryption': 100,
								'm.room.server_acl': 100,
								'm.room.tombstone': 100,
								'm.room.message': 100,
								'm.room.message': 100,
								'm.room.avatar': 100,
								'm.room.name': 100,
							},
							'ban': 100,
							'invite': 0,
							'kick': 100,
							'redact': 100,
							'events_default': 0,
							'state_default': 100,
						}
					}
				]);
			}

			if(!settings.privateFeed)
			{
				createPrivate = matrix.createRoom('sycamore private feed', '', 'private', [
					{
						type:  'm.room.history_visibility'
						, content: {
							history_visibility: 'world_readable'
						}
					}
					,  {
						type:  'm.room.join_rules'
							, content: { join_rule: 'public'}
					}
					, {
						type:  'm.room.power_levels'
						, content: {
							users_default: 0,
							users: { [user.user_id]: 100 },
							events: {
								'm.room.history_visibility': 100,
								'm.room.canonical_alias': 100,
								'm.room.power_levels': 100,
								'm.room.encryption': 100,
								'm.room.server_acl': 100,
								'm.room.tombstone': 100,
								'm.room.message': 100,
								'm.room.message': 0,
								'm.room.avatar': 100,
								'm.room.name': 100,
							},
							'ban': 100,
							'invite': 0,
							'kick': 100,
							'redact': 100,
							'events_default': 0,
							'state_default': 100,
						}
					}
				]);
			}

			return Promise.all([createPublic, createPrivate]).then(([publicFeed, privateFeed])=>{

				settings.publicFeed  = publicFeed.room_id;
				settings.privateFeed = privateFeed.room_id;

				return matrix.putUserData('sycamore.settings', JSON.stringify(settings));
			});

		});
	}

	static followFeed(feedId, userId)
	{
		return this.getSettings(userId).then(settings => {

			if(!settings.following)
			{
				settings.following = [];
			}

			if(!settings.following.includes(feedId))
			{
				settings.following.push(feedId);
			}

			matrix.joinRoom(feedId);

			return matrix.putUserData('sycamore.settings', JSON.stringify(settings));
		});
	}

	static unfollowFeed(feedId, userId)
	{
		return this.getSettings(userId).then(settings => {

			if(!settings.following)
			{
				settings.following = [];
			}

			const index = settings.following.indexOf(feedId);

			if(index > -1)
			{
				settings.following.splice(index, 1);
			}

			console.log(settings.following, index);

			matrix.leaveRoom(feedId);

			return matrix.putUserData('sycamore.settings', JSON.stringify(settings));
		});
	}

	static getFollowList(userId)
	{
		return this.getSettings(userId).then(settings => {
			return settings.following;
		});
	}
}
