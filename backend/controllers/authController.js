const User = require("../models/userModel")
const jwt=require('jsonwebtoken')
const redisClient = require("../redisconfig")

const generate_tokens=async(userId)=>{
    const accessToken=jwt.sign({userId},process.env.ACCESS_TOKEN_SECRET,{expiresIn:"15m"})

    const refreshToken=jwt.sign({userId},process.env.REFRESH_TOKEN_SECRET,{expiresIn:"15m"})

    return {accessToken,refreshToken}
}

const storeRefreshToken=async(userId,refreshToken)=>{
    await redisClient.set(`refreshToken:${userId}`,refreshToken,"EX",7*24*60*60)
}

const setCookies = async (res, accessToken, refreshToken) => {
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 15 * 60 * 1000, // 15 minutes
    });
  
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
  };


const signUp = async (req, res) => {
  try {
    const { email, name, password } = req.body;

    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const user = await User.create({ name, email, password });

    // Generate tokens
    const { accessToken, refreshToken } = await generate_tokens(user._id);

    await storeRefreshToken(user._id, refreshToken);


    await setCookies(res, accessToken, refreshToken); // safer to await

    res.status(201).json({

        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};


const login = async (req, res) => {
    try {
      const { email, password } = req.body;
  
      const user = await User.findOne({ email });
  
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
  
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
  
      const { accessToken, refreshToken } = await generate_tokens(user._id);
  
      await storeRefreshToken(user._id, refreshToken);
      await setCookies(res, accessToken, refreshToken); // safer with await
  
      return res.status(200).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: err.message });
    }
  };
  

const logOut=async(req,res)=>{

    try{
        
        const refreshToken=req.cookies.refreshToken
        if(refreshToken){
            const decoded=jwt.verify(refreshToken,process.env.REFRESH_TOKEN_SECRET)
            await  redisClient.del(`refreshToken:${decoded.userId}`)
        
            
        }

        res.clearCookie("accessToken")
        res.clearCookie("refreshToken")
        res.json({message:"logged out successfully"})
        
    }
    catch(err){
        console.log(err)
        res.status(500).json({message:`sevrver error`,error:err.message})
    }
}


const refreshTokenVerify = async (req, res) => {
    try {
      const refreshToken = req.cookies.refreshToken;
  
      if (!refreshToken) {
        return res.status(401).json({ message: 'No refresh token provided' });
      }
  
      const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
      const storedToken = await redisClient.get(`refreshToken:${decoded.userId}`);
  
      if (storedToken !== refreshToken) {
        return res.status(401).json({ message: "Invalid refresh token" });
      }
  
      const accessToken = jwt.sign(
        { userId: decoded.userId },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: "15m" }
      );
  
      res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 15 * 60 * 1000, // 15 minutes
      });
  
      return res.status(200).json({ message: "Access token refreshed" });
  
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Server error", error: err.message });
    }
  };
  

   const getProfile = async (req, res) => {
    try {
      const user = req.user; // set by protectRoute middleware
  
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
  
      res.status(200).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        cartItems: user.cartItems,
        createdAt: user.createdAt,
      });
    } catch (error) {
      console.error("Error in getProfile:", error.message);
      res.status(500).json({ message: "Server error", error: error.message });
    }
  };
  

module.exports={signUp,login,logOut,refreshTokenVerify,getProfile}