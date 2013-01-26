(function() {
    var Chat = {};

    var append = function (str) {
        var chatLog = $('.chat').html();
        $('.chat').html(chatLog + str);
    };

    var send = function () {
        var user = $('.form > input[name="user"]').val();
        var input = $('.form > input[name="text"]');
        var msg = input.val();
        Chat.socket.emit('message', { msg: msg, user: user });
        input.val('');
    }

    // Socket init and handling
    Chat.socket = io.connect('http://localhost/');
    Chat.socket.once('welcome', function(data) {
        append(data.msg + '</br>');
    });
    Chat.socket.on('message', function(data) {
        append(data.user + ': ' + data.msg + '</br>');
    });
    Chat.socket.on('echo', function(data) {
        append("Me: " + data.msg + '</br>');
    });


    // Set HTML event handlers.
    // Send button
    $('.form > button').on('click', send);
    // Enter button, when enterng text
    $('.form > input[name="text"]').on('keypress', function(key) {
        if (key.which === 13) { send(); }
    });

}) ();
