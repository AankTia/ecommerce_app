import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";

const ProductFilters = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [categories, setCategories] = useState([]);
    const [priceRange, setPriceRange] = useState({
        min: "",
        max: "",
    });

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await fetch("/api/v1/categories");
                const data = await response.json();
                setCategories(data);
            } catch (error) {
                console.error("Error fetching categories:", error);
            }
        };

        fetchCategories();
    }, []);

    const handleCategoryChange = (categoryId) => {
        const newSearchParams = new URLSearchParams(searchParams);
        if (categoryId) {
            newSearchParams.set("category_id", categoryId);
        } else {
            newSearchParams.delete("category_id");
        }
        setSearchParams(newSearchParams);
    };

    const handlePriceChange = (e) => {
        const { name, value } = e.target;
        setPriceRange((prev) => ({ ...prev, [name]: value }));
    };

    const applyPriceFilter = () => {
        const newSearchParams = new URLSearchParams(searchParams);
        if (priceRange.min) {
            newSearchParams.set("min_price", priceRange.min);
        } else {
            newSearchParams.delete("min_price");
        }
        if (priceRange.max) {
            newSearchParams.set("max_price", priceRange.max);
        } else {
            newSearchParams.delete("max_price");
        }
        setSearchParams(newSearchParams);
    };

    const clearFilters = () => {
        setPriceRange({ min: "", max: "" });
        setSearchParams({});
    };

    return (
        <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-semibold text-lg mb-4">Filters</h3>

            <div className="mb-6">
                <h4 className="font-medium mb-2">Categories</h4>
                <div className="space-y-2">
                    <label className="flex items-center">
                        <input
                            type="radio"
                            name="category"
                            checked={!searchParams.get("category_id")}
                            onChange={() => handleCategoryChange("")}
                            className="mr-2"
                        />
                        <span>All Categories</span>
                    </label>
                    {categories.map((category) => (
                        <label key={category.id} className="flex items-center">
                            <input
                                type="radio"
                                name="category"
                                checked={searchParams.get("category_id") === category.id.to_s()}
                                onChange={() => handleCategoryChange(category.id)}
                                className="mr-2"
                            />
                            <span>{category.name}</span>
                        </label>
                    ))}
                </div>
            </div>

            <div className="mb-6">
                <h4 className="font-medium mb-2">Price Range</h4>
                <div className="grid grid-cols-2 gap-2 mb-2">
                    <div>
                        <label className="block text-sm text-gray-500 mb-1">Min</label>
                        <input
                            type="number"
                            name="min"
                            value={priceRange.min}
                            onChange={handlePriceChange}
                            placeholder="$0"
                            className="w-full p-2 border rounded"
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-500 mb-1">Max</label>
                        <input
                            type="number"
                            name="max"
                            value={priceRange.max}
                            onChange={handlePriceChange}
                            placeholder="$1000"
                            className="w-full p-2 border rounded"
                        />
                    </div>
                </div>
                <button
                    onClick={applyPriceFilter}
                    className="w-full bg-primary-600 text-white py-2 rounded hover:bg-primary-700">
                    Apply Price Filter
                </button>
            </div>

            <button
                onClick={clearFilters}
                className="w-full py-2 border rounded hover:bg-gray-50">
                Clear All Filters
            </button>
        </div>
    );
};

export default ProductFilters;