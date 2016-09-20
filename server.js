var express = require('express');
var app=express();
var http = require('http').createServer(app);
var io = require('socket.io')(http);
var mongoose=require('mongoose');
var users={};

var uristring='mongodb://heroku_nhtkvtgq:dv5pn3209dj8f33qct9taheq43@ds033096.mlab.com:33096/heroku_nhtkvtgq';

mongoose.connect(uristring, function(err){
	if(err){
		console.log(err);
	}
	else{
		console.log('Connected to database chat');
	}
});

var chatSchema=mongoose.Schema({
	username:String,
	to_user:String,
	msg:String,
	created:{type:Date,default:Date.now}
});

var Chat=mongoose.model('Message',chatSchema);

console.log("We're in server");

app.use(express.static(__dirname+'/public'));
app.use(express.static(__dirname+'/node_modules'));

//socket connections
io.sockets.on('connection',function(socket) {
	socket.on('send msg', function (data) {
		var newMsg=new Chat({username:socket.username,to_user:data.toUser,msg:data.msg});
		newMsg.save(function(err){
			if(err){console.log(err);}
			users[data.toUser].emit('get msg', {msg:data.msg, user:socket.username});
		});
		console.log(data);
	});

	socket.on('get old msgs',function(data){
		console.log("Get old msgs from:"+socket.username);
		console.log("To "+data);
		Chat.find({username:socket.username, to_user:data},function(err,data){
			if(err){throw err;}
			socket.emit('load old msgs',data);
		});
		Chat.find({username:data, to_user:socket.username},function(err,data){
			if(err){throw err;}
			socket.emit('load old msgs',data);
		});
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
		if(!socket.username){return;}
		else{
			delete users[socket.username];
			updateUsernames();
		}
	});
});

http.listen(process.env.PORT || 5000);
//chat connection end


