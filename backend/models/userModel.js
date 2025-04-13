const mongoose=require('mongoose')
const bcrypt=require('bcryptjs')
const userSchema=new mongoose.Schema({
    name:{
        type:String,
        required:[true,"Name is required"]
    },
    email:{
        type:String,
        required:[true,"email is required"],
        unique:true,
        lowercase:true,
        trim:true
    },
    password:{
        type:String,
        required:[true,"Password is required"],
        minLength:[8,"Password must be atleast 8 characters long"]
    },
    cartItems:[
        {
            quantity:{
            type:Number,
            default:1
        },
        product:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"Product"
        }
    }
   ],
   role:{
    type:String,
    enum:["customer","admin"],
    default:"customer"
   }
},{timestamps:true})



userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (err) {
        console.error(err);
        next(err); 
    }
});


userSchema.methods.comparePassword=async function(password){
    return bcrypt.compare(password,this.password)
}

const User=mongoose.model("User",userSchema)

module.exports=User