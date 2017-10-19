const {PortRange, publicInternet, createDeployment, Machine, Range, githubKeys, LabelRule, MachineRule} = require("@quilt/quilt");
const utils = require('./utils.js');

var Redis = require("./redis.js");
var Kafka = require("./kafka.js");
var SparkStreaming = require("./spark.js");
var SendKafka = require("./spark_streaming.js");

send_events_instance = 'c4.xlarge';
worker_instance = 'm4.large';

var namespace = createDeployment({namespace:"mchang6137-kafka"});
var baseMachine = new Machine({
    size: worker_instance,
    provider: "Amazon",
});

var generatorMachine = new Machine({
    size: send_events_instance,
    provider: "Amazon",
});

utils.addSshKey(baseMachine)
utils.addSshKey(generatorMachine)

namespace.deploy(baseMachine.asMaster());
namespace.deploy(baseMachine.asWorker().replicate(8));

var send_events = new SendKafka(1);
var redis = new Redis(1, 'no_pass');
var kafka = new Kafka(1);
var spark = new SparkStreaming.Spark(1, 4)

send_events.placeOn({size: send_events_instance});
redis.placeOn({size: worker_instance});
kafka.placeOn({size: worker_instance});
spark.placeOn({size: worker_instance});

spark.debug();
spark.exposeUIToPublic();
kafka.debug();
redis.debug();
send_events.debug()

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



