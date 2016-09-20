var app=angular.module('chatApp', ['ui.bootstrap','ui.router','ngStorage'])
        .config(function($stateProvider,$urlRouterProvider) {
          $urlRouterProvider.otherwise("/login");
          $stateProvider
            .state('chat',{
              url:'/chat',
              templateUrl:'chat.html',
              controller:'ChatCtrl'
            })
            .state('login',{
              url:'/login',
              templateUrl:'login.html',
              controller:'ChatCtrl'
            })
        });

app.factory('socket', function(){
  var socket=io.connect();
  return socket;
});

app.factory('setLanguage', function () {
    var language = "en";
    return {
        getLanguage: function () {
            return language;
        },
        setLanguage: function (newLanguage) {
            language = newLanguage;
        }
    }
});

app.controller('DropdownCtrl', function ($scope, $log, setLanguage) {

    $scope.options= [
        {language:'Spanish',shorthand:'es'},
        {language:'English',shorthand:'en'},
        {language:'Dutch',shorthand:'nl'},
        {language:'French',shorthand:'fr'}
    ];

    $scope.changeLanguage = function(option) {
        $scope.selected = option.language;
        console.log(option);
        console.log(option.shorthand);
        setLanguage.setLanguage(option.shorthand);
    };

    $scope.status = {
        isopen: false
    };

    $scope.toggled = function(open) {
        $log.log('Dropdown is now: ', open);
    };

    $scope.toggleDropdown = function($event) {
        $event.preventDefault();
        $event.stopPropagation();
        $scope.status.isopen = !$scope.status.isopen;
    };
});

app.controller('ChatCtrl', function($scope,socket,$http,$log,$state,setLanguage,$localStorage,$sessionStorage)
{
    $scope.userMenu='';
    $scope.connectedTo='Nobody! Click a name in the user list to start a private Chranslation Chat!';
    $scope.msgs=[];
    var output='';
    var sendTo;

    $scope.activeToggle = function(){
        if($scope.userMenu == '')
        {
            $scope.userMenu = 'menuDisplayed';
        }
        else
        {
            $scope.userMenu='';
        }
    };

  $scope.$watch('msg',function(){
    //get response for data based input and output language
    $http({
      method:'GET',
      url:'https://translate.yandex.net/api/v1.5/tr.json/translate?key=trnsl.1.1.20160723T144020Z.0c10deb189f9465d.aad68393900352c2aa9b1632bcacb766fbd107f8&text='+$scope.msg+'&lang=en-'+setLanguage.getLanguage()})
      .then(function(response){
        output=response.data;
        $scope.output=output.text.toString();
        $log.info(response);
      },function(reason){
        $scope.error=reason.data;
        $log.info(reason);
    });
  });

  $scope.privateChat=function(user){
        sendTo=user;
        $scope.connectedTo=user;
        if($scope.msgs.length==0) {
            socket.emit('get old msgs', sendTo);
        }
  };

  $scope.sendMsg = function() {
      if (!$scope.msg) {
          return;
      }
      if(!sendTo){
          return;
      }
      $scope.msg = $scope.output;
      socket.emit('send msg', {toUser:sendTo, msg:$scope.msg});
      $scope.msg = '';
  };

  $scope.sendUser=function(){
    user=$scope.user;
    socket.emit('new user',user, function(data){
        if(!data){
            $scope.error="Username already taken";
        }
        else{
            $state.go('chat');
        }
    });
  };

  socket.on('get msg', function(data)
  {
    data.date=new Date();
    $scope.msgs.push(data);
    $scope.$apply();
  });

  socket.on('get users', function(data){
    $scope.usernames=data;
    $scope.$apply();
  });

    socket.on('load old msgs', function(data){
        for(i=0; i<=data.length-1; i++) {
            $scope.msgs.push({user:data[i].username, msg:data[i].msg, date:data[i].created});
        }
        $scope.$apply();
    });
});




