module.exports=function (io) {
    var mongoose=require('mongoose');
    var lastSeen;
    var users={};
    var Chat=mongoose.model('Chat');

    io.sockets.on('connection',function(socket) {
        socket.on('send msg', function (data) {
            var newMsg=new Chat({username:socket.username,to_user:data.toUser,msg:data.msg});
            newMsg.save(function(err){
                if(err){throw err;}
                console.log(data.toUser);
                users[data.toUser].emit('get msg', {msg:data.msg, user:socket.username});
            });
        });

        socket.on('get old msgs',function(data){
            Chat.find({$or:[{username:socket.username, to_user:data},{username:data, to_user:socket.username}]})
                .sort({created:-1}).exec(function(err,data){
                if(err){throw err;}
                socket.emit('load old msgs',data);
                var date=data.slice(-1)[0];
                if(date) {
                    lastSeen = date.created;
                }
            });
        });

        socket.on('load more msgs',function(data){
            if(lastSeen) {
                Chat.find({
                    $and: [{
                        $or: [{username: socket.username, to_user: data}, {
                            username: data,
                            to_user: socket.username
                        }]
                    }, {created: {$lt: lastSeen}}]
                })
                    .limit(5).sort({created: -1}).exec(function (err, data) {
                    if (err) {
                        throw err;
                    }
                    socket.emit('load old msgs', data);
                    var date = data.slice(-1)[0];
                    if(date) {
                        lastSeen = date.created;
                    }
                });
            }
        });

        socket.on('entered chat', function(data){
            socket.username=data;
            users[socket.username]=socket;
            updateUsernames();
        });

        function updateUsernames(){
            io.sockets.emit('get users',Object.keys(users));
        }

        socket.on('remove user', function(data){
                delete users[data];
                updateUsernames();
        });
    });
}