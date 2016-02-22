var Consumer = require('../index');
var RedisSMQ = require('rsmq');

var $consumer = new Consumer(new RedisSMQ({host: '127.0.0.1', port: 6379, ns: 'rsmq'}), 'rsmq');
$consumer.addJob('test', function (request, job, done) {
    console.log(request);
    console.log(job);
    done(); // use done('error description') if you don't want to delete received message
});

$consumer.run();
