'use strict';
module.exports = {
	client: 'pg',
	connection: {
		host: '127.0.0.1',
		user: 'postgres',
		password: '',
		database: 'appdb',
		charset: 'utf8'
	},
	migrations: {
		tableName: 'migrations'
	},
	directory: './seeds/dev'
};