const express=require('express');
const router=express.Router();
const Checkpoint=require('../models/Checkpoint');
const Alert=require('../models/Alert');
const auth=require('../middleware/authMiddleware');

router.post('/',auth,async(req,res)=>{
const checkpoint=new Checkpoint(req.body);
await checkpoint.save();

if(req.body.temperature>10){
const alert=new Alert({message:"Temperature too high"});
await alert.save();
}

res.json(checkpoint);
});

module.exports=router;
