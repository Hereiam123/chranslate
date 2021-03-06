var express = require('express');
var router = express.Router();
var mongoose=require('mongoose');
var User=mongoose.model('User');
var passport=require('passport');
var jwt = require('express-jwt');
var auth = jwt({secret:'SECRET', userProperty:'payload'});

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

/* GET home page. */
router.get('/home', function(req, res, next) {
    res.render('index', { title: 'Express' });
});

router.post('/register',function(req,res,next){
  if(!req.body.username||!req.body.password){
    return res.status(400).json({message:'Please fill out all fields'});
}

  User.count({username: req.body.username}, function (err, count){
    if(count>0){
      return res.status(400).json({message:'User name already taken'});
    }
  });

  var user=new User();
  user.username=req.body.username;
  user.setPassword(req.body.password);
  user.save(function(err){
    if(err){return next(err);}
    return res.json({token: user.generateJWT()});
  });
});

router.post('/login',function(req,res,next){
  if(!req.body.username||!req.body.password){
    return res.status(400).json({message:'Please fill out all fields'});
  }

  passport.authenticate('local', function(err,user,info){
    if(err){return next(err);}
    if(user){
      return res.json({token: user.generateJWT()});
    }
    else{
      return res.status(401).json(info);
    }
  })(req,res,next);
});

module.exports = router;
