// Chat server
(function() {
    exports.init = function (server) {
        // Instantiate Socket.IO
        var io = require('socket.io');
        io = io.listen(server);

        // Connection
        io.sockets.on('connection', function(socket) {
            // Send welcome message
            socket.emit('welcome', { msg: 'Connected to server' });

            // Incoming message
            socket.on('message', function(data) {
                console.log(data);
                data.msg = data.msg.replace(/</, '&#60');
                data.msg = data.msg.replace(/>/, '&#62');
                socket.emit('echo', data);
                socket.broadcast.emit('message', data);
            });
        });

    };
}());