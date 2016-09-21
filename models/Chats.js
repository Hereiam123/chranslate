var mongoose=require('mongoose');

var chatSchema=mongoose.Schema({
    username:String,
    to_user:String,
    msg:String,
    created:{type:Date,default:Date.now}
});

var Chat=mongoose.model('Message',chatSchema);
