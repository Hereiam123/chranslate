 /*$( document ).ready(function() {
        var socket = io();
        $('form').submit(function(){
          socket.emit('chat message', $('#m').val());
          $('#m').val('');
          return false;
        });
        socket.on('chat message', function(msg){
          $('#messages').append($('<li>').text(msg));
        });
    });*/


var app=angular.module('chatApp', [])

app.factory('socket', function(){
  var socket=io.connect();
  return socket;
})

app.controller('ChatCtrl', function($scope,socket)
{
  $scope.msgs=[];
  $scope.sendMsg = function()
  {
    socket.emit('send msg', $scope.msg.text); 
    $scope.msg.text='';
  }

  socket.on('get msg', function(data)
  {
    $scope.msgs.push(data);
    $scope.$digest();
  })
})