
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const _=require("lodash");
const session= require("express-session");
const passport= require("passport");
const passportLocalMongoose= require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate= require("mongoose-findorcreate");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

app.use(session({
  secret: "This is C-guide.",
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect('mongodb+srv://admin-sanskar:Test123@cluster0.uzafw.mongodb.net/C-guideDB', {useNewUrlParser: true, useUnifiedTopology: true});
mongoose.set("useCreateIndex",true);

const commentSchema = new mongoose.Schema({
  comment: String,
  date: String,
  username: String
});

const postSchema = new mongoose.Schema({
  postNumber: String,
  date: String,
  userName: String,
  question: String,
  comments:[commentSchema],
  profile: String
});

const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  fname:String,
  lname:String,
  googleId: String,
  profile: String,
  content:[postSchema]
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);


const User = mongoose.model("User",userSchema);
const Post = mongoose.model("Post",postSchema);
const Comment = mongoose.model("Comment",commentSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

passport.use(new GoogleStrategy({
    clientID: "630603538862-1tslhdsnqp192st6futeqj9mk9lae3do.apps.googleusercontent.com",
    clientSecret: "qqm0jnpot-oJxhFQ5bnOVAZH",
    callbackURL: "http://localhost:3000/auth/google/first",
    userProfileURL:"https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
  //  console.log(profile);
    User.findOrCreate({ googleId: profile.id, fname: profile.name.givenName, lname: profile.name.familyName, profile:profile.photos[0].value }, function (err, user) {
      return cb(err, user);
    });
  }
));

// const c1 = new Comment({
//   comment: "YES",
//   date: "April 22,2021",
//   username: "neha Singh"
// });
//
// const c2 = new Comment({
//   comment: "just focus on 2-3 things namely core subjects,DSA and Projects",
//   date:"Apr 11,2021",
//   username: "Kartik Patidar"
// });
//
// const c3 = new Comment({
//   comment: "Focus on your studies and keep improving",
//   date:"May 8,2020",
//   username: "Rajat Sharma"
// });

// const p1 = new Post({
//   postNumber: "p-1",
//   date: "April 21,2021",
//   userName:"kartik Patidar",
//   question:"Is Amity University better than LPU and Sharda University ?",
//   comments:[c1],
//   profile:"https://st3.depositphotos.com/3581215/18899/v/1600/depositphotos_188994514-stock-illustration-vector-illustration-male-silhouette-profile.jpg"
// });
//
// const p2 = new Post({
//   postNumber: "p-2",
//   date: "Apr 8,2021",
//   userName:"Rajat Sharma",
//   question:"I am 2nd Year BTech student .How can I grab Internship oppurtunity in my 2nd Year?",
//   comments:[c2],
//     profile:"https://st3.depositphotos.com/3581215/18899/v/1600/depositphotos_188994514-stock-illustration-vector-illustration-male-silhouette-profile.jpg"
// });
//
// const p3 = new Post({
//   postNumber: "p-3",
//   date: "May 8,2020",
//   userName:"neha Singh",
//   question:"I have low CGPA and ATKT .Does this affect my interview for placements?",
//   comments:[c3],
//   profile:"https://st3.depositphotos.com/3581215/18899/v/1600/depositphotos_188994514-stock-illustration-vector-illustration-male-silhouette-profile.jpg"
// });

// c1.save();
// c2.save();
// c3.save();

//const defaultPosts = [p1,p2,p3];

let today=new Date();

let options = {
  day: "numeric",
  month: "long",
  year:"numeric"
};

let day=today.toLocaleDateString("en-US",options);

app.get("/",function(req, res){
  res.render("home",{
    statement: "Welcome to C-Guide"
  });
});

app.get("/auth/google",
  passport.authenticate('google', { scope: ["profile"] })
);

app.get("/auth/google/first",
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect first page.
    res.redirect("/first");
  });

app.get("/login",function(req, res){
  res.render("login",{
    stat:" "
  });
});

app.get("/register",function(req, res){
  res.render("register");
});

app.get("/logout", function(req, res){
  req.logout();
  res.render("home",{
    statement: "✔ You've successfully logged out of C-Guide. Come back soon! 😊"
  });
});

app.get("/first",function(req, res){
  if (req.isAuthenticated())
  {
    User.findById(req.user.id, function(err, foundUser){
      if (err)
      {
        console.log(err);
      }else
      {
        if (foundUser)
        {
              Post.find({},function(err,foundPosts){


                  res.render("first",{
                    fname: foundUser.fname,
                    lname: foundUser.lname,
                    posts:foundPosts
                  });

              });
        }
      }
    });
  } else
  {
  //  console.log("helloworld");
    res.redirect("/login");
  }
});

app.get("/about",function(req,res){
  if (req.isAuthenticated())
  {
    User.findById(req.user.id, function(err, foundUser){
      if (err)
      {
        console.log(err);
      }else
      {
        if (foundUser)
        {
              res.render("about",{
                fname:foundUser.fname,
                lname:foundUser.lname
              });
        }
      }
    });
  } else
  {
    res.redirect("/login");
  }

});

app.get("/askquestion",function(req,res){
  if (req.isAuthenticated())
  {
    User.findById(req.user.id, function(err, foundUser){
      if (err)
      {
        console.log(err);
      }else
      {
        if (foundUser)
        {
          var imageLink;
          if(!foundUser.profile)
          {
            imageLink= "https://st3.depositphotos.com/3581215/18899/v/1600/depositphotos_188994514-stock-illustration-vector-illustration-male-silhouette-profile.jpg";
          }else
          {
            imageLink=foundUser.profile ;
          }
                res.render("askQuestion",{
                fname:foundUser.fname,
                lname:foundUser.lname,
                imageLink: imageLink
              });
        }
      }
    });
  } else
  {
    res.redirect("/login");
  }
});

app.get("/posts/:postName",function(req,res){
  var requestPost=req.params.postName;
  User.findById(req.user.id, function(err, foundUser){
    if (err)
    {
      console.log(err);
    }else
    {
      if (foundUser)
      {
        Post.findOne({postNumber: requestPost},function(err , foundPost){
          if(err)
          {
            console.log(err);
          }else
          {
            res.render("post",{
              fname: foundUser.fname,
              lname: foundUser.lname,
              post: foundPost,
              imageLink: foundPost.profile
            });
          }
        });
      }
    }
  });

});

app.get("/content",function(req, res){
  if (req.isAuthenticated())
  {
    User.findById(req.user.id, function(err, foundUser){
      if (err)
      {
        console.log(err);
      }else
      {
        if (foundUser)
        {
          res.render("content",{
            fname:foundUser.fname,
            lname:foundUser.lname,
            posts:foundUser.content
          });
        }
      }
    });
  } else
  {
    res.redirect("/login");
  }
});

app.get("/profile",function(req, res){
  if (req.isAuthenticated())
  {
    User.findById(req.user.id, function(err, foundUser){
      if (err)
      {
        console.log(err);
      }else
      {
        if (foundUser)
        {
          var imageLink;
          if(!foundUser.profile)
          {
            imageLink= "https://st3.depositphotos.com/3581215/18899/v/1600/depositphotos_188994514-stock-illustration-vector-illustration-male-silhouette-profile.jpg";
          }else
          {
            imageLink=foundUser.profile ;
          }

          res.render("profile",{
            user: foundUser,
            imageLink: imageLink
          });
        }
      }
    });
  } else
  {
    res.redirect("/login");
  }
});

app.get("/help",function(req, res){
  if (req.isAuthenticated())
  {
    User.findById(req.user.id, function(err, foundUser){
      if (err)
      {
        console.log(err);
      }else
      {
        if (foundUser)
        {
              res.render("help",{
                fname:foundUser.fname,
                lname:foundUser.lname
              });
        }
      }
    });
  } else
  {
    res.redirect("/login");
  }
});
app.post("/login",
  passport.authenticate("local", { successRedirect: "/first",
                                   failureRedirect: "/login"})
);

app.post("/register",function(req, res){
  User.register({username: req.body.username, fname: req.body.fname, lname: req.body.lname}, req.body.password, function(err, user){
    if(err)
    {
      console.log(err);
      res.redirect("/register");
    }else
    {
      passport.authenticate("local")(req, res, function(){
        res.redirect("/first");
      });
    }
  });
});

app.post("/first",function(req,res){
  res.redirect("/askquestion");
});

var pno ;
app.post("/getPostNo",function(req,res){
  pno = req.body.p_no;
  pno++;
//  console.log(pno);
});

app.post("/comment",function(req,res){
  const comment = req.body.comment_box;
  User.findById(req.user.id, function(err, foundUser){
    if (err)
    {
      console.log(err);
    }else
    {
      if (foundUser)
      {
        Post.findOne({postNumber: "p-" + pno},function(err , foundPost){
          if(err)
          {
            console.log(err);
          }else
          {
            const c = new Comment({
              comment: comment,
              date:day,
              username: foundUser.fname + " " + foundUser.lname
            });
            c.save();
            foundPost.comments.push(c);
            foundPost.save();

            res.render("post",{
              fname:foundUser.fname,
              lname:foundUser.lname,
              post: foundPost,
              imageLink: foundPost.profile
            });
          }
        });
      }
    }
  });

});

app.post("/askquestion",function(req,res){
  if (req.isAuthenticated())
  {
    User.findById(req.user.id, function(err, foundUser){
      if (err)
      {
        console.log(err);
      }else
      {
        if (foundUser)
        {
          var imageLink;
          if(!foundUser.profile)
          {
            imageLink= "https://st3.depositphotos.com/3581215/18899/v/1600/depositphotos_188994514-stock-illustration-vector-illustration-male-silhouette-profile.jpg";
          }else
          {
            imageLink=foundUser.profile ;
          }

          const ques=req.body.question;

          Post.find({},function(err,foundPosts){
            if(err)
            {
              console.log(err);
            }else
            {
              var cnt = foundPosts.length;
              cnt++;

              const p = new Post({
                postNumber: "p-" + cnt,
                date: day,
                userName:foundUser.fname + " " + foundUser.lname, //USERNAME
                question:ques,
                comments:[],
                profile: imageLink
              });

              foundUser.content.push(p);
              foundUser.save();
              p.save();
            }
          });

          res.redirect("/first");
        }
      }
    });
  } else
  {
    res.redirect("/login");
  }

});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function() {
  console.log("Server has started successfully");
});
