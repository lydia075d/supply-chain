const express=require('express');
const router=express.Router();
const Batch=require('../models/Batch');
const Checkpoint=require('../models/Checkpoint');

router.get('/verify/:id',async(req,res)=>{
const batch=await Batch.findById(req.params.id);
const checkpoints=await Checkpoint.find({batchId:req.params.id});
res.json({batch,checkpoints});
});

module.exports=router;
