const { cloudinary } = require("../configurations/cloudinary")
const Product = require("../models/productModel")
const redisClient = require("../redisconfig")


const updateFeaturedProductsCache=async()=>{
    try{

        const featuredProducts=await Product.find({isFeatured:true}).lean()
        await redisClient.set("featuredProducts",JSON.stringify(featuredProducts))
    }
    catch(err){
        console.log(`error in caching featuredproducts in redis`)
    }
}
const getAllProducts=async(req,res)=>{

    try{
        const products=await Product.find({})
        res.json({products})
    }
    catch(err){
        console.log(err)
        res.status(500).json({message:'internal server error',error:err})
    }
}

const getFeaturedProducts=async(req,res)=>{

    try{

        let featuredProducts=await redisClient.get('featuredProducts')
        if(featuredProducts){
            return res.status(201).json(JSON.parse(featuredProducts))
        }

        featuredProducts=await Product.find({isFeatured:true}).lean()

        if(!featuredProducts){
            return res.status(404).json({message:"no featured products not found"})
        }

        await redisClient.set("featuredProducts",JSON.stringify(featuredProducts))
    }
    catch(err){
        console.log(err)
        res.status(500).json({message:'internal server error',error:err})
    }
}


const createProduct=async(req,res)=>{

    try{

        const {name,description,price,image,category}=req.body

        let cloudinaryResponse=null

        if(image){
        cloudinaryResponse=await cloudinary.uploader.upload(image,{folder:"products"})
        }

        const product =await Product.create({
            name,
            description,
            price,
            image:cloudinaryResponse?.secure_url ? cloudinaryResponse?.secure_url :"",
            category
        })

        res.status(201).json(product)
    }
    catch(err){
        console.log(err)
        res.status(500).json({message:'internal server error',error:err})
    }

}

const deleteProduct=async(req,res)=>{

    try{
        const product=await Product.findById(req.params.id)

        if(!product){
            return res.status(404).json({message:"no  product not found"})
        }

        if(product.image){
            const publicId=product.image.split("/").pop().split(".")[0]
            try{
                await cloudinary.uploader.destroy(`products/${publicId}`)
                console.log('deleted the image from cloudinary')
            }
            catch(err){
                console.log(err)
            }
        }


        await Product.findByIdAndDelete(req.params.id)

        res.json({message:'product deleted successfully'})
    }


    catch(err){
        console.log(err)
        res.status(500).json({message:'internal server error',error:err})
    }
}


const getRecommendedProducts=async(req,res)=>{

    try{

        const product=await Product.aggregate([
            {
                $sample:{size:3}
            },
            {
                $project:{
                    _id:1,
                    name:1,
                    description:1,
                    image:1,
                    price:1
                }
            }
        ])
    }

    catch(err){
        console.log(err)
        res.status(500).json({message:'internal server error',error:err})
    }

}



const getProductsByCategory = async (req, res) => {
    try {
      const { category } = req.params; // or use req.query if you prefer query params
  
      if (!category) {
        return res.status(400).json({ message: "Category is required" });
      }
  
      const products = await Product.find({ category });
  
      if (!products || products.length === 0) {
        return res.status(404).json({ message: "No products found for this category" });
      }
  
      res.status(200).json({ products });
    } catch (err) {
      console.log(err);
      res.status(500).json({ message: "Internal server error", error: err.message });
    }
  };

  const toggleFeaturedProducts=async(req,res)=>{

    try{

        const product=await Product.findById(req.params.id)

        if(product){
            product.isFeatured=!product.isFeatured
            const updatedProduct=await product.save()
            await updateFeaturedProductsCache()
            res.json(updatedProduct)
        }
        else{
            res.status(404).json({message:"product not found"})
        }

    }
    catch (err) {
        console.log(err);
        res.status(500).json({ message: "Internal server error", error: err.message });
      }
  }

module.exports={getAllProducts,getFeaturedProducts,createProduct,deleteProduct,getRecommendedProducts,getProductsByCategory,toggleFeaturedProducts}