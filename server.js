  const express = require("express");
  const app = express();
  const server = app.listen(8000)
  const io = require('socket.io')(server);
  const mongoose = require('mongoose');
  const session = require('express-session');
  const flash = require('express-flash');
  const moment = require('moment');
app.use(flash());
app.use(session({
  secret: 'keyboardkitteh',
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 60000 }
}))
mongoose.connect('mongodb://localhost/test', {useNewUrlParser: true});
app.use(express.urlencoded({extended: true}));

app.use(express.static(__dirname + "/public")); 


app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');  

const UserSchema = new mongoose.Schema({
    name: String,
}, {timestamps: true})
const User = mongoose.model('User', UserSchema)

const BucketSchema = new mongoose.Schema({
    title: String,
    description: String,
    status: String,
    users: [UserSchema]
}, {timestamps: true})
const Bucket = mongoose.model('Bucket', BucketSchema)


app.get("/", (req, res) => {
  res.render('index');
})

app.post('/add_list', (req, res) => {
      var errors = [];

      if  (req.body.title.length < 5){
          errors.push("Title must be at least 5 characters")
      }
      if  (req.body.description.length < 10){
          errors.push("Description must be at least 10 characters")
      }
      if (errors.length) {
            for (var key in errors) {
              req.flash('messages', errors[key]);
          }
          res.redirect('/Dashboard');
      }
      else{
            const bucket = new Bucket();
            bucket.title = req.body.title;
            bucket.description = req.body.description;
            bucket.status = req.body.status;
            bucket.save()
                  .then(bucket => {
                    User.findOne({_id: req.body.user_name})
                        .then(user => {
                              Bucket.updateOne({_id: bucket._id}, {$push: {users: { _id: user.id, name:user.name}} })
                                      .then(result => {
                                          req.session.user_id = user.id;
                                          req.flash('messages',"Successful added list!")
                                          res.redirect('/Dashboard');
                                      })
                                      .catch(err => res.json(err));
                        })
                        .catch(err => res.json(err));
                      // req.flash('messages',"Successful added list!")
                      // res.redirect('/Dashboard');
                    })
                  .catch(err => console.log(err));
      }
})
app.post('/login', (req, res) => {
        var errors = [];

      if  (req.body.name.length == 0 ){
          errors.push("Name required")
      }
      if (errors.length) {
            for (var key in errors) {
              req.flash('messages', errors[key]);
          }
          res.redirect('/');
      }
      else{
          
          User.findOne({name: req.body.name})
              .then(user => {
               
                  req.session.is_logged_in = true;
                  req.session.name = req.body.name;
                  req.session.id = user._id;
               return res.redirect('/Dashboard');  
              })
              .catch(err => {
                  const user = new User();
                    user.name = req.session.name;
                    user.save()
                    .then(newUserData => {
                        req.session.is_logged_in = true;
                        req.session.id = newUserData.id;
                        return res.redirect('/Dashboard');
                    })
                    .catch(err => console.log(err));
              }
              );
          }

});
app.get("/Dashboard", (req, res) => {
 if ('is_logged_in' in req.session) {
       if (req.session.is_logged_in = true) {
          User.findOne({name: req.session.name})
              .then(user => {
                User.find()
                    .then(user_list => {
                       Bucket.find()
                            .then(bucket_list => {
                                  User.find({_id : { $nin:  user._id}})
                                      .then(other_user => {
                                                 // res.redirect('/Dashboard');
                                          user_id = req.session.user_id;
                                          res.render('Dashboard', {user: user, user_list: user_list, bucket_list: bucket_list, other_user: other_user,  moment: moment, user_id: user_id});
                                      })
                                      .catch(err => res.json(err));;
                            })
                    .catch(err => res.json(err));
                       
                    })
                    .catch(err => res.json(err));
              })
              .catch(err => res.json(err));
       } 
       else{
        req.flash('messages',"User is not logged in")
        res.redirect("/")
       }
    }
    else{
        req.flash('messages',"User is not logged in")
        res.redirect("/")
    }
});
app.get('/delete/:id', function(req, res) {
   if ('is_logged_in' in req.session) {
       if (req.session.is_logged_in = true) {
         User.remove({_id: req.params.id})
              .then(deletedUser => {
                  req.flash('messages',"User Deleted")
                  res.redirect("/Dashboard")
              })
              .catch(err => res.json(err));
       } 
       else{
        req.flash('messages',"User is not logged in")
        res.redirect("/")
       }
    }
    else{
        req.flash('messages',"User is not logged in")
        res.redirect("/")
    }
});

app.get('/logout', function(req, res) {
    req.session.destroy();
    res.redirect('/');
});


// app.get('/view/:id', function(req, res) {
//      if ('is_logged_in' in req.session) {
//        if (req.session.is_logged_in = true) {
//          User.findOne({_id: req.params.id})
//               .then(user => {
//                     Bucket.findOne({_id: user.id})
//                       .then(bucket_list => {
//                            res.render('view', {user: user, bucket_list, bucket_list,  moment: moment})
//                        })
//                     .catch(err => res.json(err));
//               })
//               .catch(err => res.json(err));
//        } 
//        else{
//         req.flash('messages',"User is not logged in")
//         res.redirect("/")
//        }
//     }
//     else{
//         req.flash('messages',"User is not logged in")
//         res.redirect("/")
//     }
// });

// app.get('/edit/:id', function(req, res) {
//        if ('is_logged_in' in req.session) {
//        if (req.session.is_logged_in = true) {
//             User.findOne({_id: req.params.id})
//                 .then(viewUser => {
//                     res.render('edit', {viewUser: viewUser})
//                 })
//                 .catch(err => res.json(err));
//        } 
//        else{
//         req.flash('messages',"User is not logged in")
//         res.redirect("/")
//        }
//     }
//     else{
//         req.flash('messages',"User is not logged in")
//         res.redirect("/")
//     }
// });

// app.post('/Update', function(req, res) {
//   if ('is_logged_in' in req.session) {
//        if (req.session.is_logged_in = true) {
//              User.updateOne({_id: req.body.id}, {
//                   name: req.body.name,
//                   username: req.body.username,
//                   password: req.body.password,
//                   // $push: {pets: {name: 'Sprinkles', type: 'Chubby Unicorn' }}
//               })
//               .then(result => {
//                   req.flash('messages',"Updated!")
//                   res.redirect("/Dashboard")
//     })
//     .catch(err => res.json(err));
//        } 
//        else{
//         req.flash('messages',"User is not logged in")
//         res.redirect("/")
//        }
//     }
//     else{
//         req.flash('messages',"User is not logged in")
//         res.redirect("/")
//     }
// });