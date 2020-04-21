
const express=require("express");
const body= require("body-parser");
const mongoose=require("mongoose");
const User = require("./models/users");
const Items = require("./models/item");
const History = require("./models/history");
const Cart = require("./models/cart");
const Orders = require("./models/order");


// const passport= require("passport");
// const passportlocal=require("passport-local");
var cookieParser = require('cookie-parser');
var session = require('express-session');

todo=express();
let fs = require('fs');

todo.use(cookieParser());
// todo.use(session({secret: "Shh, its a secret!"}));
todo.use(require("express-session")(
{
    secret:"i don't have any",
    resave:false,
    saveUninitialized:false
}));
todo.use(function(req,res,next){
    res.locals.session = req.session;
    next();
});
// todo.use(passport.initialize());
// todo.use(passport.session());
// passport.use(new passportlocal(User.authenticate()));
// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());



const port=5555;
todo.use(body.urlencoded({extended:true}));


//mongoose.connect("mongoosedb://localhost/defarm");
DBSERVER="mongodb+srv://abhishek:abhishek@786@cluster0-18gre.mongodb.net/defarm?retryWrites=true&w=majority"
mongoose.connect(DBSERVER, {useNewUrlParser: true,useUnifiedTopology: true});

todo.set("view engine","ejs");
todo.use(express.static("public"));





//-----------------ROUT-------------------

todo.get("/prediction", function (req, res) {
    res.render("prediction");
});


todo.get("/historical", function (req, res) {
   res.render("historical");

});


todo.get("/contactus", function (req, res) {
    res.render("contactus");
 
 });



todo.get("/", function (req, response) {
    response.render("homepage");
});



todo.get("/dashboard",isLoggedIn, function (req, res) {
    res.render("dashboard");
});


todo.get("/contactus", function (req, res) {
    res.render("contactus");
});


todo.get("/buyandsell",isLoggedIn,function (req, res) {
    Items.find({},function(err,items)
    {   if(err)
        {
            console.log(err);
            res.render("error");
        }
        
        console.log(items);
        res.render("buyandsell",{items:items});
    });


});

todo.get("/dashboard",isLoggedIn, function (req, res) {
    res.render("dashboard");
});


todo.get("/suggestion",isLoggedIn, function (req, res) {
    res.render("suggestion");
});




todo.post("/register",function( req,res) {
    const user={
    username:req.body.username,
    password:req.body.password,
    email:req.body.email,
    aadhar_number:req.body.aadhar_number,
    contact_number:req.body.contact_number,
    profile_pic:req.body.profile_pic,
    type:req.body.type,
    address:req.body.address
    }
    console.log(user);
    User.findOne({contact_number:req.body.contact_number},function(err,found)
    {
        if(err)
        {console.log(err);
        res.send("Pls Try after some time");
        }
        else if(found)
        res.send("aadhar number is alredy registered");
        else{
            User.create(user,function(err,user){
                if(err){
                    console.log(err);
                    res.send("Error occured in the database");
                }
                else
                {   console.log(user);
                    res.render("login_t");
                }
            });
        }
    
    });    
});




    
todo.get("/register",function( req,res) {
    res.render("register");

});



todo.post("/login",function( req,res) {
    var user=
    {
        contact_number:req.body.contact_number,
        password:req.body.password
    }
    console.log(user);
    User.findOne(user,function(err,user)
    {
        if(err)
        {
            console.log(err);
            res.send("error occured in login");
        }
        if(user)
        {
            console.log("congrates");
            console.log(user);
            req.session.user=user;
            res.render("dashboard");
        }
        if(!user)
        {
            
            res.render("login_t");
        }
    });
});

todo.get("/login", function (req, res) {
    res.render("login_t");
});

todo.get("/seedItem", function (req, res) {

   res.render("seedItem");
});

todo.post("/seedItem", function (req, res) {

    sheed(req,res);
});



todo.get("/addToCart/:name/:q", function (req, res) {
    var cartdata = {
        itemname:req.params.name,
        username:req.session.user._id
    }
    let topush={
        itemname:req.params.name,
        username:req.session.user._id,
        quantity:req.params.q
    }
    console.log(req.params.q+" from add to cart rout");

    Cart.findOne(cartdata,function(err,cart)
    {
        if(err){
            console.log(err);
            res.render("error");
        }

        if(cart)
            {
                Cart.findOneAndDelete(cartdata,function(err,cart){
                    if(err){
                        console.log(err);
                        res.render("error");
                    }

            Cart.create(topush,function(err,data)
            {
                if(err){
                console.log(err);
                res.send("error");
            }
            res.send("true")
        
            });
            
                })
                
        }

        
            else{Cart.create(topush,function(err,data)
                {
                    if(err){
                    console.log(err);
                    res.send("error");
                }
                res.send("true")
            
                });}
            
    });

});




todo.get("/cart",isLoggedIn, function (req, res) {
            
     
    Cart.find({username:req.session.user._id},function(err,cart)
    {
        if(err){
            console.log(err);
            res.render("error");
        }
        if(cart)
            {
                console.log(cart)
            res.render("cart",{cart:cart});   
        }
    });

});

todo.get("/cart/remove/:name",isLoggedIn, function (req, res) {
    Cart.findOneAndDelete({username:req.session.user._id,itemname:req.params.name},function(err,cart)
    {
        if(err){
            console.log(err);
            res.send("error");
        }
        if(cart)
            {
            res.send("true") 
        }
        else
        res.send("false") 
    });
});


todo.get("/order",isLoggedIn, function (req, res) {
    let i=[];
    let quantity=[];
    let stopwatch=0;
    Cart.find({username:req.session.user._id}, function(err,cartdata)
    {
        if(err){
            console.log(err);
            res.send("error");
        }
        if(cartdata)
        {
            cartdata.forEach(function(item)
            {
               
                Items.findOne({name:item.itemname},function(err,itemdata)
                {   
                if(err){
                    console.log(err);
                    res.send("error");
                }
                if(itemdata)
                {
                    i.push(itemdata); 
                    quantity.push(item.quantity);
                }
                
                if(stopwatch==cartdata.length-1)
                    {
                    console.log(i);
                    res.render("order",{item:i,quantity:quantity});
                }
                stopwatch++;
            }); 

        });
        
    }
    else{ res.render("error");}
   

    })
});






todo.post("/order",isLoggedIn, function (req, res) {
    let p=[];
    let i=0;
    Cart.find({username:req.session.user._id},function(err,cart)
    {
        if(err){
            console.log(err);
            res.render("error");
        }
        if(cart)
            {
                cart.forEach(function(cartdata)
                {
                    
                    Items.findOne({name:cartdata.itemname},function(err,itemdata)
                    {
                        var o=
                        {
                            username:req.session.user._id,
                            typ:req.session.user.type,
                            name:req.body.name,
                            itemname:cartdata.itemname,
                            deliverydate:req.body.date,
                            zip:req.body.zip,
                            contact:req.body.contact,
                            address1:req.body.address1,
                            address2:req.body.address2,
                            address3:req.body.address3,
                            address4:req.body.address4,
                            address5:req.body.address5,
                            quantity:cartdata.quantity,
                            price:itemdata.price
                        }
                        Orders.create(o,function(err,orderdata)
                        {
                            if(err){
                                console.log(err);
                                res.render("error");
                            }
                            if(orderdata)
                            {
                               
                                i++;
                            }
                            if(cart.length==i)
                            {
                                Orders.find({username:req.session.user._id},function(err,orderdata)
                                {
                                    if(err){
                                        console.log(err);
                                        res.render("error");
                                    }
                                    else res.render("history",{order:orderdata});

                                })
                                

                            }

                        })
                    })
                    

                })


        }
    });

    
    


});





todo.get("/history",isLoggedIn, function (req, res) {
    Orders.find({username:req.session.user._id},function(err,orderdata)
                                {
                                    if(err){
                                        console.log(err);
                                        res.render("error");
                                    }
                                    else res.render("history",{order:orderdata});

                                })
});



todo.get("*", function (req, res) {
    res.render("error");
});




function isLoggedIn(req,res,next)
{
    if(req.session.user)
    {
        return next();
    }
    res.render("login_t");
}




//-----------//ROUT-----------------



//-----------listener------------------------

todo.listen(port,function()
{
    console.log("server has been started on PORT no "+ port);
});





// var u={
//     username:req.body.username,
//     password:req.body.password
// }
// User.findOne(u,function (err,users) { 
//     if(err)
//     {
//         res.send("error");
//     }
//     else if(users)
//     {
//         res.send("user already exists with this details")
//     }

//     else{

//     user.create(u,function(err,data){
//         if(err){
//             console.log(err);
//             res.send("error");
//         }
           
//         else{
//             console.log(data);
//             res.send("DONE");
//         }
//     });
        
//     }
// });





// var auth={
//     email:req.body.email, 
//     password:req.body.password
// }
// console.log(auth);
// user.findOne(auth,function(err,users)
// {
//     if(err)
//     {
//         res.send("pls try after sometime");
//     }
//     else if(!users){
//         res.send("wrong password");
//     }
//     else
//      res.send("verified");


// });

function sheed(req,res)
{
    
    var items={
    name:req.body.name,
    image:req.body.image,
    Quantity:100,
    price:req.body.price

        }
        console.log(items+"from seedItem");
    Items.create(items,function(err,item)
    {
        if(err)
        {
            console.log(err);
            res.render("error")
        }
        else
        res.send("sent data")
    });
}

