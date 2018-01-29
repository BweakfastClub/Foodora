const cassandra = require('cassandra-driver');
const async = require('async');
const assert = require('assert');
const client = new cassandra.Client({ contactPoints: ['127.0.0.1']});

module.exports.insertAndQueryUser = () => {
	const id = cassandra.types.Uuid.random();
	async.series([
	  function connect(next) {
	    client.connect(next);
	  },
	  function createKeyspace(next) {
	    const query = "CREATE KEYSPACE IF NOT EXISTS development WITH replication = {'class': 'SimpleStrategy', 'replication_factor': '3' }";
	    client.execute(query, next);
	  },
	  function createTable(next) {
	    const query = 'CREATE TABLE IF NOT EXISTS development.users (id uuid, name text, PRIMARY KEY(id))';
	    client.execute(query, next);
	  },
	  function insert(next) {
	    const query = 'INSERT INTO development.users (id, name) VALUES (?, ?)';
	    client.execute(query, [ id, 'Kylo'], { prepare: true}, next);
	  },
	  function select(next) {
	    const query = 'SELECT id, name FROM development.users WHERE id = ?';
	    client.execute(query, [ id ], { prepare: true}, function (err, result) {
	      if (err) return next(err);
	      const row = result.first();
	      console.log('Obtained row: ', row);
	      assert.strictEqual(row.id.toString(), id.toString());
	      assert.strictEqual(row.name, 'Kylo');
	      next();
	    });
	  }
	], function (err) {
	  if (err) {
	    console.error('There was an error', err.message, err.stack);
	  }
	  console.log('Shutting down');
	  client.shutdown();
	});
}