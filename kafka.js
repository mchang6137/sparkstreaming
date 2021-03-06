//Contains functionality on deploying the Redis service with the computation service
const {PortRange,Container, allow, publicInternet, MachineRule} = require("@quilt/quilt");
const fs = require('fs');
const path = require('path');
const config_path = '/opt/kafka_2.11-0.10.1.0/config/'
const zookeeper_file = 'zookeeper.properties'
const server_file = 'server.properties'

var image = "mchang6137/kafka"
var kafka_hostname_base = "kafka_broker"
var kafka_fullhostname = "kafka_broker.q"

function Kafka(num_nodes) {
    zookeeper_connect_str = '';
    for(i = 0; i < num_nodes; i++) {
	host_str = 'kafka_broker' + i + '.q:2181,';
	zookeeper_connect_str += host_str;
    }
    zookeeper_connect_str = zookeeper_connect_str.substring(0, zookeeper_connect_str.length-1);
    
    all_members = [];
    for(i = 0; i < num_nodes; i++) {
	hostname_full = 'kafka_broker' + i + '.q';
	hostname = 'kafka_broker' + i;
	const zookeeper_local = fs.readFileSync(
	    path.join(__dirname,
		      'kafka_configs',
		      zookeeper_file), { encoding: 'utf8' });
	const server_local = fs.readFileSync(
	    path.join(__dirname,
                      'kafka_configs',
                      server_file + i), { encoding: 'utf8' });
	const files = {'/opt/kafka_2.11-0.10.1.0/config/zookeeper.properties' : zookeeper_local };
	files[path.join(config_path, server_file)] = server_local;
	
	all_members.push(
	    new Container(hostname, image, {
		env: {
		    'ADVERTISED_HOST': hostname_full,
		    'ADVERTISED_PORT': "9092",
		    'BROKER_ID': i.toString(),
		    'ZOOKEEPER_CONNECT': zookeeper_connect_str,
		    'NUM_BROKERS': num_nodes.toString(),
		},
		filepathToContent: files, }
			 )
	);
    }

    this._members = all_members;
    allow(this._members, this._members, new PortRange(1, 65535));
}

Kafka.prototype.port = 9092;
Kafka.prototype.zookeeper_port = 2181;

Kafka.prototype.deploy = function(deployment) {
    deployment.deploy(this._members);
};

Kafka.prototype.get_members = function() {
    return [this._members];
}

Kafka.prototype.connect = function(p, to) {
    var to_members = to.get_members();
    for (i = 0; i < to_members.length; i++) {
	allow(this._members, to_members[i], p);
    }
};

Kafka.prototype.debug = function(){
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

module.exports = Kafka;
