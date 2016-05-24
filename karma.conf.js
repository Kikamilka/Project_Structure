module.exports = function (config) {
	config.set({
		frameworks: ['browserify', 'mocha', 'chai-as-promised', 'chai-spies', 'chai'],
		files: ['test/**/*.spec.js'],
		reporters: ['mocha'],
		preprocessors: {
			'test/**/*.spec.js': ['browserify']
		},
		browserify: {
			debug: true,
			// needed to enable mocks
			//plugin: [require('proxyquireify').plugin]
		},
		port: 9876,
		colors: true,
		logLevel: 'INFO',
		browsers: ['Chrome'],
		autoWatch: true
	});
};