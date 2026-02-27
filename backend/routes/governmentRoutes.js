const express=require('express');
const router=express.Router();
const Batch=require('../models/Batch');
const Alert=require('../models/Alert');
const auth=require('../middleware/authMiddleware');

router.get('/government/batches',auth,async(req,res)=>{
const batches=await Batch.find();
res.json(batches);
});

router.get('/government/alerts',auth,async(req,res)=>{
const alerts=await Alert.find();
res.json(alerts);
});

module.exports=router;
