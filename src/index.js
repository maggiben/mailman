//var config = require('config');
//var amqp = require('amqplib');
import config from 'config';
import amqp from 'amqplib';

export default class Mailman {

  constructor() {
    amqp.connect(config.get('amqp.url')).then(this.onConnect).catch(this.onError);
  }

  onConnect(connection) {
    this.connection = connection;
    Promise.all([this.getChannel('notification')]).then(subscribers => {
      console.log('subscribers: ', subscribers);
    }).catch(this.onError);
  }

  onError(error) {
    console.log(error);
  }

  notify() {

  }

  getChannel(name) {
    let exchanges = config.get('amqp.exchanges');
    return new Promise((resolve, reject) => {
      connection.createChannel().then(channel => {
        //channel.assertExchange(name, 'topic', exchanges[name])
        channel.assertExchange(name, 'topic', {
          durable: true
        })
        .then(() => {
          this.channel = channel;
          return resolve(channel);
        })
        .catch(reject);
      })
      .catch(reject);
    });
  }

  percent({percent = 100, amount}) {
    const percentOff = (percent / 100) * amount;
    return percentOff;
  }
}
