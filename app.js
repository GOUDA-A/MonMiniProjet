var express = require('express');
var app = express();

var server = app.listen(5000, function(){
    console.log("le serveur de nœud s'exécute sur le port");
});

  // lire les fichiers html
  var path = require('path');  
  // enregistre le formulaire  
  var bodyparser = require("body-parser"); 
  app.use(bodyparser.urlencoded({ extended: false }));


  // mode api; pour que react recupère les données
  var cors = require("cors");
  app.use(cors()); 
  
  // encodage des mot de passer
  const bcrypt = require('bcrypt');

  // methode put et delete dans front
  const methodOverride = require('method-override');
  app.use(methodOverride("_method"));
  

  // pour affiche le document ejs, systhème de vue ejs
  app.set('view engine', 'ejs');

  // utilisation des cookies
  const cookieParser = require('cookie-parser');
  app.use(cookieParser());
  
  // import JWT
  const {createTokens, validateToken} = require('./JWT');

  // Base De Données
  require("dotenv").config();    
  var mongoose = require('mongoose');

  const url = process.env.DATABASE_URL;
//  cacher le mot de passe 
        // const url = "mongodb+srv://https://cloud.mongodb.com/v2/645e4be8788ae2692374b9b0#/clusters?fastPoll=true"
            mongoose.connect(url, {
                useNewUrlParser: true,
                useUnifiedTopology: true,
            }).then(console.log("MongoDB est connecté"))
                .catch(err => console.log(err))