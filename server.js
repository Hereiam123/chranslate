var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

console.log("We're in server");

app.get('/', function(req, res){
	console.log("App get working");
  res.sendFile(__dirname+'/index.html');
});

io.configure(function () {
  io.set("transports", ["xhr-polling"]);
  io.set("polling duration", 10);
});

io.on('connection', function(socket){
	console.log("We're connected");
  socket.on('chat message', function(msg){
    io.emit('chat message', msg);
  });
});

http.listen(process.env.PORT || 5000);

