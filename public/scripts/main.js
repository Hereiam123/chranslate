var app=angular.module('chatApp', ['ui.bootstrap'])

app.factory('socket', function(){
  var socket=io.connect();
  return socket;
})

app.controller('ChatCtrl', function($scope,socket,$http,$log)
{
  $scope.msgs=[];

  $scope.$watch('msg',function(){
    //get response for data based on artist name from spotify api
    $http({
      method:'GET',
      url:'https://translate.yandex.net/api/v1.5/tr.json/translate?key=trnsl.1.1.20160723T144020Z.0c10deb189f9465d.aad68393900352c2aa9b1632bcacb766fbd107f8&text='+$scope.msg+'&lang=en-es'})
      .then(function(response){
        $scope.output=response.data;
        $log.info(response);
      },function(reason){
        $scope.error=reason.data;
        $log.info(reason);
      });
    });

  $scope.sendMsg = function()
  {
    if(!$scope.msg)
    {return;}

    $scope.msg=$scope.output.text;
    socket.emit('send msg', $scope.msg); 
    $scope.msg='';
  }

  socket.on('get msg', function(msg)
  {
    $scope.msgs.push(msg);
    $scope.$digest();
  })
})




