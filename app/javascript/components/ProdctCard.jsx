import React from "react";

const ProductCard = ({ product, onAddToCart }) => {
    return (
        <div className="max-w-sm rounded overflow-hidden shadow-lg m-4">
            <img className="w-full" src={product.image_url} alt={product.name} />
            <div className="px-6 py-4">
                <div className="font-bold text-xl mb-2">{product.name}</div>
                <p className="text-gray-700 text-base">{product.description}</p>
            </div>
            <div className="px-6 pt-4 pb-2 flex justify-between items-center">
                <span className="text-2xl font-bold">${product.price}</span>
                <button
                    onClick={() => onAddToCart(product)}
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                    Add to Cart
                </button>
            </div>
        </div>
    )
}

export default ProductCard;