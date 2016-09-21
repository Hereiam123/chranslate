var app=angular.module('chatApp', ['ui.bootstrap','ui.router']);

app.config(['$stateProvider','$urlRouterProvider',
    function($stateProvider,$urlRouterProvider) {
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
            });
        $urlRouterProvider.otherwise("/register");
    }]);

app.factory('auth', ['$http','$window','$state','socket',function($http,$window,$state,socket){
    var auth={};

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
            socket.emit('entered chat',name);
        });
    };
    auth.logIn=function(user){
        return $http.post('/login',user).success(function(data){
            auth.saveToken(data.token);
            var name=auth.currentUser();
            socket.emit('entered chat',name);
        });
    };
    auth.logOut=function(){
        console.log(name);
        var name=auth.currentUser();
        socket.emit('remove user',name);
        $window.localStorage.removeItem('chranslate-token');
        $state.go('login');
    };
    return auth;
}]);

app.factory('socket', ['$rootScope',function ($rootScope) {
    var socket=io.connect();
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

app.controller('DropdownCtrl', ['$scope','$log','setLanguage',function ($scope, $log, setLanguage) {

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
}]);

/*app.controller('DropdownCtrl2', ['$scope','$log','setLanguage',function ($scope, $log, setLanguage) {

    $scope.options= [
        {language:'Spanish',shorthand:'es'},
        {language:'English',shorthand:'en'},
        {language:'Dutch',shorthand:'nl'},
        {language:'French',shorthand:'fr'}
    ];

    $scope.changeLanguageTo = function(option) {
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
}]);*/

app.controller('ChatCtrl', ['$scope','socket','$http','$log','setLanguage','auth','$window', function($scope,socket,$http,$log,setLanguage,auth,$window)
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
        date=new Date();
        var message={user:auth.currentUser(), msg:$scope.output, date:date};
        $scope.msgs.push(message);
        $window.localStorage['chat-messages']=JSON.stringify($scope.msgs);
        socket.emit('send msg', {toUser:sendTo, msg:$scope.output});
        $scope.msg = '';
    };

    socket.on('get msg', function(data)
    {
        data.date=new Date();
        $scope.msgs.push(data);
    });

    socket.on('get users', function(data){
        console.log(data);
        var index=data.indexOf(auth.currentUser());
        if(index!=-1)
        {
            data.splice(index,1);
        }
        $scope.usernames=data;
    });

    socket.on('load old msgs', function(data){
        console.log($window.localStorage['chat-messages']);
        $scope.msgs=JSON.parse($window.localStorage['chat-messages']);
        for(i=0; i<=data.length-1; i++) {
            $scope.msgs.push({user:data[i].username, msg:data[i].msg, date:data[i].created});
        }
    });
}]);
