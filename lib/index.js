'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

var _config = require('config');

var _config2 = _interopRequireDefault(_config);

var _amqplib = require('amqplib');

var _amqplib2 = _interopRequireDefault(_amqplib);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var debug = (0, _debug2.default)('notification:');

var Mailman = function () {
  function Mailman() {
    var _this = this;

    _classCallCheck(this, Mailman);

    return new Promise(function (resolve, reject) {
      _amqplib2.default.connect(_config2.default.get('amqp.url')).then(function (connection) {
        debug('amqp connection ready');
        _this.connection = connection;
        _this.onConnect(connection).then(function (channels) {
          return resolve(_this);
        });
      }).catch(function (error) {
        debug('error: ', error);
        return reject(error);
      });
    });
  }

  _createClass(Mailman, [{
    key: 'onConnect',
    value: function onConnect(connection) {
      var _this2 = this;

      return new Promise(function (resolve, reject) {
        Promise.all([_this2.getChannel('notification')]).then(function (channels) {
          _this2.channels = channels;
          return resolve(channels);
        }).catch(function (error) {
          debug('error: ', error);
          return reject(error);
        });
      });
    }
  }, {
    key: 'notify',
    value: function notify(message) {
      debug('notify: ', message);
      return this.channels[0].publish('notification', 'email.user', new Buffer(message));
    }
  }, {
    key: 'getChannel',
    value: function getChannel(name) {
      var _this3 = this;

      var exchanges = _config2.default.get('amqp.exchanges');
      return new Promise(function (resolve, reject) {
        _this3.connection.createChannel().then(function (channel) {
          debug('amqp channel open');
          var options = exchanges[name];
          channel.assertExchange(name, 'topic', options).then(function () {
            debug('amqp exchange open');
            _this3.channel = channel;
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