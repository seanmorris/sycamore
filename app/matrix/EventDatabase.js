import { Database } from 'curvature/model/Database';

export class EventDatabase extends Database
{
	_version_1(database)
	{
		const eventStore = this.createObjectStore('events', {keyPath: 'event_id'});

		eventStore.createIndex('event_id', 'event_id', {unique: true});

		eventStore.createIndex('type', 'type', {unique: false});
		eventStore.createIndex('room_id', 'room_id', {unique: false});
		eventStore.createIndex('received', 'received', {unique: false});

		eventStore.createIndex('room_id+time', ['room_id', 'received'], {unique: false});
		eventStore.createIndex('room_id+type+time', ['room_id', 'type', 'received'], {unique: false});
	}
}
