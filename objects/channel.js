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
    active: true,
    client: null,
    id: "",
    initialized: false,
    init: function (channel, callback, id, active) {
        this.channelName = channel;
        this.callback = callback;
        this.id = id;
        this.active = active;
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
                    client.on('notification', async function (data) {
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
                        //console.log(l.active);
                        if (l.active) {
                            let response;

                            try {
                                response = await fetch(l.callback, {
                                    method: 'POST',
                                    body: JSON.stringify(payload), //JSON.stringify(eval(data.payload)),
                                    headers: { 'Content-Type': 'application/json' }
                                });
                            } catch (error) {
                                console.log('There was an error', error);
                            }
                            // Uses the 'optional chaining' operator
                            if (response?.ok) {
                                console.log(await response?.json());
                                client.query(`update subscriptions set failcount = 0 where resource_id = '${l.id}'`);
                            } else {
                                var q = client.query(`update subscriptions set failcount = failcount + 1 where resource_id = '${l.id}' returning *`, function (error, result) {
                                    var retVal = 0;
                                    if (!error) {
                                      retVal = result.rows[0].failcount
                                      //res.send(retVal)
                                    }
                                    var maxfail = 3;
                                    maxfail = parseInt(process.env.MAXFAILS, 10)
                                    if (isNaN(maxfail)){ maxfail = 3;}
                                    //console.log(maxfail, retVal);
                                    if (retVal >= maxfail){
                                        l.active = false;
                                        client.query(`update subscriptions set active = false where resource_id = '${l.id}'`);
                                    }
                                    
                                    else {
                                      //res.status(400);
                                      //res.send('Only one subscription per channel per host is allowed.')
                                    }
                                  });
                                console.log(`HTTP Response Code: ${response?.status}`);
                            }
                            /* fetch(l.callback, {
                                method: 'POST',
                                body: JSON.stringify(payload), //JSON.stringify(eval(data.payload)),
                                headers: { 'Content-Type': 'application/json' }
                            }).then(res => res.json())
                                .then(json => console.log(json))
                                .catch(error => console.log(error)); */
                        }
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
                            l.init(result.rows[i].channel, result.rows[i].callback, result.rows[i].resource_id, result.rows[i].active);
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


