var mongoose=require('mongoose');

var ChatSchema=mongoose.Schema({
    username:String,
    to_user:String,
    msg:String,
    created:{type:Date,default:Date.now}
});

var Chat=mongoose.model('Chat',ChatSchema);
