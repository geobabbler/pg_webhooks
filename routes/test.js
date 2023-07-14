var express = require('express');
var router = express.Router();

router.post('/notify', function(req, res, next) {
    //console.log('notify handler')
    res.type('application/json');
    res.status(200);
    res.send(req.body)
  });

module.exports = router;