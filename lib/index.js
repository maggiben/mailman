'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); ///////////////////////////////////////////////////////////////////////////////
// @file         : index.js                                                  //
// @summary      : Mailman Client Module                                     //
// @version      : 1.0.0                                                     //
// @project      : Fafsa                                                     //
// @description  :                                                           //
// @author       : Benjamin Maggi                                            //
// @email        : benjamin@citizen.co                                       //
// @date         : 30 May 2016                                               //
// ------------------------------------------------------------------------- //
//                                                                           //
// Copyright 2016 Citizen LLC - All rights reserved.                         //
//                                                                           //
///////////////////////////////////////////////////////////////////////////////

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

var _amqplib = require('amqplib');

var _amqplib2 = _interopRequireDefault(_amqplib);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var debug = (0, _debug2.default)('notification:');

var Mailman = function () {

  /**
   * Create a instance of Mailman.
   * @constructor
   */

  function Mailman(config) {
    var _this = this;

    _classCallCheck(this, Mailman);

    this.config = config;
    return new Promise(function (resolve, reject) {
      _amqplib2.default.connect(_this.config.url).then(function (connection) {
        debug('amqp connection ready');
        _this.connection = connection;
        _this.channels = {};
        _this.onConnect(connection).then(function (channels) {
          return resolve(_this);
        });
      }).catch(function (error) {
        debug('error: ', error);
        return reject(error);
      });
    });
  }

  /**
   * AMQP on connection handler.
   * @param {object} connection - the connection object.
   * @constructor
   */


  _createClass(Mailman, [{
    key: 'onConnect',
    value: function onConnect(connection) {
      var _this2 = this;

      return new Promise(function (resolve, reject) {
        var promises = Object.keys(_this2.config.exchanges).map(_this2.getChannel.bind(_this2));
        Promise.all(promises).then(function (channels) {
          return resolve(channels);
        }).catch(function (error) {
          debug('error: ', error);
          return reject(error);
        });
      });
    }

    /**
     * Notification method.
     * @param {any} message - the message to be sent.
     * @param {string} route - the queue routing key.
     * @param {object} options - delivery options.
     */

  }, {
    key: 'notify',
    value: function notify(message, route) {
      var _this3 = this;

      var options = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];

      if (!message || !route) {
        debug('notification rejected, reason: missing arguments');
        return Promise.reject();
      } else if (message instanceof Object) {
        message = JSON.stringify(message);
      }
      debug('notify: ', message, route, options);
      options.timestamp = new Date().getTime();
      var promises = Object.keys(this.channels).map(function (name) {
        return new Promise(function (resolve, reject) {
          _this3.channels[name].publish(name, route, new Buffer(message), options);
          _this3.channels[name].waitForConfirms().then(function () {
            debug('message confirmed');
            return resolve(true);
          }).catch(function (error) {
            debug('error: ', error);
            return reject(error);
          });
        });
      });
      return Promise.all(promises);
    }

    /**
     * Channel factory.
     * @param {string} name - exchange name.
     */

  }, {
    key: 'getChannel',
    value: function getChannel(name) {
      var _this4 = this;

      return new Promise(function (resolve, reject) {
        _this4.connection.createConfirmChannel().then(function (channel) {
          debug(name + ' channel open');
          _this4.channels[name] = channel;
          var options = _this4.config.exchanges[name];
          channel.assertExchange(name, 'topic', options).then(function () {
            debug(name + ' exchange open');
            _this4.channel = channel;
            return resolve(channel);
          }).catch(function (error) {
            debug('error: ', error);
            return reject(error);
          });
        }).catch(function (error) {
          debug('error: ', error);
          return reject(error);
        });
      });
    }
  }]);

  return Mailman;
}();

exports.default = Mailman;