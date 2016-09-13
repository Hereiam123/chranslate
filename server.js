var express = require('express');
var app=express();
var http = require('http').createServer(app);
var io = require('socket.io')(http);
users=[];
connections=[];

//added mongodb client, looking to put in mongoose module in future to save messages for users
//var MongoClient = require('mongodb').MongoClient;
//var assert = require('assert');
//var url = 'mongodb://localhost:27017/chat';
//end of mongo client addition

console.log("We're in server");

app.use(express.static(__dirname+'/public'));
app.use(express.static(__dirname+'/node_modules'));

//socket connections
io.on('connection',function(socket) {
	connections.push(socket);

	console.log('Connected: %s sockets connected', connections.length);

	socket.on('disconnect',function(data){
		if(!socket.username)return;
		users.splice(users.indexOf(socket.username),1);
		updateUsernames();
		connections.splice(connections.indexOf(socket),1);
		console.log('Disconnected: %s sockets connected', connections.length);
	});

	socket.on('send msg', function (data) {
		io.emit('get msg', data);
		console.log(data);
	});

	socket.on('new user', function(data){
		socket.username=data;
		users.push(socket.username);
		updateUsernames();
	});

	function updateUsernames(){
		io.sockets.emit('get users',users);
	}
});

http.listen(process.env.PORT || 5000);
//chat connection end


