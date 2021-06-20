import { View } from 'curvature/base/View';
import { Tag } from 'curvature/base/Tag';

import CodeMirror from 'codemirror';

// import 'codemirror/theme/3024-night.css'

import 'codemirror/mode/css/css';
import 'codemirror/mode/htmlmixed/htmlmixed';
import 'codemirror/mode/javascript/javascript';

export class SettingsView extends View
{
	template = require('./settings.html');

	constructor(...args)
	{
		super(...args);

		this.userId = matrix.getCurrentUserId();

		const editorDefaults = {
			mode:           'application/javascript'
			, theme:        'elegant'
			, gutter:       true
			, lineNumbers:  true
			, autoRefresh:  true
			, value:        '{}'
		};

		const editor = new CodeMirror(() => {}, editorDefaults);

		this.args.bindTo('content', (v,k) => {
			v = String(v);
			if(editor.getValue() !== v)
			{
				editor.setValue(v);
				editor.refresh();
			}
		});

		editor.on('change', (editor, change) => {
			this.args.content = editor.getValue();
		});

		this.args.editor = new Tag(editor.getWrapperElement());

		this.editor = editor;

		matrix.getUserData('sycamore.settings')
		.then(response => this.args.content = JSON.stringify(response || '{}', null, 2))
		.catch(error => {console.log(error); this.args.content = '{}'});
	}

	save(event)
	{
		const args = ['sycamore.settings', this.args.content]

		this.args.success = '';
		this.args.error   = '';

		matrix.putUserData(...args)
		.then(response => this.args.success = 'Saved.')
		.catch(error => error.response.json())
		.then(error => this.args.error = error.error);
	}
}
