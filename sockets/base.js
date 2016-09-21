module.exports=function (io) {
    var mongoose=require('mongoose');

    var chatSchema=mongoose.Schema({
        username:String,
        to_user:String,
        msg:String,
        created:{type:Date,default:Date.now}
    });

    var Chat = mongoose.model('Chat', chatSchema);

    var users={};
    io.sockets.on('connection',function(socket) {
        console.log("Connect Socket");
        socket.on('send msg', function (data) {
            var newMsg=new Chat({username:socket.username,to_user:data.toUser,msg:data.msg});
            newMsg.save(function(err){
                if(err){console.log(err);}
                users[data.toUser].emit('get msg', {msg:data.msg, user:socket.username});
            });
        });

        socket.on('get old msgs',function(data){
            console.log("Get old msgs from:"+socket.username);
            console.log("To "+data);
            Chat.find({$or:[{username:socket.username, to_user:data},{username:data, to_user:socket.username}]},function(err,data){
                if(err){throw err;}
                console.log(data);
                socket.emit('load old msgs',data);
            }).limit(10);
        });

        socket.on('entered chat', function(data){
            console.log(data);
            socket.username=data;
            users[socket.username]=socket;
            updateUsernames();
        });

        function updateUsernames(){
            io.sockets.emit('get users',Object.keys(users));
        };

        socket.on('remove user', function(data){
            console.log("Disconnected "+data);
                delete users[data];
                updateUsernames();
        });

        socket.on('disconnect', function(data){
            setTimeout(function () {
                console.log("Disconnected "+data);
                if(!socket.username){return;}
                else{
                    delete users[socket.username];
                    updateUsernames();
                }
            }, 10000);
        });
    });
}