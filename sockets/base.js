module.exports=function (io) {
    io.sockets.on('connection',function(socket) {
        io.set("transports", ["xhr-polling"]);
        io.set("polling duration", 10);

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
            Chat.find({$or:[{username:socket.username, to_user:data},{username:data, to_user:socket.username}]},function(err,data){
                if(err){throw err;}
                socket.emit('load old msgs',data);
            });
        });

        socket.on('entered chat', function(data){
            socket.username=data;
            users[socket.username]=socket;
            updateUsernames();
        });

        function updateUsernames(){
            var keys=Object.keys(users);
            console.log(socket.username);
            var index=keys.indexOf(socket.username);
            console.log(index);
            if(index!=-1) {
                keys.splice(index, 1);
            }
            console.log(keys);
            io.sockets.emit('get users',keys);
        };

        socket.on('disconnect', function(data){
            if(!socket.username){return;}
            else{
                delete users[socket.username];
                updateUsernames();
            }
        });
    });
}