var express = require('express');
var app=express();
var http = require('http').createServer(app);
var io = require('socket.io')(http);

console.log("We're in server");

app.use(express.static(__dirname+'/public'));
app.use(express.static(__dirname+'/node_modules'));

io.on('connection', function(socket){
  socket.on('send msg', function(data){
    io.emit('get msg', data);
    console.log(data);
  });
});

http.listen(process.env.PORT || 5000);



