const {PortRange, Container, allow, publicInternet } = require('@quilt/quilt');

let master_image = 'mchang6137/spark-yahoo-master';
let worker_image = 'mchang6137/spark-yahoo-worker';

/**
 * Change the Spark Docker image used to run the cluster.
 *
 * @param {string} newImage The Docker image used to run the cluster.
 */
function setImage(newImage) {
  image = newImage;
}

function getHostname(c) {
  return c.getHostname();
}

/**
 * Spark represents a Spark cluster (a set of connected Spark masters and
 * workers).
 *
 * @param {number} nMaster The number of masters to boot.
 * @param {number} nWorker The number of workers to boot.
 * @param {Container[]} [zookeeper] The Zookeeper containers used to coordinate the
 * Spark masters.
 */
function Spark(nMaster, nWorker, zookeeper) {
    const refMaster = new Container('spark-ms', master_image, {
	command: ['run', 'master'],
	env: {SPARK_MASTER_WEBUI_PORT : '7654'},
    });
    this.masters = refMaster.replicate(nMaster);

    if (zookeeper) {
	const zooHosts = zookeeper.containers.map(getHostname);
	const zooHostsStr = zooHosts.join(',');
	this.masters.forEach((master) => {
	    master.setEnv('ZOO', zooHostsStr);
	});
    }

    const masterHosts = this.masters.map(getHostname);
    const refWorker = new Container('spark-wk', worker_image, {
	command: ['run', 'worker'],
	env: {
	    MASTERS: masterHosts.join(','),
	    SPARK_WORKER_WEBUI_PORT: "7654",
	},
    });
    
    this.workers = refWorker.replicate(nWorker);

    // Open all ports between all workers and masters
    allow(this.workers, this.workers, new PortRange(1, 65535));
    allow(this.workers, this.masters, new PortRange(1, 65535));
    allow(this.masters, this.workers, new PortRange(1, 65535));
    allow(this.masters, this.masters, new PortRange(1, 65535));
    
    if (zookeeper) {
	allow(this.masters, zookeeper, 2181);
    }

    this.job = function job(command) {
	this.masters.forEach((master) => {
	    master.setEnv('JOB', command);
	});
	return this;
    };

    this.get_members = function get_members() {
	return [this.masters, this.workers];
    }
    
    this.exposeUIToPublic = function exposeUIToPublic() {
	allow(publicInternet, this.masters, 8080);
	allow(publicInternet, this.workers, 8081);
	allow(publicInternet, this.workers, 7654);
	allow(publicInternet, this.masters, 7654)

	allow(this.workers, publicInternet, 7654);
	allow(this.masters, publicInternet, 7654)
	
	return this;
    };
    
    this.connect = function connect(p, to) {
	to_members = to.get_members();
	for (i = 0; i < to_members.length; i++) {
	    allow(this.workers, to_members[i], p);
	    allow(this.masters, to_members[i], p);
	}
    }
    
    this.deploy = function deploy(deployment) {
	deployment.deploy(this.masters);
	deployment.deploy(this.workers);
    };

    this.debug = function deploy() {
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
	
	allow(this.masters, publicInternet, 8081);
	allow(this.masters, publicInternet, 8080);
	allow(this.masters, publicInternet, 80);
	allow(this.masters, publicInternet, 53);
	allow(this.masters, publicInternet, 443);
	allow(this.masters, publicInternet, 5000);
	
	allow(publicInternet, this.masters, 8081);
	allow(publicInternet, this.masters, 8080);
	allow(publicInternet, this.masters, 80);
	allow(publicInternet, this.masters, 53);
	allow(publicInternet, this.masters, 443);
	allow(publicInternet, this.masters, 5000);
  };
}

exports.setImage = setImage;
exports.Spark = Spark;
