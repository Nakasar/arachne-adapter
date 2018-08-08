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
    admins: (process.env.ARACHNE_ADMINS || "").trim().split(","),
    // If you want an api to handle your token,url,admins,hooks,
    // black listed rooms, black listed cmds
    createApi: true,
    // The path your api will have
    pathApi: "/api",
    // Here if you want to enable your api, you need to put an
    // Expressapp parameter ( ie express() object )
    expressApp: app,
    // If you want a dashboard or not, you need to set createApi to 
    // True if you want to enable the dashboard
    dashboard: true,
    // Gestion is the parameter that decide if you want to include
    // Black listed Rooms or/and black listed Cmds in your project
    gestion: "blackListRooms,blackListCmds",
    sendMessage: (room, message) => {

    }
});

// If you enable your api, first start your adapter
adapter.start().then(() => {
    app.use('*', (req, res, next) => {
        return res.sendStatus(404);
    });
    // Then start your express App
    app.listen(YOURPORT, (err) => {
        if (err) {
            console.log("Could not start server !");
            console.log(err);
            throw err;
        }
        console.log('Example app listening on port YOURPORT!');
        
    });
}).catch((err) => {
    console.log("Couldnt start adapter");
});
```

#### Options

arachne(options)

- `brainUrl` → The URL where to contact the brain.
- `token` → The connector token to reach the brain.
- `mongoURL` → a connection string with a mongo database.
- `admins` → An array of admins (usernames).
- `sendMessage` → a function that will be called by the adapter to execute hooks. You have to implement the sending of the `message` in the given `room` (specific client parsing, etc...).
- `createApi` → true if you want to enable an API for your adapter to manage your token, brain url, admins, hooks, black listed rooms, black listed cmds
- `pathApi` → the path your api will be rooted to ( default "/api")
- `expressApp` → An instance of express
- `gestion` → The list of modules you want to enable ( separated by ","), this list is : blackListRooms, blackListCmds

sendMessage(options)

- `type` → "command" or "sentence". Command to send a command to the brain. Sentence to ue the natural language support. Use "admin" to trigger administrative commands on the adapter.
- `text` → The text to send to the brain (Do not include any prefix like '!' or '@bot' !)
- `username` → The username of the user that sent the message.
- `room` → To unique name or id of the room where the message was typed.
- `data`→ Additionnal data sent to brain as object: {}. (userName, channel and isPrivate will be overrided).

