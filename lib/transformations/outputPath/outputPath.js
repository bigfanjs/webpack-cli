const utils = require('../utils');

module.exports = function(j, ast) {
	const literalOutputPath = ast
		.find(j.ObjectExpression)
		.filter(p => utils.safeTraverse(p, ['parentPath', 'value', 'key', 'name']) === 'output')
		.find(j.Property)
		.filter(p => utils.safeTraverse(p, ['value', 'key', 'name']) === 'path'
			&& utils.safeTraverse(p, ['value', 'value', 'type']) === 'Literal');

	if (literalOutputPath) {
		let pathVarName = 'path';
		let isPathPresent = false;
		const pathDecalaration = ast
			.find(j.VariableDeclarator)
			.filter(p => utils.safeTraverse(p, ['value', 'init', 'callee', 'name']) === 'require')
			.filter(p => utils.safeTraverse(p, ['value', 'init', 'arguments'])
					&& p.value.init.arguments.reduce((isPresent, a) => {
						return a.type === 'Literal' && a.value === 'path' || isPresent;
					}, false));

		if (pathDecalaration) {
			isPathPresent = true;
			pathDecalaration.forEach(p => {
				pathVarName = utils.safeTraverse(p, ['value', 'id', 'name']);
			});
		}

		literalOutputPath
			.find(j.Literal)
			.replaceWith(p => replaceWithPath(j, p, pathVarName));

		if(!isPathPresent){
			const pathRequire = utils.getRequire(j, 'path', 'path');
			return ast.find(j.Program)
				.replaceWith(p => j.program([].concat(pathRequire).concat(p.value.body)));
		}
	}
	return ast;
};

function replaceWithPath(j, p, pathVarName) {
	const convertedPath = j.callExpression(
		j.memberExpression(
		j.identifier(pathVarName),
		j.identifier('join'),
		false),
		[j.identifier('__dirname'), p.value]);
	return convertedPath;
}

