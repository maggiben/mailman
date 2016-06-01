# Mailman client
 
Client for Citizen Mailman service.
Allow a an application to pubish messages to queues.

## Install
The implementer should include this dependency in their project `package.json` file:
`"mailman-cli": "git+ssh://git@bitbucket.org/citizenco/mailman-cli"`

## Usage
``` 
import config from 'config'
import Mailman from 'mailman-cli'

let mailmanInstance = new Mailman(config.get('mailman'));
mailmanInstance.then(function(mailman) {
  mailman.notify(message, routingKey, messageOptions).then(function(response) {
    debug('success: ', response);
  })
  .catch(function(error) {
    debug('error: ', erro);
  });
});
```
* `message` JSON message to be sent to the queue (see examples)
* `routingKey` A route to send the meesage to
* `messageOptions` Delivery options (can be optional)
 
The service call will return a promise which the implementer can use to determine the delivery status (fail or success)

## Configuring
In your `config.json` you must define the exchanges to be used by this service `notification` being the primary exchange for the purpose of this module.

The `email` topic will process all messages routed to it and deliver an email template though our service provider, all topics have a `routingKey` in this case is `email.*` 
```
"mailman": {
    "url": "amqp://admin:Citizen2015@54.152.225.121:5672",
    "exchanges": {
      "notification": {
        "type": "topic",
        "durable": true,
        "autoDelete": false,
        "confirm": true,
        "topics": {
          "email": {
            "durable": true,
            "autoDelete": false,
            "routes": [{
              "pattern": "email.*",
              "ack": true,
              "durable": true,
              "autoDelete": false,
              "prefetchCount": 10,
              "routingKeyInPayload": true
            }]
          }
        }
      }
    }
  }
```
## Valid message example:
```
{
  "template_name": "CitizenConfirmation",
  "message": {
    "to": [{
      "email": "benjamin@citizen.co",
      "name": "Benjamin",
      "type": "to"
    }],
    "subject": "Citizen - Registration email confirmation",
    "global_merge_vars": [{
      "name": "APPLICANT_FIRSTNAME",
      "content": "Benjamin"
    }, {
      "name": "SUBJECT",
      "content": "Citizen - Registration email confirmation"
    }, {
      "name": "SITUATIONAL_TEXT",
      "content": "You recently created a Citizen account. Please confirm your email by clicking on the button below."
    }, {
      "name": "BUTTON_LINK",
      "content": "https://citizen.co/users/dashboard"
    }, {
      "name": "COMPANY_NAME",
      "content": "Citizen"
    }, {
      "name": "COMPANY_ADDRESS",
      "content": "2800 Biscayne Blvd, STE 200 - Miami, FL 33137"
    }]
  }
}
```