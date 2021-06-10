import { View } from 'curvature/base/View';
import { Tag } from 'curvature/base/Tag';

export class MessageView extends View
{
	template = require('./message.html');

	formatTime(time)
	{
		return new Date( time * 1000 )
	}

	verifiedClass(flag)
	{
		if(flag === true)
		{
			return 'verified';
		}
		else if(flag === false)
		{
			return 'verify-failed';
		}
		else if(flag === null)
		{
			return 'verify-pending';
		}
	}
}
