var app=angular.module('chatApp', ['ui.bootstrap','ui.router','ngStorage']);

app.config(['$stateProvider','$urlRouterProvider','$locationProvider',
    function($stateProvider,$urlRouterProvider,$locationProvider) {
        $urlRouterProvider.otherwise("/");
        $locationProvider.hashPrefix('');
        $locationProvider.html5Mode(true);
        $stateProvider
            .state('chat',{
                url:'/chat',
                templateUrl:'/chat.html',
                controller:'ChatCtrl'
            })
            .state('login',{
                url:'/login',
                templateUrl:'/login.html',
                controller:'AuthCtrl',
                onEnter: ['$state','auth',function($state,auth){
                    if(auth.isLoggedIn()){
                        $state.go('chat');
                    }
                }]
            })
            .state('register',{
                url:'/register',
                templateUrl:'/register.html',
                controller:'AuthCtrl',
                onEnter: ['$state','auth',function($state,auth){
                    if(auth.isLoggedIn()){
                        $state.go('chat');
                    }
                }]
            })
            .state('home', {
                url:'/',
                templateUrl:'/home.html',
                controller:'HomeCtrl'
            });
    }]);

app.factory('auth', ['$http','$window','$state','socket','$localStorage',function($http,$window,$state,socket,$localStorage){
    var auth={};

    $window.onbeforeunload = function (evt) {
        auth.logOut();
    }

    auth.saveToken=function(token){
        $window.localStorage['chranslate-token']=token;
    };
    auth.getToken=function(){
        return $window.localStorage['chranslate-token'];
    };
    auth.isLoggedIn=function(){
        var token=auth.getToken();

        if(token){
            var payload=JSON.parse($window.atob(token.split('.')[1]));

            return payload.exp>Date.now()/1000;
        }
        else{
            return false;
        }
    };
    auth.currentUser=function() {
        if (auth.isLoggedIn()) {
            var token = auth.getToken();
            var payload = JSON.parse($window.atob(token.split('.')[1]));
            return payload.username;
        }
    };
    auth.register=function(user){
        return $http.post('/register',user).success(function(data){
            auth.saveToken(data.token);
            var name=auth.currentUser();
        });
    };
    auth.logIn=function(user){
        return $http.post('/login',user).success(function(data){
            auth.saveToken(data.token);
            var name=auth.currentUser();
        });
    };
    auth.logOut=function(){
        var name=auth.currentUser();
        socket.emit('remove user',name);
        $window.localStorage.removeItem('chranslate-token');
        delete $localStorage.messages;
        delete $localStorage.users;
        delete $localStorage.to_user;
        $state.go('home');
    };
    return auth;
}]);

app.factory('socket', ['$rootScope',function ($rootScope,auth) {
    var socket=io.connect({reconnection:true,
    reconnectionDelay:1000,
    reconnectionDelayMax:5000,
    timeout:20000});
    return {
        on: function (eventName, callback) {
            socket.on(eventName, function () {
                var args = arguments;
                $rootScope.$apply(function () {
                    callback.apply(socket, args);
                });
            });
        },
        emit: function (eventName, data, callback) {
            socket.emit(eventName, data, function () {
                var args = arguments;
                $rootScope.$apply(function () {
                    if (callback) {
                        callback.apply(socket, args);
                    }
                });
            })
        }
    };
}]);

app.factory('setLanguage', [function () {
    var language = "en";
    return {
        getLanguage: function () {
            return language;
        },
        setLanguage: function (newLanguage) {
            language = newLanguage;
        }
    }
}]);

app.controller('NavCtrl',['$scope','auth',function($scope,auth){
    $scope.isLoggedIn=auth.isLoggedIn;
    $scope.currentUser=auth.currentUser;
    $scope.logOut=auth.logOut;
}]);

app.controller('HomeCtrl',['$scope','auth',function($scope,auth){
    $scope.isLoggedIn=auth.isLoggedIn;
}]);

app.controller('AuthCtrl', ['$scope','$state','auth',function($scope,$state,auth){
    $scope.user={};

    $scope.register=function(){
        auth.register($scope.user).error(function(error){
           $scope.error=error;
        }).then(function(){
            $state.go('chat');
        });
    };
    $scope.logIn=function(){
        auth.logIn($scope.user).error(function(error){
            $scope.error=error;
        }).then(function(){
            $state.go('chat');
        });
    };
}]);

app.directive('whenScrolled', function() {
    return function(scope, elm, attr) {
        var raw = elm[0];

        elm.bind('scroll', function() {
            if (raw.scrollTop + raw.offsetHeight >= raw.scrollHeight) {
                scope.$apply(attr.whenScrolled);
            }
        });
    };
});

app.directive("notificationBadge",function($timeout){
   return function($scope,elem,attrs) {
       $timeout(function () {
           elem.addClass('notification-badge');
       }, 0);
       $scope.$watch(attrs.notificationBadge, function (newVal) {
           if (newVal > 0) {
               elem.attr('data-badge-count', newVal);
           }
           else {
               elem.removeAttr('data-badge-count');
           }
       });
   }
});

app.controller('DropdownCtrl', ['$scope','$log','setLanguage',function ($scope, $log, setLanguage) {

    $scope.options= [
        {language:'Spanish',shorthand:'es'},
        {language:'English',shorthand:'en'},
        {language:'Dutch',shorthand:'nl'},
        {language:'French',shorthand:'fr'}
    ];

    $scope.changeLanguage = function(option) {
        $scope.selected = option.language;
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
}]);

app.controller('ChatCtrl', ['$scope','socket','$http','$log','setLanguage','auth','$window',
    '$localStorage','$state', function($scope,socket,$http,$log,setLanguage,auth,$window,$localStorage,$state)
{

    if (!auth.isLoggedIn())
    {
        $state.go('register');
    }

    $scope.logOut=function(){
        auth.logOut();
    };

    $scope.userMenu='';
    $scope.output="Type to start translation!";
    $scope.currentUser=auth.currentUser;
    socket.emit('entered chat',auth.currentUser());

    if($localStorage.messages){
        $scope.msgs=$localStorage.messages;
    }
    else {
        $scope.msgs = [];
    }

    if($localStorage.users)
    {
        $scope.usernames=$localStorage.users;
    }

    var sendTo;

    if($localStorage.to_user){
        $scope.connectedTo=$localStorage.to_user;
        sendTo=$localStorage.to_user;
    }
    else
    {
        $scope.connectedTo='Nobody! Click a name in the User list.';
    }

    var output='';

    $scope.activeToggle = function(){
        if($scope.userMenu === '')
        {
            $scope.userMenu = 'menuDisplayed';
        }
        else
        {
            $scope.userMenu='';
        }
    };

    $scope.checkMsg=function(){
        $scope.$watch('msg', function() {
                //get response for data based input and output language
                $http({
                    method: 'GET',
                    url: 'https://translate.yandex.net/api/v1.5/tr.json/translate?key=trnsl.1.1.20160723T144020Z.0c10deb189f9465d.aad68393900352c2aa9b1632bcacb766fbd107f8&text=' + $scope.msg + '&lang=en-' + setLanguage.getLanguage()
                })
                    .then(function (response) {
                        if (response.data !== 'undefined') {
                            output = response.data;
                            $scope.output = output.text.toString();
                            $log.info(response);
                        }
                    }, function (reason) {
                        $scope.error = reason.data;
                        $log.info(reason);
                    });
        });
    };

    $scope.privateChat=function(user){
        if(sendTo!==user){
            $scope.msgs=[];
        }
        sendTo=user;
        $localStorage.to_user=sendTo;
        $scope.connectedTo=sendTo;
        if($scope.msgs.length===0) {
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
        date=new Date();
        var message={user:auth.currentUser(), msg:$scope.output, date:date};
        $scope.msgs.unshift(message);
        $localStorage.messages=$scope.msgs;
        socket.emit('send msg', {toUser:sendTo, msg:$scope.output});
        $scope.msg = '';
    };

    socket.on('get msg', function(data)
    {
        data.date=new Date();
        if(data.user===sendTo) {
            $scope.msgs.unshift(data);
        }
        else {
            console.log("Not on user");
        }
        var searchName = data.user;
        var index = -1;
        for(i = 0; i<=$scope.usernames.length-1; i++) {
            if ($scope.usernames[i].name === searchName) {
                index = i;
                break;
            }
        }
        $scope.usernames[index].count++;
    });

    socket.on('get users', function(data){
        var index=data.indexOf(auth.currentUser());
        if(index!==-1)
        {
            data.splice(index,1);
        }
        $scope.usernames = data.map(function(e) {
            return { name: e , count:0 };
        });
        $localStorage.users=$scope.usernames;

        if($localStorage.to_user && data.indexOf(sendTo)===-1){
            $scope.connectedTo=$localStorage.to_user+" has disconnected.";
        }

        if(data.indexOf(sendTo)!==-1){
            $scope.connectedTo=sendTo;
        }
    });

    socket.on('load old msgs', function(data){
        for(i=0; i<=data.length-1; i++) {
            $scope.msgs.push({user:data[i].username, msg:data[i].msg, date:data[i].created});
        }
        $localStorage.messages=$scope.msgs;
    });
}]);