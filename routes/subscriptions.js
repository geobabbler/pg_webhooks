var express = require('express');
var router = express.Router();
var pg = require('pg');
//import { Pool, Client } from 'pg';
var dotenv = require('dotenv').config();
const URL = require("url").URL;
const url = require("url");

var env = process.env.NODE_ENV || 'development';

//var dbUrl = 'tcp://postgres:psw@localhost:5432/test-db';

const stringIsAValidUrl = (s) => {
  try {
    var ss = new URL(s.toLowerCase());
    var protocols = [];
    if (env === 'development') {
      protocols = ['http:', 'https:'];
    }
    else{
      protocols = ['https:'];
    }
    return protocols.includes(ss.protocol);
  } catch (err) {
    return false;
  }
};


/* subscribe to a channel */
router.post('/add', async function (req, res, next) {
  res.type('application/json');
  var obj
  try {
    obj = eval(req.body);
    if (obj.channel && obj.callback) {
      if (stringIsAValidUrl(obj.callback)) {
        urlhost = new URL(obj.callback).host.toLowerCase();
        const client = new pg.Client({
          user: process.env.PGUSER,
          host: process.env.PGSERVER,
          database: process.env.PGDATABASE,
          password: process.env.PGPASS,
          port: 5432,
        })
        await client.connect();
        var queryString = `INSERT INTO public.subscriptions (channel, callback, host) VALUES('${obj.channel.toLowerCase()}', '${obj.callback.toLowerCase()}', '${urlhost}') returning *;`
        var query = client.query(queryString, function (error, result) {
          if (!error) {
            var retVal = { "subscription_id": result.rows[0].resource_id }
            res.send(retVal)
          }
          else {
            res.status(400);
            res.send('Only one subscription per channel per host is allowed.')
          }
        });
      }
      else {
        res.status(400);
        res.send('Callback is not a valid url');
      }
    }
    else {
      res.status(400);
      res.send('Channel not specified')
    }
  }
  catch (e) {
    res.status(400);
    res.send("Content does not appear to be valid JSON")
  }
});

/* unsubscribe from a channel */
router.post('/remove', function (req, res, next) {
  const id = req.query.id;
  res.type('application/json');
  var client = new pg.Client({
    user: process.env.PGUSER,
    host: process.env.PGSERVER,
    database: process.env.PGDATABASE,
    password: process.env.PGPASS,
    port: 5432,
  });
  client.connect(function (err) {
    if (!err) {
      var queryString = `delete from subscriptions where resource_id = '${id}';`;
      var query = client.query(queryString, function (error, result) {
        if (!error) {
          res.status(200);
          res.send({ status: "OK", message: "Unsubscribe successful." });
        }
        else {
          res.status(401);
          res.send({ status: "Error", message: "Unsubscribe not successful." });
        }
      });
    }
    else {
      res.status(501);
      res.send({ status: "Error", message: "Unknown error occurred." });
    }
  });
});

module.exports = router;
