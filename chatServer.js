// Chat server
(function() {
    var users = { nUsers: 0 };
    var nUsers = 0;

    exports.init = function (server) {
        // Instantiate Socket.IO
        var io = require('socket.io');
        io = io.listen(server);
        io.set('log level', 1);

        // Connection
        io.sockets.on('connection', function(socket) {
            msgConn(socket);
        });
    };

    // Handle connection message.
    var msgConn = function(socket) {

        // Save connection parameters
        var addr = socket.handshake.address.address + ":"
            + socket.handshake.address.port;
        socket.set('addr', addr);
        console.log("Connection from " + addr);

        // Send welcome message
        socket.emit('welcome', { msg: 'Connected to server',
                                 online: nUsers });

        // Set function handlers.
        socket.on('id', function(data) {
            msgID(data, socket);
        });


        // Incoming message
        socket.on('message', function(data) {
            console.log(data);
            data.msg = data.msg.replace(/</, '&#60');
            data.msg = data.msg.replace(/>/, '&#62');
            socket.get('key', function(err, key) {
                data.user = users[key].name;
                socket.emit('echo', data);
                socket.broadcast.emit('message', data);
            });
        });

        // Disconnect
        socket.on('disconnect', function() {
            msgDisc(socket);
        });
    };

    // Handle ID message.
    var msgID = function (data, socket) {
        var key = data.user;

        console.log('ID: ' + key);

        // If this is new log on, initialize.
        if (users.hasOwnProperty(key) === false)
        {
            users.nUsers++;
            users[key] = { name: data.user,
                           instances: 0 };

            // Acknowledge ID message.
            data.online = users.nUsers;
            socket.broadcast.emit('enter', data);

            console.log('New connection: ' + users.nUsers + ' users');
        }
        // Record of previous log on exists.
        else
        {
            // If user has a pending timeout, then user
            // was very recently logged on. Cancel the
            // timeout and don't issue an "enter" message.
            if (users[key].hasOwnProperty('timeout'))
            {
                clearTimeout(users[key].timeout)
                delete users[key].timeout;
                console.log('Reconnection');
            }
            else
            {
                console.log('Duplicate logon');
            }
        }

        data.online = users.nUsers;
        socket.emit('accepted', data);
        socket.set('key', key);
        incrInstance(key);
    };

    // Handle disconnect message
    var msgDisc = function (socket) {
        socket.get('key', function(err, key) {
            // If no disconnect message is pending
            // send it after 5 seconds.
            if (!users[key].hasOwnProperty('timeout'))
            {
                var cb = function() {
                    socket.broadcast.emit('disconnect',
                                          { user: users[key].name,
                                            online: users.nUsers });
                    delete users[key].timeout;
                    if (decrInstance(key) == 0)
                    {
                        delete users[key];
                        users.nUsers--;
                        console.log("User " + key + " left. "
                                    + users.nUsers + " user(s) online.");
                    }
                };
                users[key].timeout = setTimeout(cb, 5000);
            }
        });
    };

    // Increment a user's logon count.
    var incrInstance = function (key) {
        users[key].instances++;
        console.log(key + ': ' + users[key].instances + ' instance(s)');
        return users[key].instances;
    };

    // Decrement a user's logon count.
    var decrInstance = function (key) {
        users[key].instances--;
        console.log(key + ': ' + users[key].instances + ' instance(s)');
        return users[key].instances;
    };
}());