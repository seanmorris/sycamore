import { View } from 'curvature/base/View';
import { Form } from 'curvature/form/Form';

import { Wizard } from './installer/Wizard';

export class Installer extends View
{
	template  = require('./installer.html');
	wizard = [
		require('./installer/wizard/step-1.html')
		, require('./installer/wizard/step-2.html')
		, require('./installer/wizard/step-3.html')
		, require('./installer/wizard/step-4.html')
		, require('./installer/wizard/step-5.html')
		, require('./installer/wizard/step-6.html')
	];

	constructor(args)
	{
		super(args);

		this.args.current     = 0;
		this.args.iconType    = 'spinner';
		this.args.showOverlay = 'hide';

		this.advance();
	}

	advance()
	{
		this.args.slide = Wizard.from(
			this.wizard[this.args.current++]
			, this.args
			, this
		);
	}
}
