var pg = require('pg');
var dotenv = require('dotenv').config();
const fetch = require('node-fetch');
//const { listen } = require('../app');

const Channel = {
    name: "none", // Default value of properties
    listeners: [],
    init: function (channel) {
        // Method which will display type of Animal
        this.channel = channel.toLowerCase();
        // var l = Object.create(Listener);
        // l.init(channel, 'http://localhost:3000/test/notify', 'a1234');
        // l.watch();
        // this.listeners.push(l);
        loadChannelListeners(this);
    },
};

const Listener = {
    channelName: "",
    callback: "",
    connected: false,
    client: null,
    id: "",
    initialized: false,
    init: function (channel, callback, id) {
        this.channelName = channel;
        this.callback = callback;
        this.id = id;
        this.initialized = true;
        //console.log(this.channelName);
    },
    watch: function () {
        if (this.initialized) {
            var client = new pg.Client({
                user: process.env.PGUSER,
                host: process.env.PGSERVER,
                database: process.env.PGDATABASE,
                password: process.env.PGPASS,
                port: 5432,
            });
            var l = this;
            //console.log(client);
            client.connect(function (err) {
                if (err) {
                    l.connected = false;
                }
                else {
                    l.connected = true;
                    //console.log(this)
                    //console.log(`LISTEN "${l.channelName}"`)
                    client.query(`LISTEN "${l.channelName}"`)
                    client.on('notification', function (data) {
                        //console.log(data.payload);
                        var o = null;
                        var payload = null;
                        try {
                            o = JSON.parse(data.payload);
                            payload = { payload: o }
                        }
                        catch (e) {
                            //console.log(e)
                            payload = { payload: data.payload }
                        }
                        //console.log(payload);
                        fetch(l.callback, {
                            method: 'POST',
                            body: JSON.stringify(payload), //JSON.stringify(eval(data.payload)),
                            headers: { 'Content-Type': 'application/json' }
                        }).then(res => res.json())
                            .then(json => console.log(json));
                    });
                    this.client = client;
                    //console.log('-----------------------------------------')
                    //console.log(this.client)
                }
            });

        }
    }
}

function loadChannelListeners(channel) {
    var client = new pg.Client({
        user: process.env.PGUSER,
        host: process.env.PGSERVER,
        database: process.env.PGDATABASE,
        password: process.env.PGPASS,
        port: 5432,
    });
    client.connect(function (err) {
        if (err) {
            //l.connected = false;
        }
        else {
            var queryString = `select * from subscriptions where channel = '${channel.channel}';`
            var query = client.query(queryString, function (error, result) {
                if (!error) {
                    for (i in result.rows) {
                        if (result.rows[i].active) {
                            var l = Object.create(Listener);
                            l.init(result.rows[i].channel, result.rows[i].callback, result.rows[i].resource_id);
                            //console.log(l)
                            l.watch();
                            channel.listeners.push(l);
                        }
                    }
                }
                else {

                }
            });
            //console.log('-----------------------------------------')
            //console.log(this.client)
        }
    });

}

exports.Channel = Channel;
exports.Listener = Listener;
  // Create new channel type called channel
  //const channel1 = Object.create(Channel);


