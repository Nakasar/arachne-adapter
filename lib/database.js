const MongoClient = require('mongodb').MongoClient;

let db = {};

module.exports = {
    database: () => {
        return db;
    },
    connect: (mongoURL) => {
        return new Promise((resolve, reject) => {
            MongoClient.connect(mongoURL, {
                useNewUrlParser: true,
                server: {
                    reconnectTries: Number.MAX_VALUE,
                    autoReconnect: true,
                    reconnectInterval: 1000,
                }
            }, (err, _db) => {
                if (err) return reject(err);
                db = _db.db();
                return resolve(db);
            });
        })

    }
}