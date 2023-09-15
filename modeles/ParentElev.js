const mongoose = require('mongoose');

const ParenSchema = mongoose.Schema({
    nom: { type: String, required: true },
    prenom: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    roles: { type: String },
    sexes: { type: String },
    ecole: { type: String },
    ville: { type: String },
    motPasse: { type: String, required: true },

});
module.exports = mongoose.model('Paren', ParenSchema);