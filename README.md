# ARACHNE

## Generic JavaScript library for the Arachne Bot Framework.

> This is a javascript library to bridge a chat client to the Arachne Brain.

### What is this?

This library will handle threads, hooks and authentication with the Arachne Brain, leaving you the responsality to plug in the interface with your chat client (discord, rocketchat, mattermost, slack ...) only.

See examples of usages with the Adapter-MatterMost and Adapter-Discord repositories.

### Install

- Download this package.
- Require it from any of your project: `const arachne = require('arachne-adapter')`;

### Usage

- Require `const arachne = require('arachne-adapter')` the arachne-adapter module.
- Create an adapter with `const adapter = arachne(options)`.
- Start the adapter with `adapter.start()`.
- Implement the connection with your client. Whenever you receive a message you want to send to the brain, call `adapter.handleMessage(options).then(response => {}).catch(err => {})`. You need to parse the `response` and reply to the message sent by the client.

```javascript
const arachne = require('./../arachne-adapter');

const adapter = arachne({
    brainUrl: (process.env.ARACHNE_URL || "").trim(),
    token: (process.env.ARACHNE_TOKEN || "").trim(),
    mongoURL: (process.env.ARACHNE_MONGO_URL || "").trim(),
    sendMessage: (room, message) => {

    }
});

adapter.start();
```

#### Options

arachne(options)

- `brainUrl` → The URL where to contact the brain.
- `token` → The connector token to reach the brain.
- `mongoURL` → a connection string with a mongo database.
- `sendMessage` → a function that will be called by the adapter to execute hooks. You have to implement the sending of the `message` in the given `room` (specific client parsing, etc...).

sendMessage(options)

- `type` → "command" or "sentence". Command to send a command to the brain. Sentence to ue the natural language support.
- `text` → The text to send to the brain (Do not include any prefix like '!' or '@bot' !)
- `username` → The username of the user that sent the message.
- `room` → To unique name or id of the room where the message was typed.
- `data`→ Additionnal data sent to brain as object: {}. (userName, channel and isPrivate will be overrided).

