const express=require('express');
const router=express.Router();
const bcrypt=require('bcryptjs');
const jwt=require('jsonwebtoken');
const User=require('../models/User');

router.post('/register',async(req,res)=>{
const {email,password,role}=req.body;
const hashed=await bcrypt.hash(password,10);
const user=new User({email,password:hashed,role});
await user.save();
const token=jwt.sign({email,role},process.env.JWT_SECRET);
res.json({token,role});
});

router.post('/login',async(req,res)=>{
const {email,password}=req.body;
const user=await User.findOne({email});
if(!user) return res.status(400).json({message:"User not found"});
const match=await bcrypt.compare(password,user.password);
if(!match) return res.status(400).json({message:"Wrong password"});
const token=jwt.sign({email:user.email,role:user.role},process.env.JWT_SECRET);
res.json({token,role:user.role});
});

module.exports=router;
