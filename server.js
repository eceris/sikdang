var WebSocketServer = require('websocket').server;

var http = require('http');
var url = require('url');
var ROOT_DIR = "./";
var fs = require('fs');

var server = http.createServer(function(request, response) {
    console.log((new Date()) + ' Received request for ' + request.url);
    // Url {
    //     protocol: null,
    //         slashes: null,
    //         auth: null,
    //         host: null,
    //         port: null,
    //         hostname: null,
    //         hash: null,
    //         search: '?name=ryan',
    //         query: 'name=ryan',
    //         pathname: '/status',
    //         path: '/status?name=ryan',
    //         href: '/status?name=ryan' }

    var parsed = url.parse(request.url, true);

    if (parsed.pathname.indexOf('leader') > 0) {
        var identifier = new Date().getTime();
        response.setHeader('Set-Cookie', ['LEADERID=' + identifier]);
        htmlForLeader(response);
    } else if (parsed.pathname.indexOf('guest') > 0) {
        response.setHeader('Set-Cookie', ['GUESTID=' + parsed.query.id]);
        htmlForGuest(response);
    } else {
        response.writeHead(404);
        response.end();
    }
});

var htmlForLeader = function(response) {
    fs.readFile(ROOT_DIR + '/leader.html',function (err,data) {
        if (err) {
            response.writeHead(404);
            response.end(JSON.stringify(err));
            return;
        }
        response.writeHead(200);
        response.end(data);
    });
};

var htmlForGuest = function(response) {
    fs.readFile(ROOT_DIR + '/guest.html',function (err,data) {
        if (err) {
            response.writeHead(404);
            response.end(JSON.stringify(err));
            return;
        }
        response.writeHead(200);
        response.end(data);
    });
};

server.listen(8080, function() {
    console.log((new Date()) + ' Server is listening on port 8080');

});





//////////////////////////////////////////////////ws part///////////////////////////////////////////
wsServer = new WebSocketServer({
    httpServer: server,
    autoAcceptConnections: false
});

function originIsAllowed(origin) {
    return true;
}
wsServer.on('request', function(request) {
    if (!originIsAllowed(request.origin)) { // Make sure we only accept requests from an allowed origin request.reject();
        console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
        return;
    }
    var connection = request.accept(null, request.origin);
    console.log((new Date()) + ' Connection accepted.');
    connection.on('message', function(message) {
        if (message.type === 'utf8') {
            console.log('Received Message: ' + message.utf8Data);
            debugger;
            var msg = JSON.parse(message.utf8Data);
            // send message to client
            connection.sendUTF(JSON.stringify({
                id: msg.id,
                event : null,
                message : 'Hi client, I have got a message from you : ' + msg.message
            }));
        } else if (message.type === 'binary') {
            console.log('Received Binary Message of ' + message.binaryData.length + ' bytes');
            connection.sendBytes(message.binaryData);
        }
    });
    connection.on('close', function(reasonCode, description) {
        console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
    });
});
//////////////////////////////////////////////////ws part///////////////////////////////////////////