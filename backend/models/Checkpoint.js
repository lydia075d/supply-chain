const mongoose=require('mongoose');

const CheckpointSchema=new mongoose.Schema({
batchId:String,
location:String,
temperature:String,
time:{type:Date,default:Date.now}
});

module.exports=mongoose.model('Checkpoint',CheckpointSchema);
