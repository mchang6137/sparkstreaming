const {publicInternet, Container, allow} = require('@quilt/quilt');

const port = 6379;
const image = 'hantaowang/redis';

/**
 * Creates a replicated Redis database.
 * @param {number} nWorker - The desired number of Redis replicas.
 * @param {string} auth - The password for authenticating with Redis instances.
 */
function Redis(nWorker, auth) {
    this.master = createMaster(auth);
    this.workers = createWorkers(nWorker, auth, this.master);
    
    this.master.allowFrom(this.workers, port);

    this.deploy = function deploy(deployment) {
        deployment.deploy(this.master);
	deployment.deploy(this.workers);
    };

    // only connects other services to the master.
    this.allowFrom = function allowFrom(senderContainer, port) {
	allow(this.master, senderContainer, port);
	allow(senderContainer, this.master, port);
    };

    this.get_members = function get_members() {
	return [this.master, this.workers];
    }
    
    // Connect all members to both workers and masters
    this.connect = function connect(p, to) {
	var members = to.get_members();
	for (i = 0; i < members.length; i++) {
	    allow(this.workers, members[i], p);
	    allow(this.master, members[i], p);
	}
    };

    this.debug = function debug() {
	allow(this.workers, publicInternet, 8081);
	allow(this.workers, publicInternet, 8080);
	allow(this.workers, publicInternet, 80);
	allow(this.workers, publicInternet, 53);
	allow(this.workers, publicInternet, 443);
	allow(this.workers, publicInternet, 5000);
	
	allow(publicInternet, this.workers, 8081);
	allow(publicInternet, this.workers, 8080);
	allow(publicInternet, this.workers, 80);
	allow(publicInternet, this.workers, 53);
	allow(publicInternet, this.workers, 443);
	allow(publicInternet, this.workers, 5000);

	allow(this.master, publicInternet, 8081);
	allow(this.master, publicInternet, 8080);
	allow(this.master, publicInternet, 80);
	allow(this.master, publicInternet, 53);
	allow(this.master, publicInternet, 443);
	allow(this.master, publicInternet, 5000);

	allow(publicInternet, this.master, 8081);
	allow(publicInternet, this.master, 8080);
	allow(publicInternet, this.master, 80);
	allow(publicInternet, this.master, 53);
	allow(publicInternet, this.master, 443);
	allow(publicInternet, this.master, 5000);
    }
}

/**
 * Creates a service with a master Redis instance.
 * @param {string} auth - The password for autheticating with Redis.
 * @return {Service} - The Redis master service.
 */
function createMaster(auth) {
    let master_redis = new Container("redis-ms", image, {
	env: {
            'ROLE': 'master',
            'AUTH': auth,
	}});
	
    return master_redis
}

/**
 * Creates a service with replicated Redis workers.
 * @param {number} n - The desired number of workers.
 * @param {string} auth - The password for autheticating with Redis.
 * @param {Service} master - The master Redis service.
 * @return {Service} - The worker Redis service.
 */
function createWorkers(n, auth, master) {
    let refWorker = new Container('redis-wk', image, {
	env: {
            'ROLE': 'worker',
	    'AUTH': auth,
            'MASTER': master.getHostname(),
	}});

    return refWorker.replicate(n);
};

module.exports = Redis;
