/**
 * Module dependencies.
 */

var EventEmitter = require('events').EventEmitter;
var util = require('util');
var gcm = require('node-gcm');
var _ = require('lodash');

/**
 * Expose module.
 */

module.exports = Sender;

/**
 * Create a new GCM sender.
 *
 * @param {string} options.apiKey
 * @param {number} options.retries
 */

function Sender(options) {
  EventEmitter.call(this);
  _.extend(this, options);
}

util.inherits(Sender, EventEmitter);

/**
 * Send a notification.
 *
 * @param {object} data
 * @see https://github.com/ToothlessGear/node-gcm
 */

Sender.prototype.send = function (data) {
  var sender = this;
  this.gcmSender = this.gcmSender || this.createGcmSender();

  // Registration id can be string or array.
  if (! _.isArray(data.registrationId)) data.registrationId = [data.registrationId];

  // Create GCM message.
  var message = new gcm.Message(_.omit(data, 'registrationId'));

  this.gcmSender.send(message, data.registrationId, this.retries, function (err, res) {
    if (err) return _.each(data.registrationId, function (registrationId) {
        sender.emit('transmissionError', err, registrationId);
      });

    _.each(res.results, function (result, index) {
      if (result.error)
        return sender.emit('transmissionError', result.error, data.registrationId[index]);

      if (result.registration_id)
        this.emit('updated', result, data.registrationId[index]);

      this.emit('transmitted', result, data.registrationId[index]);
    });
  });
};

/**
 * Create a new GCM sender.
 *
 * @returns {gcm.Sender}
 */

Sender.prototype.createGcmSender = function () {
  return new gcm.Sender(this.apiKey);
};