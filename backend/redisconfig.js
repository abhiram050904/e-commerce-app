const Redis =require("ioredis")
const dotenv=require('dotenv')
dotenv.config()

console.log("redis url is",process.env.REDIS_CONNECT)
const redisClient = new Redis(process.env.REDIS_CONNECT);


module.exports=redisClient
