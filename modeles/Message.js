const mongoose = require('mongoose');

const MessageSchema = mongoose.Schema({
    expediteur: {type: String},
    conetenuExpe: {type: String},
    destinateur: {type: String},
    contenuDest: {type: String},
    // createdAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('Message', MessageSchema);