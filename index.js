var check = require('check-type').init();
var inherits = require('util').inherits;
var nFork = require('nfork');

function Consumer(rsmq, queue) {
    nFork.Cluster.call(this);
    this.options.debug = true;
    this.rsmq = rsmq;
    this.name = queue;
    this.delay = 0;
    this.maxDelay = 60000; // TODO: make parameters
    this.stepDelay = 100; // TODO: make parameters
    this.jobs = {};
}

inherits(Consumer, nFork.Cluster);

Consumer.prototype.addJob = function (job, handler) {
    if (check(handler).is('function')) {
        this.jobs[job] = handler;
    }
};

Consumer.prototype.receiveMessage = function () {
    var self = this;
    self.rsmq.receiveMessage({qname: self.name}, function (error, message) {
        if (message && message.id) {
            try {
                var request = JSON.parse(message.message);
                if (self.jobs.hasOwnProperty(request.j)) {
                    delete message.message; // get rid of our touches for message delivery
                    self.jobs[request.j](request.d, message, function (error) {
                        if (!error) {
                            self.deleteMessage(message);
                        } else {
                            self.next(message);
                        }
                    });
                } else {
                    self.next(message);
                }
            } catch (e) {
                self.deleteMessage(message);
            }
        } else {
            self.next();
        }
    });
};

Consumer.prototype.deleteMessage = function (message) {
    var self = this;
    self.rsmq.deleteMessage({qname: self.name, id: message.id}, function () {
        self.next(message);
    });
};

Consumer.prototype.next = function (message) {
    var self = this;
    if (message && message.id) {
        self.delay = 0;
    } else {
        if (self.delay < self.maxDelay) {
            self.delay += self.stepDelay;
        } else {
            self.delay = parseInt(self.delay / 2);
        }
    }
    if (self.delay) {
        setTimeout(function () {
            self.receiveMessage();
        }, self.delay);
    } else {
        self.receiveMessage();
    }
};

/**
 * This method manages clustering for consumer
 * @memberof Socket
 * @method run
 */
Consumer.prototype.run = function () {
    if (nFork.is('master')) {
        this.__master(); // main process
    } else { // child processes
        this.receiveMessage();
    }
};

module.exports = Consumer;
