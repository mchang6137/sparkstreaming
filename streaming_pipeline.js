const {PortRange, publicInternet, createDeployment, Machine, Range, githubKeys, LabelRule, MachineRule, Container} = require("@quilt/quilt");

const utils = require('./utils.js');
var Redis = require("./redis.js");
var Kafka = require("./kafka.js");
var SparkStreaming = require("./spark.js");
var SendKafka = require("./spark_streaming.js");

send_events_instance = 'c4.xlarge';
worker_instance = 'm4.large';

var namespace = createDeployment({namespace:"mchang6137-streaming252a"});
var baseMachine = new Machine({
    size: worker_instance,
    region: 'us-west-1',
    provider: "Amazon",
});

var generatorMachine = new Machine({
    size: send_events_instance,
    region: 'us-west-1',
    provider: "Amazon",
});

utils.addSshKey(baseMachine)
utils.addSshKey(generatorMachine)

num_senders = 2
namespace.deploy(baseMachine.asMaster());
namespace.deploy(generatorMachine.asWorker().replicate(num_senders));
namespace.deploy(baseMachine.asWorker().replicate(5));

var send_events = new SendKafka(num_senders);
var redis = new Redis(1, 'no_pass');
var kafka = new Kafka(2);
var spark = new SparkStreaming.Spark(1, 4)

for (var index=0; index < send_events._members.length; index++) {
    send_event_c = send_events._members[index];
    send_event_c.placeOn({size: send_events_instance});
}

redis.master.placeOn({size: worker_instance});

for (var index=0; index < redis.workers.length; index++) {
    redis.workers[index].placeOn({size: worker_instance});
}

for (var index=0; index < kafka._members.length; index++) {
    kafka._members[index].placeOn({size: worker_instance});
}

for (var index=0; index < spark.masters.length; index++) {
    spark.masters[index].placeOn({size: worker_instance});
}

for (var index=0; index < spark.workers.length; index++) {
    spark.workers[index].placeOn({size: worker_instance});
}

//spark.debug();
spark.exposeUIToPublic();
//kafka.debug();
//redis.debug();
//send_events.debug()

//Open up all ports between the containers
spark.connect(new PortRange(1, 65535), redis);
spark.connect(new PortRange(1, 65535), kafka);

kafka.connect(new PortRange(1, 65535), spark);
kafka.connect(new PortRange(1, 65535), redis);

redis.connect(new PortRange(1, 65535), spark);
redis.connect(new PortRange(1, 65535), kafka);

send_events.connect(new PortRange(1, 65535), redis);
send_events.connect(new PortRange(1, 65535), kafka);
send_events.connect(new PortRange(1, 65535), spark);

namespace.deploy(kafka);
namespace.deploy(redis);
namespace.deploy(spark);
namespace.deploy(send_events);



