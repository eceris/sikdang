var WebSocketServer = require('websocket').server;
var http = require('http');
 
var clients = [];
// 임의로 ID부여하기 위함
var idlist = [];
var id = 0;




 
var server = http.createServer(function(request, response) {
    console.log((new Date()) + ' Received request for ' + request.url);
    response.writeHead(404);
    response.end();
});
server.listen(8080, function() {
    console.log((new Date()) + ' Server is listening on port 8080');
});
 
wsServer = new WebSocketServer({
    httpServer: server,
    autoAcceptConnections: false
});

var EventHandler = {
	event : {},

    init : function() {
    	this.event['/menu/select'] = this.menuSelect;
    	this.event['/menu/randomSelect'] = this.menuRandomSelect;
    	this.event['/menu/oneClickSelect'] = this.menuOneClickSelect;

    	this.event['/page/init'] = this.pageInit;
    	this.event['/page/movePrevious'] = this.pageMovePrevious;

    	this.event['/chat/sendMessage'] = this.chatSendMessage;
    },

    invokeEvent : function(request) {
    	var jsonRequest = JSON.parse(request.utf8Data);
    	console.log('invokeEvent : ' + jsonRequest.eventName);
    	this.event[jsonRequest.eventName](request);
    },

    menuSelect : function(node) {
    	console.log('menuSelect : ' + node);
    },
    menuRandomSelect : function(node) {
		console.log('menuRandomSelect : ' + node);
    },
    menuOneClickSelect : function(node) {
    	console.log('menuOneClickSelect : ' + node);
    },

    pageInit : function() {
    	console.log('pageInit');
    },
    pageMovePrevious : function() {
    	console.log('pageMovePrevious');
    },

    chatSendMessage : function(request) {
    	var jsonRequest = JSON.parse(request.utf8Data);
        msg = idlist[request.key]+ ': ' + jsonRequest.param;

    	var jsonResponse = {
            'eventName' : '/chat/sendMessage',
			'param' : msg
    	}

		sendBroadcastMsg(JSON.stringfy(jsonResponse));;
    	console.log('chatSendMessage -> ' + msg);
    }

};


EventHandler.init();
 
function originIsAllowed(origin) {
  return true;
}
 
function sendBroadcastMsg(message) {
    clients.forEach(function(cli) {
        cli.sendUTF(message);
    });
} 
wsServer.on('request', function(request) {
    if (!originIsAllowed(request.origin)) {
      request.reject();
      console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
      return;
    }
 


    var connection = request.accept(null, request.origin);
    clients.push(connection);
    idlist[request.key] = id++;  // 임의로 id값을 할당함. request.key값으로 client 구분
    console.log((new Date()) + ' Connection accepted.');

    var welcomeMsg = id + ' was joined.'
    sendBroadcastMsg('/chat/sendMessage', '[Notice] '+ welcomeMsg);

    connection.on('message', function(request) {
        if (request.type === 'utf8') {
            console.log('Received Message: ' + request.utf8Data);
                     // 브로드캐스팅!!
            EventHandler.invokeEvent(request);
        }
        else if (request.type === 'binary') {
            console.log('Received Binary Message of ' + request.binaryData.length + ' bytes');
        }
    });

    connection.on('close', function(reasonCode, description) {
        console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
    });
});