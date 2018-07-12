const MongoClient = require('mongodb').MongoClient;

let db = {};

module.exports = {
    database : () => {
        return db;
    },
    connect : (mongoURL) => {
        return new Promise((resolve, reject) => {
            MongoClient.connect(mongoURL, { useNewUrlParser: true }, (err,_db) => {
                if(err) return reject(err);
                db = _db.db();
                return resolve(db);
            });
        })
        
    }
}