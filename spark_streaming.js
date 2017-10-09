//Contains functionality on deploying the Redis service with the computation service
const {allow, Container, Service, publicInternet, MachineRule} = require("@quilt/quilt");
var image = "mchang6137/spark_streaming"
var kafka_hostname = "kafka_broker"
var cassandra_hostname = "cassandra_host"

function SparkStreaming(n_producers) {
    all_members = [];
    for (i = 0; i < n_producers; i++) {
	host_str = 'spark_streaming' + i;
	var member = new Container(host_str, image, {
	    env: {
		'LEIN_ROOT': 'true',
		'TARGET': kafka_hostname + i + '.q',
		'LOAD': '3000',
	    }
	});
	all_members.push(member);
    }
    
    this._members = all_members;
}

SparkStreaming.prototype.deploy = function(deployment) {
  deployment.deploy(this._members);
};

SparkStreaming.prototype.connect = function(p, to) {
    var members = to.get_members();
    for (i = 0; i < members.length; i++) {
	allow(this._members, members[i], p);
    }
};

SparkStreaming.prototype.get_members = function() {
    return [this._members];
}

SparkStreaming.prototype.debug = function(){
    allow(this._members, publicInternet, 8081);
    allow(this._members, publicInternet, 8080);
    allow(this._members, publicInternet, 80);
    allow(this._members, publicInternet, 53);
    allow(this._members, publicInternet, 443);
    allow(this._members, publicInternet, 5000);

    allow(publicInternet, this._members, 8081);
    allow(publicInternet, this._members, 8080);
    allow(publicInternet, this._members, 80);
    allow(publicInternet, this._members, 53);
    allow(publicInternet, this._members, 443);
    allow(publicInternet, this._members, 5000);
};

module.exports = SparkStreaming;
