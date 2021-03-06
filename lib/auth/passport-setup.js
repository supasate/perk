const passport = require('passport');
const path = require('path');
const UserModel = require('../../models/User');
const authenticator = require('./authenticator');
const config = require('../config');
const includeAll = require('include-all');
const logger = require('../logger');
const adapters = includeAll({
	dirname: __dirname + '/adapters',
	filter: /(.+)\.js$/
});

module.exports = function(app) {
	if(!config.auth) return;
	passport.serializeUser(function(user, done) {
		done(null, user.id);
	});

	passport.deserializeUser(function(id, done) {
		UserModel.forge({id: id}).fetch().then(
			function(user) {
				done(null, user);
			},
			function(err) {
				done(err);
			}
		);
	});

	for(let adapterName in config.auth) {
		adapterName = adapterName.toLowerCase();
		if(adapterName === 'local') {
			continue;
		}
		if(!adapters.hasOwnProperty(adapterName)) {
			logger.warn('Auth adapter does not exist: %s', adapterName);
		}
		else {
			let adapter = adapters[adapterName];
			let strategyConfig = config.auth[adapterName];
			let defaultCallback = config.webserver.baseUrl + '/' + path.join(
				'auth',
				adapterName,
				'callback'
			);
			strategyConfig.callbackURL = strategyConfig.callbackURL || defaultCallback;
			strategyConfig.passReqToCallback = true;
			
			let strategy = new adapter.strategy(strategyConfig, function(req, accessToken, refreshToken, profile, done) {
				adapter.translateProfile(accessToken, refreshToken, profile, function(err, profileData) {
					if(err) {
						return done(err);
					}
					return authenticator(req, accessToken, profileData, adapterName, done);
				});
			});
			passport.use(strategy);
		}
	}

	app.use(passport.initialize());
	app.use(passport.session());
};