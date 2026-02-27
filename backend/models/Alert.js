const mongoose=require('mongoose');

const AlertSchema=new mongoose.Schema({
message:String,
time:{type:Date,default:Date.now}
});

module.exports=mongoose.model('Alert',AlertSchema);
