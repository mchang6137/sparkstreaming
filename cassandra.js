//Contains functionality on deploying the Redis service with the computation service
const {Container, Service, publicInternet, MachineRule} = require("@quilt/quilt");
var image = "cassandra:2.2"
var kafka_hostname = "kafka_host"
var spark_hostname = "spark_host"
var cassandra_hostname = "cassandra_host"

function Cassandra() {
    var members = new Container(image)
    this._members = new Service("cassandra", [members]);
}

Cassandra.prototype.port = 9042

Cassandra.prototype.deploy = function(deployment) {
  deployment.deploy(this.services());
};

Cassandra.prototype.services = function() {
  return [this._members];
};

Cassandra.prototype.connect = function(p, to) {
  var services = to.services();
  for (i = 0; i < services.length; i++) {
    this._members.connect(p, services[i]);
  }
};

Cassandra.prototype.debug = function(){
    this._members.connect(8081, publicInternet);
    this._members.connect(8080, publicInternet);
    this._members.connect(80, publicInternet);
    this._members.connect(53, publicInternet);
    this._members.connect(443, publicInternet);
    this._members.connect(5000, publicInternet);

    publicInternet.connect(8080, this._members);
    publicInternet.connect(5000, this._members);
    publicInternet.connect(8081, this._members);
    publicInternet.connect(53, this._members);
    publicInternet.connect(443, this._members);
    publicInternet.connect(80, this._members);
};

module.exports = Cassandra;
