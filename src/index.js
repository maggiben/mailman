import Debug from 'debug';
import config from 'config';
import amqp from 'amqplib';

const debug = Debug('notification:');

export default class Mailman {

  constructor() {
    return new Promise((resolve, reject) => {
      amqp.connect(config.get('amqp.url')).then(connection => {
        debug('amqp connection ready');
        this.connection = connection;
        this.onConnect(connection).then(channels => {
          return resolve(this);
        });
      }).catch(error => {
        debug('error: ', error);
        return reject(error);
      });
    });
  }

  onConnect(connection) {
    return new Promise((resolve, reject) => {
      Promise.all([this.getChannel('notification')]).then(channels => {
        this.channels = channels;
        return resolve(channels);
      }).catch(error => {
        debug('error: ', error);
        return reject(error);
      });
    });
  }

  notify(message) {
    debug('notify: ', message);
    return this.channels[0].publish('notification', 'email.user', new Buffer(message));
  }

  getChannel(name) {
    let exchanges = config.get('amqp.exchanges');
    return new Promise((resolve, reject) => {
      this.connection.createChannel()
      .then(channel => {
        debug('amqp channel open');
        let options = exchanges[name];
        channel.assertExchange(name, 'topic', options)
        .then(() => {
          debug('amqp exchange open');
          this.channel = channel;
          return resolve(channel);
        })
        .catch(error => {
          debug('error: ', error);
          return reject(error);
        });
      })
      .catch(error => {
        debug('error: ', error);
        return reject(error);
      });
    });
  }
}
