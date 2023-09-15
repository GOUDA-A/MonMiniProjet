const { mongoose } = require("mongoose");

const InfosSchema = mongoose.Schema({
    // titreInfo: {type:String},
    contenuInfo: {type:String},
})
module.exports = mongoose.model('Infos', InfosSchema); 