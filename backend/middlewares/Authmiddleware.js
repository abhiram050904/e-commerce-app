const jwt =require('jsonwebtoken');
const User =require('../models/userModel.js')

 const authMiddleWare = async (req, res, next) => {
  const accessToken = req.cookies.accessToken;

  if (!accessToken) {
    return res.status(401).json({ message: "Unauthorized - No access token provided" });
  }

  try {
    const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      return res.status(401).json({ message: "Unauthorized - User not found" });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Unauthorized - Access token expired" });
    }

    console.error("Error in protectRoute middleware", error.message);
    return res.status(401).json({ message: "Unauthorized - Invalid access token" });
  }
};


module.exports={authMiddleWare}
