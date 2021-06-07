import { Model } from 'curvature/model/Model';

export class UserModel extends Model {
	static get keyProps() { return ['uid', 'class'] }
	name;
	about;
	issued;
	img;
	uid;
	url;
	hub;
	key;
};