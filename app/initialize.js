import { View } from 'curvature/base/View';

document.addEventListener('DOMContentLoaded', function() {
	const view = View.from('<b>test</b>');

	view.render(document.body);
});
