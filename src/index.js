///////////////////////////////////////////////////////////////////////////////
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

import Debug from 'debug';
import amqp from 'amqplib';
const debug = Debug('notification:');

export default class Mailman {

  /**
   * Create a instance of Mailman.
   * @constructor
   */
  constructor(config) {
    this.config = config;
    return new Promise((resolve, reject) => {
      amqp.connect(this.config.url).then(connection => {
        debug('amqp connection ready');
        this.connection = connection;
        this.channels = {};
        this.onConnect(connection).then(channels => {
          return resolve(this);
        });
      }).catch(error => {
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
  onConnect(connection) {
    return new Promise((resolve, reject) => {
      let promises = Object.keys(this.config.exchanges).map(this.getChannel.bind(this));
      Promise.all(promises).then(channels => {
        return resolve(channels);
      }).catch(error => {
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
  notify(message, route, options = {}) {
    if(!message || !route) {
      debug('notification rejected, reason: missing arguments');
      return Promise.reject();
    } else if (message instanceof Object) {
      message = JSON.stringify(message);
    }
    debug('notify: ', message, route, options);
    options.timestamp = new Date().getTime();
    let promises = Object.keys(this.channels).map(name => {
      return new Promise((resolve, reject) => {
        this.channels[name].publish(name, route, new Buffer(message), options);
        this.channels[name].waitForConfirms()
        .then(() => {
          debug('message confirmed');
          return resolve(true);
        })
        .catch(error => {
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
  getChannel(name) {
    return new Promise((resolve, reject) => {
      this.connection.createConfirmChannel()
      .then(channel => {
        debug(`${name} channel open`);
        this.channels[name] = channel;
        let options = this.config.exchanges[name];
        channel.assertExchange(name, 'topic', options)
        .then(() => {
          debug(`${name} exchange open`);
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
