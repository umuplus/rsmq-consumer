var check = require('check-type').init();
var inherits = require('util').inherits;
var nFork = require('nfork');

function Consumer(rsmq, queue) {
    nFork.Cluster.call(this);
    this.rsmq = rsmq;
    this.name = queue;
    this.options.delay = 0;
    this.options.maxDelay = 60000;
    this.options.stepDelay = 100;
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
        self.options.delay = 0;
    } else {
        if (self.options.delay < self.options.maxDelay) {
            self.options.delay += self.options.stepDelay;
        } else {
            self.options.delay = parseInt(self.options.delay / 2);
        }
    }
    if (self.options.delay) {
        setTimeout(function () {
            self.receiveMessage();
        }, self.options.delay);
    } else {
        self.receiveMessage();
    }
};

/**
 * This method manages clustering for consumer
 * @memberof Consumer
 * @method run
 */
Consumer.prototype.run = function () {
    this.setup({keepGoing: true});
    if (nFork.is('master')) {
        this.__master(); // main process
    } else { // child processes
        this.receiveMessage();
    }
};

module.exports = Consumer;
