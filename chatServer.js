// Chat server
(function() {
    exports.init = function (server) {
        // Instantiate Socket.IO
        var io = require('socket.io');
        io = io.listen(server);

        var users = {};
        var nUsers = 0;

        // Connection
        io.sockets.on('connection', function(socket) {
            // Send welcome message
            socket.emit('welcome', { msg: 'Connected to server',
                                     online: nUsers });

            // Enter chat notice
            socket.on('id', function(data) {
                data.online = nUsers;

                // If user has a pending timeout, then user
                // was very recently logged on. Cancel the
                // timeout and don't issue an "enter" message.
                if (users[data.user])
                {
                    clearTimeout(users[data.user])
                }
                else
                {
                    nUsers++;
                    data.online++;
                    socket.broadcast.emit('enter', data);
                    console.log("User " + data.user + " joined. "
                                + nUsers + " user(s) online.");
                }
                socket.emit('accepted', data);
                socket.set('name', data.user);
                delete(users[data.user]);
            });

            // Incoming message
            socket.on('message', function(data) {
                console.log(data);
                data.msg = data.msg.replace(/</, '&#60');
                data.msg = data.msg.replace(/>/, '&#62');
                socket.get('name', function(err, name) {
                    data.user = name;
                    socket.emit('echo', data);
                    socket.broadcast.emit('message', data);
                });
            });

            // Disconnect
            socket.on('disconnect', function() {
                socket.get('name', function(err, name) {
                    // If no disconnect message is pending
                    // send it after 5 seconds.
                    if (!users[name])
                    {
                        var discMsg = function() {
                            nUsers--;
                            var data = { user: name, online: nUsers };
                            socket.broadcast.emit('disconnect', data);

                            delete users[name];
                            console.log("User " + name + " left. "
                                        + nUsers + " user(s) online.");
                        };
                        users[name] = setTimeout(discMsg, 5000);
                    }
                });
            });
        });

    };
}());