// permet de remonter les erreurs qu'on n'a pas vue 
// 'use strict';

//Framework express
var express = require('express');
var app = express();

// pour affiche le document ejs, systhème de vue ejs
app.set('view engine', 'ejs');

// permet de lire les fichiers html
var path = require('path');
// enregistrement du formulaire
var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: false }));

//Mode API, pour que REACT récupere les données
var cors = require('cors');
app.use(cors());

//Encodage des mot de passe
const bcrypt = require('bcrypt');

// ***********LES REGLES DE SECURITE***************************
// avec beaucoup de connexions, il permet de ne pas planter la base mongodb
const toobusy = require('toobusy-js');
app.use(function (req, res, next) {
    if (toobusy()) {
        res.status(503).send("serveur trop occupé");
    }
    else {
        next();
    }
});
const session = require("express-session");
const svgcaptcha = require("svg-captcha");
app.use(
    session({
        secret: 'my-secret-key',
        resave: false,
        saveUninitialized: true
    })
)
app.get('/captcha', function (req, res, next) {
    // créer une image svgcaptcha
    const captcha = svgcaptcha.create({
        // pour le disign, taille couleur, trait
        size: 5,
        noise: 3,
    });
    // stock le dans la session
    req.session.captcha = captcha.text;
    res.type('svg');
    res.status(200).send(captcha.data);
})
app.post('/verifycaptcha', function (req, res, next) {
    const { userInput } = req.body;
    if (userInput === req.session.captcha) {
        res.status(200).send('captcha est validé !');
    }
    else {
        res.status(400).send("captcha n'est pas validé !");
    }
})// empêcher la pollution des parametres http
// const hpp = require('hpp');
// app.use(hpp)
// nocache
const nocache = require('nocache');
app.use(nocache());

//Method PUT et DELETE dans le front
const methodOverride = require('method-override');
app.use(methodOverride('_method'))

//Utilisation des cookies :
const cookieParser = require('cookie-parser');
app.use(cookieParser());

//Import JWT
const { createTokens, validateToken } = require('./JWT');

// ********* Le chat *********************
// const http = require('http');
// const socketIO = require('socket.io');

// const socket = require('socket.io');

// const io = socket(server);

// io.on('connection', socket => {
//     console.log("socket=",socket.id);
// });
// const socket = io('localhost:5000');

// socket.on('SERVER_MSG', msg => {
//     setNewMessage(msg);
// });
// io.on('connection', socket => {
//     console.log("socket=",socket.id);
//     socket.on('CLIENT_MSG', data => {
//         console.log("msg=",data);
//         io.emit('SERVER_MSG', data);
//     })
// });
// ************FIN CHAT***********************************

//BDD

require('dotenv').config();
var mongoose = require('mongoose');

//  cacher le mot de passe 
const url = process.env.DATABASE_URL;
// const url = "mongodb+srv://adouguindo:adouguindo1@cluster0.qi2u5nb.mongodb.net/Maison?retryWrites=true&w=majority";
mongoose.connect(url, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(console.log('MongoDB est connecté'))
    .catch(err => console.log(err))

//****************Appel des modèles*******************************
var Paren = require('./modeles/ParentElev');
var Message = require('./modeles/Message');
var Infos = require('./modeles/Infos');
var User = require('./modeles/User');

// pour ajouter des fichiers ou des images
const multer = require('multer')
app.use(express.static('upPhotos'))

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'upPhotos/');
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname)
    }
});
const upPhoto = multer({ storage })

// single pour ajouter une seule image
app.post('/upPhotos', upPhoto.single('image'), (req, res) => {
    if (!req.file) {
        res.status(400).send('No File upPhotos');
    }
    else {
        res.send('File upPhotos successfully')
    }
})

// multiple pour plusieurs image
app.post('/multipleImages', upPhoto.array('images', 5), (req, res) => {
    if (!req.files || req.files.length === 0) {
        res.status(400).send('No File upPhotos');
    }
    else {
        res.send('File upPhotos successfully')
    }
})

// ************************PARENT D'ELEVE*********************************************

app.get("/new", function (req, res) {
    res.render('new_parent');
});

app.post("/submit-parent", function (req, res) {
    console.log(req.body);
    const Data = new Paren({
        nom: req.body.nom,
        prenom: req.body.prenom,
        email: req.body.email,
        roles: req.body.roles,
        sexes: req.body.sexes,
        ecole: req.body.ecole,
        ville: req.body.ville,
        motPasse: bcrypt.hashSync(req.body.motPasse, 0.5),

    });
    Data.save().then(() => {
        console.log("parent ajouter avec succèss")
        res.redirect("http://localhost:3000/allparent")
        
    }).catch(err => console.log(err));
});

app.get('/allparent', function (req, res) {
    Paren.find().then(data => {
        console.log(data);
        res.json(data)
    })
});
app.get('/new_parent', function (req, res) {
    res.render('NewparentElev')
});
app.get('/parent/:id', function (req, res) {
    Paren.findOne({
        _id: req.params.id
    }).then(donnee => {
        res.json(donnee)
    }).catch(err => { console.log(err) });
});

app.put('/contact/edit/:id', function (req, res) {
    const Data = {
        nom: req.body.nom,
        prenom: req.body.prenom,
        email: req.body.email,
        roles: req.body.roles,
        sexes: req.body.sexes,
        ecole: req.body.ecole,
        ville: req.body.ville,
        motPasse: bcrypt.hashSync(req.body.motPasse, 0.5),
    };

    Paren.updateOne({ _id: req.params.id }, { $set: Data })
        .then((result) => {
            console.log(result);
            res.redirect('http://localhost:5000/allparent')
        }).catch((err) => {
            console.log(err);
        });
})
app.delete('/contact/delete/:id', function (req, res) {
    Paren.findOneAndDelete({
        _id: req.params.id,
    }).then(() => {
        console.log("Données supprimées avec succès")
        res.redirect('/allparent');
    }).catch(err => console.log(err));
})

// **************************LES INFOS DE CLASSE********************************
app.get('/new', function (req, res) {
    res.render('new_info')
});
app.post("/submit-info", function (req, res) {
    console.log(req.body);
    const Data = new Infos({
        // titreInfo: req.body.titreInfo,
        contenuInfo: req.body.contenuInfo,
    });
    Data.save().then(() => {
        console.log("infomation ajouter avec succèss")
        res.redirect("http://localhost:3000/allinfo")
    }).catch(err => console.log(err));
});

app.get('/allinfo', function (req, res) {
    Infos.find().then(data => {
        console.log(data);
        res.json(data)
    })
});
app.get('/new_info', function (req, res) {
    res.render('Newinfo')
});
app.get('/info/:id', function (req, res) {
    Infos.findOne({
        _id: req.params.id
    }).then(donnee => {
        res.json(donnee)
    }).catch(err => { console.log(err) });
});

app.put('/info/edit/:id', function (req, res) {
    const Data = {
        // titreInfo: req.body.titreInfo,
        contenuInfo: req.body.contenuInfo,
    };

    Infos.updateOne({ _id: req.params.id }, { $set: Data })
        .then((result) => {
            console.log(result);
            res.redirect('http://localhost:5000/allinfo')
        }).catch((err) => {
            console.log(err);
        });
})
app.delete('/info/delete/:id', function (req, res) {
    Infos.findOneAndDelete({
        _id: req.params.id,
    }).then(() => {
        console.log("Données supprimées avec succès")
        res.redirect('/allinfo');
    }).catch(err => console.log(err));
})

// *******************CONNECTER UN PARENT********************

// Inscription
app.post('/api/signup', function (req, res) {
    const Data = new Paren({
        nom: req.body.nom,
        prenom: req.body.prenom,
        email: req.body.email,
        roles: req.body.roles,
        sexes: req.body.sexes,
        ecole: req.body.ecole,
        ville: req.body.ville,
        motPasse: bcrypt.hashSync(req.body.motPasse, 0.5),
    });

    Data.save().then(() => {
        console.log("utilisateur sauvegardé ! ");
        res.redirect("http://localhost:3000/allparent");
    }).catch(err => { console.log(err) });
})

// affichage du formulaire d'inscription
app.get("/signup", function (req, res) {
    res.render("Signup")
})

// affichage du formulaire de connexion
app.get("/login", function (req, res) {
    res.render("Login")
})

app.post("/api/login", function (req, res) {
    Paren.findOne({
        email: req.body.email,
    })
        .then(paren => {
            console.log(paren);
            if (!paren) {
                res.status(404).send("Aucun utilisateur trouvé");
            }
            if (!bcrypt.compareSync(req.body.motPasse, paren.motPasse)) {
                res.status(404).send("Votre mot de passe est incorrect");
            }
            const accessToken = createTokens(paren);

            res.cookie("accessToken", accessToken, {
                // la validite est pour 30 jours
                maxAge: 1000 * 60 * 60 * 24 * 30,
                httpOnly: true
            });
            // res.json("CONNECTE");
            res.redirect("http://localhost:3000/accueil");
        }).catch(err => console.log(err))
});

//  pour le mettre en format json, le res.render est remplace par res.json
app.get("/", validateToken, function (req, res) {

    Paren.find().then((data) => {
        res.json({ data: data })
    })
})

app.get('/logout', (req, res) => {
    // première méthode, elle supprime totalement
    res.clearCookie("accessToken");
    res.redirect('http://localhost:3000/login');

    // deuxième méthode, elle met la valeur à vide
    // res.cookie("accessToken");
    // res.json("LOG OUT");
});

app.get('/getJWT', function (req, res) {
    res.json(req.cookies.accessToken)
});


// **********************GERER LES ROUTES POUR LE CHAT******************
// app.get('/messages', (req, res) => {
//     // Récupérer tous les messages de la base de données
//     Message.find({}, (err, messages) => {
//         if (err) {
//             console.error('Erreur lors de la récupération des messages :', err);
//             res.status(500).send('Erreur lors de la récupération des messages');
//         } else {
//             res.send(messages);
//         }
//     });
// });

// app.post('/messages', (req, res) => {
//     // Créer un nouveau message avec les données reçues
//     const newMessage = new Message(req.body);

//     // Sauvegarder le message dans la base de données
//     newMessage.save((err) => {
//         if (err) {
//             console.error('Erreur lors de la sauvegarde du message :', err);
//             res.status(500).send('Erreur lors de la sauvegarde du message');
//         } else {
//             // Envoyer le nouveau message à tous les clients connectés
//             io.emit('message', newMessage);
//             res.send(newMessage);
//         }
//     });
// });

// // Configurer le socket.io pour la gestion de la communication en temps réel
// io.on('connection', (socket) => {
//     console.log('Nouvelle connexion :', socket.id);

//     // Gérer l'événement "message" lorsqu'un client envoie un message
//   socket.on('message', (data) => {
//     // Créer un nouveau message avec les données reçues
//     const newMessage = new Message(data);

//     // Sauvegarder le message dans la base de données
//     newMessage.save((err) => {
//         if (err) {
//             console.error('Erreur lors de la sauvegarde du message :', err);
//             res.status(500).send('Erreur lors de la sauvegarde du message');
//         } else {
//             // Envoyer le nouveau message à tous les clients connectés
//             io.emit('message', newMessage);
//         }
//     });
// });
// });





var server = app.listen(5000, function () {
    console.log('Le serveur tourne sur le port 5000');
})
