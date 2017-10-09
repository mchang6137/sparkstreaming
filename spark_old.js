const {Container, Service, publicInternet, LabelRule, PortRange, setHostname} = require("@quilt/quilt");

var image = "mchang6137/spark-yahoo";

function setImage(newImage) {
    image = newImage;
}

function Spark(nMaster, nWorker, zookeeper) {
    var dkms = new Container(image, ["run", "master"])
      	.withEnv({"SPARK_MASTER_WEBUI_PORT" : "7654"})
	.replicate(nMaster);

      var masterhosts = "";

      for (i = 0; i < nMaster; i ++){
        dkms[i].setHostname("spark-master." + i);
        masterhosts += "spark-master." + i + ".q";
        if (i < nMaster - 1) {
          masterhosts += ",";
        }
      }

    if (zookeeper) {
        var zooHosts = zookeeper.children().join(",");
        for (var i = 0; i < nMaster; i++) {
            dkms[i].setEnv("ZOO", zooHosts);
        }
    }

    this.masters = new Service("spark-ms", dkms);

    var dkws = new Container(image, ["run", "worker"])
        .withEnv({"MASTERS": masterhosts, "SPARK_WORKER_WEBUI_PORT": "7654"})
        .replicate(nWorker);

      for (i = 0; i < nWorker; i ++){
        dkws[i].setHostname("spark-worker." + i);
      }

    this.workers = new Service("spark-wk", dkws);
    
    this.workers.allowFrom(this.masters, new PortRange(1, 65535));
    this.masters.allowFrom(this.masters, new PortRange(1, 65525));
    this.masters.allowFrom(this.workers, new PortRange(1, 65535));
    this.workers.allowFrom(this.workers, new PortRange(1, 65535));

    this.services = function() {
        return [this.masters, this.workers];
    }

    this.connect = function(p, to) {
        var services = to.services();
        for (i = 0; i < services.length; i++) {
            this.masters.connect(p, services[i]);
            this.workers.connect(p, services[i]);
        }
    }

    this.debug_danger = function(){
	for (i = 1000; i < 10000; i ++){
	    this.masters.connect(i, publicInternet);
	    publicInternet.connect(i, this.masters);
	    this.workers.connect(i, publicInternet);
	    publicInternet.connect(i, this.workers);
	}
    }

    this.debug = function(){
	//Spark Specific
	this.masters.connect(4040, publicInternet);
	publicInternet.connect(4040, this.masters);
	this.workers.connect(4040, publicInternet);
	publicInternet.connect(4040, this.workers);
	
        this.masters.connect(8081, publicInternet);
        this.masters.connect(8080, publicInternet);
        this.masters.connect(80, publicInternet);
        this.masters.connect(53, publicInternet);
        this.masters.connect(443, publicInternet);
        this.masters.connect(5000, publicInternet);

        publicInternet.connect(8080, this.masters);
        publicInternet.connect(5000, this.masters);
        publicInternet.connect(8081, this.masters);
        publicInternet.connect(53, this.masters);
        publicInternet.connect(443, this.masters);
        publicInternet.connect(80, this.masters);

        this.workers.connect(8081, publicInternet);
        this.workers.connect(8080, publicInternet);
        this.workers.connect(80, publicInternet);
        this.workers.connect(53, publicInternet);
        this.workers.connect(443, publicInternet);
        this.workers.connect(5000, publicInternet);

        publicInternet.connect(8080, this.workers);
        publicInternet.connect(5000, this.workers);
        publicInternet.connect(8081, this.workers);
        publicInternet.connect(53, this.workers);
        publicInternet.connect(443, this.workers);
        publicInternet.connect(80, this.workers);
    }

    this.job = function(command) {
        var cnt = this.masters.containers;
        for (var i = 0; i < cnt.length; i++) {
            cnt[i].env["JOB"] = command;
        }
        return this;
    }

    this.allowGet = function() {
	var a = this.masters;
	a.connect(8081, publicInternet);
	a.connect(80, publicInternet);
	a.connect(53, publicInternet);
	a.connect(443, publicInternet);
	a.connect(5000, publicInternet);

	publicInternet.connect(5000, a);
	publicInternet.connect(8081, a);
	publicInternet.connect(53, a);
	publicInternet.connect(443, a);
	publicInternet.connect(80, a); 
	
	return this;
    }

    this.public = function() {
        this.masters.allowFrom(publicInternet, 7654);
        this.workers.allowFrom(publicInternet, 7654);
        return this;
    }

    this.exclusive = function() {
        this.masters.place(new LabelRule(true, this.workers));
        return this;
    }

    this.deploy = function(deployment) {
        deployment.deploy(this.masters);
        deployment.deploy(this.workers);
    }
}

exports.setImage = setImage;
exports.Spark = Spark;
