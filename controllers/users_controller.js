
module.exports.findAllUsers = (req, res) => {
	const cassandra = require('cassandra-driver');
	const client = new cassandra.Client({
		contactPoints: ['127.0.0.1']
	});

	client.connect()
	  .then(function () {
	    console.log('Connected to cluster with %d host(s): %j', client.hosts.length, client.hosts.keys());
	    console.log('Keyspaces: %j', Object.keys(client.metadata.keyspaces));
	    console.log('Shutting down');
	    return client.shutdown();
	  })
	  .catch(function (err) {
	    console.error('There was an error when connecting', err);
	    return client.shutdown();
	  });
    // res.status(202).json({data : "success"})
}

module.exports.register = (req, res) => {
    res.status(200).json({data : "success"})
}

module.exports.login = (req, res) => {
    res.status(200).json({data : "success"})
}