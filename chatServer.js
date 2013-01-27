// Chat server
(function() {
    exports.init = function (server) {
        // Instantiate Socket.IO
        var io = require('socket.io');
        io = io.listen(server);

        var users = {};

        // Connection
        io.sockets.on('connection', function(socket) {
            // Send welcome message
            socket.emit('welcome', { msg: 'Connected to server' });

            // Enter chat notice
            socket.on('id', function(data) {
                console.log("User " + data.user + " joined");
                // If user has a pending timeout, then user
                // was very recently logged on. Cancel the
                // timeout and don't issue an "enter" message.
                if (users[data.user])
                {
                    clearTimeout(users[data.user])
                }
                else
                {
                    socket.broadcast.emit('enter', data);
                }
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
                            var data = { user: name };
                            socket.broadcast.emit('disconnect', data);
                            delete users[data.user];
                        };
                        users[name] = setTimeout(discMsg, 5000);
                    }
                });
            });
        });

    };
}());