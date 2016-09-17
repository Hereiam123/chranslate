var express = require('express');
var app=express();
var http = require('http').createServer(app);
var io = require('socket.io')(http);
var users={};


//added mongodb client, looking to put in mongoose module in future to save messages for users
//var MongoClient = require('mongodb').MongoClient;
//var assert = require('assert');
//var url = 'mongodb://localhost:27017/chat';
//end of mongo client addition

console.log("We're in server");

app.use(express.static(__dirname+'/public'));
app.use(express.static(__dirname+'/node_modules'));

//socket connections
io.sockets.on('connection',function(socket) {
	socket.on('send msg', function (data) {
		users[data.toUser].emit('get msg', {msg:data.msg, user:socket.username});
		console.log(data);
	});

	socket.on('new user', function(data,callback){
		if(data in users){
			callback(false);
		}
		else {
			callback(true);
			socket.username=data;
			users[socket.username]=socket;
			updateUsernames();
		}
	});

	function updateUsernames(){
		io.sockets.emit('get users',Object.keys(users));
	};

	socket.on('disconnect', function(data){
		if(!socket.username)return;
		else{
			delete users[socket.username];
			updateUsernames();
		}
	});
});

http.listen(process.env.PORT || 5000);
//chat connection end


