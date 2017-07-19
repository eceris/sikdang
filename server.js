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
    	var jsonRequest = JSON.parse(request);
    	console.log('invokeEvent : ' + jsonRequest.eventName);
    	
    	this.event[jsonRequest.eventName](request);
    },

    menuSelect : function(request) {
    	console.log('menuSelect : ' + request);
    	sendBroadcastMsg(request);
    },
    menuRandomSelect : function(request) {
		console.log('menuRandomSelect');
		sendBroadcastMsg(request);
    },
    menuOneClickSelect : function(request) {
    	console.log('menuOneClickSelect : ' + request);
    	sendBroadcastMsg(request);
    },

    pageInit : function(request) {
    	console.log('pageInit');
    	sendBroadcastMsg(request);
    },
    pageMovePrevious : function(request) {
    	sendBroadcastMsg(request);
    	console.log('pageMovePrevious');
    },

    chatSendMessage : function(request) {
    	var jsonRequest = JSON.parse(request);
        msg = idlist[request.key]+ ': ' + jsonRequest.param;

    	var jsonResponse = {
            'eventName' : '/chat/sendMessage',
			'param' : msg
    	}
    	console.log('chatSendMessage -> ' + msg);
		sendBroadcastMsg(JSON.stringify(jsonResponse));
    },



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
    idlist[request.key] = id;  // 임의로 id값을 할당함. request.key값으로 client 구분
    console.log((new Date()) + ' Connection accepted.');

    var welcomeMsg = '[Notice] ' + id++ + ' was joined.';
    sendBroadcastMsg(JSON.stringify({'eventName':'/chat/sendMessage', 'param':welcomeMsg}));

    connection.on('message', function(request) {
        if (request.type === 'utf8') {
            console.log('Received Message: ' + request.utf8Data);
                     // 브로드캐스팅!!
            EventHandler.invokeEvent(request.utf8Data);
        }
        else if (request.type === 'binary') {
            console.log('Received Binary Message of ' + request.binaryData.length + ' bytes');
        }
    });

    connection.on('close', function(reasonCode, description) {
        console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
    });
});