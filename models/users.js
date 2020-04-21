
const mongoose = require("mongoose");

var user= mongoose.Schema({
    username:String,
    password:String,
    email:String,
    aadhar_number:String,
    contact_number:String,
    profile_pic:String,
    type:String,
    address:String,
});

module.exports=mongoose.model("users",user);