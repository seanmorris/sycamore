import { Database } from 'curvature/model/Database';

export class MessageDatabase extends Database
{
	_version_1(database)
	{
		const messageStore = this.createObjectStore('messages', {keyPath: 'url', unique: true});

		messageStore.createIndex('authority', 'header.authority', {unique: false});
		messageStore.createIndex('issued', 'header.issued', {unique: false});
		messageStore.createIndex('name', 'header.name', {unique: false});
		messageStore.createIndex('url', 'url', {unique: true});
	}
}
