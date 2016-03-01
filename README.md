# rsmq-consumer

Helper to build easy-to-use and cluster-enabled consumers for Redis Simple Message Queue (RSMQ)  

## install

$ npm install rsmq-consumer

## usage

To create an instance you should provide your own RSMQ client and name of your queue.
If you want to delete received message after processing call **done** method without parameters. 
Otherwise, provide a reason like *done('connection failed')* 

```javascript

var $consumer = new Consumer(new RedisSMQ({host: '127.0.0.1', port: 6379, ns: 'rsmq'}), 'rsmq');
$consumer.addJob('test', function (request, job, done) {
    console.log(request);
    console.log(job);
    done(); // use done('error description') if you don't want to delete received message
});

$consumer.run();

```

Please see **push.js** under **example** folder to see how to send jobs. 

## todo

- provide better docs for creating handlers and pushing jobs
- provide stats for error and success responses
