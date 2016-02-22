var RedisSMQ = require('rsmq');

var $rsmq = new RedisSMQ({host: '127.0.0.1', port: 6379, ns: 'rsmq'});
$rsmq.createQueue({qname: 'rsmq'}, function (error, status) {
    if (status === 1 || error.name === 'queueExists') {
        $rsmq.sendMessage({
            qname: 'rsmq',
            message: JSON.stringify({j: 'test', d: {a: Date.now()}})
        }, function (error) {
        });
    } else {
        console.log(error);
    }
});
