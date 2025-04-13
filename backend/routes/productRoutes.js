const express=require('express')
const { authMiddleWare, adminMiddleware } = require('../middlewares/Authmiddleware')
const { getAllProducts,getFeaturedProducts,createProduct,deleteProduct,getRecommendedProducts, getProductsByCategory,toggleFeaturedProducts} = require('../controllers/productController')

const router=express.Router()

router.get("/",authMiddleWare,adminMiddleware,getAllProducts)
router.get("/featured",getFeaturedProducts)
router.get("/recommendations",getRecommendedProducts)
router.post("/",authMiddleWare,adminMiddleware,createProduct)
router.delete("/:id",authMiddleWare,adminMiddleware,deleteProduct)
router.get("/category/:category", getProductsByCategory)
router.patch("/:id",authMiddleWare,adminMiddleware,toggleFeaturedProducts)
module.exports=router