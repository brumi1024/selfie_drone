module.exports = (io) => {
    const express = require('express');

    const router = express.Router();
    const droneManager = require('../drone-manager/ardrone')(io);
    const gdrive = require('../gdrive/gdrive');
    const bodyParser = require('body-parser').json({limit: '50mb'});
    const fs = require('fs');

    router.use(express.json({limit: '50mb'}));
    router.use(express.urlencoded({limit: '50mb', extended: true}));

    router.post('/api/uploadimage', bodyParser, (req, res) => {
        let payloadString = '';
        req.on('data', (chunk) => {
            payloadString += chunk.toString();
        });
        req.on('end', () => {
            const base64Data = payloadString.replace(/^data:image\/png;base64,/, "");
            const photoName = 'photo' + Date.now() + '.png'
            fs.writeFile('pictures/' + photoName, base64Data, 'base64', (err) => {
                if (err){
                    console.log(err);
                }
                gdrive.uploadToFolder(photoName).then((imageUrl) => {
                    res.send(imageUrl);
                });
            });
            
        });
        
    });   

    return router;
};
