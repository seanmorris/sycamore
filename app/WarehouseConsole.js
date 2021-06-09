import { View } from 'curvature/base/View';
import { MessageModel } from './MessageModel';
import { FeedView } from './FeedView';

export class WarehouseConsole extends View
{
	template = require('./warehouse-console.html');

	stream = new EventSource('https://backend.warehouse.seanmorr.is/subscribe/sycamore.seanmorr.is::posts');

	constructor(args)
	{
		super(args);

		const feed = this.args.feed = new FeedView;

		this.listen(this.stream, 'ServerEvent', event => {

			try
			{
				const frame = JSON.parse(event.data);

				if(frame.payload.substr(1,2) !== '🍁')
				{
					return;
				}

				const payload = JSON.parse(frame.payload);

				MessageModel.fromString(payload).then(message => {

					feed.displayPost(message);

				})
			}
			catch(error)
			{
				console.log(error);
			}


		});
	}
}
