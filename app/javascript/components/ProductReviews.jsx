import React, { useState } from "react";
import { useParams } from "react-router-dom";

const ProductReviews = ({ reviews, onReviewSubmit }) => {
    const { id } = useParams();
    const [newReview, setNewReview] = useState({
        rating: 5,
        comment: "",
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        onReviewSubmit(id, newReview);
        setNewReview({
            rating: 5,
            comment: "",
        });
    };

    return (
        <div className="mt-8">
            <h3 className="text-xl font-semibold mb-4">Customer Reviews</h3>

            {reviews.length === 0 ? (
                <p className="text-gray-500">No reviews yet. Be the first to review!</p>
            ) : (
                <div className="space-y-4">
                    {reviews.map((review) => (
                        <div key={review.id} className="border-b pb-4">
                            <div className="flex items-center mb-2">
                                <div className="flex">
                                    {[...Array(5)].map((_, i) => (
                                        <svg
                                            key={i}
                                            className={`w-5 h-5 ${i < review.rating ? "text-yellow-400" : "text-gray-300"
                                                }`}
                                            fill="currentColor"
                                            viewBox="0 0 20 20">
                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                        </svg>
                                    ))}
                                </div>
                                <span className="ml-2 text-sm text-gray-500">
                                    by {review.user_name} on{" "}
                                    {new Date(review.created_at).toLocaleDateString()}
                                </span>
                            </div>
                            <p className="text-gray-700">{review.comment}</p>
                        </div>
                    ))}
                </div>
            )}

            <div className="mt-8">
                <h4 className="text-lg font-medium mb-2">Write a Review</h4>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Rating
                        </label>
                        <div className="flex">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setNewReview({ ...newReview, rating: star })}
                                    className="focus:outline-none">
                                    <svg
                                        className={`w-8 h-8 ${star <= newReview.rating
                                                ? "text-yellow-400"
                                                : "text-gray-300"
                                            }`}
                                        fill="currentColor"
                                        viewBox="0 0 20 20">
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Comment
                        </label>
                        <textarea
                            value={newReview.comment}
                            onChange={(e) =>
                                setNewReview({ ...newReview, comment: e.target.value })
                            }
                            rows={4}
                            className="w-full p-2 border rounded focus:ring-primary-500 focus:border-primary-500"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="bg-primary-600 text-white py-2 px-4 rounded hover:bg-primary-700">
                        Submit Review
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ProductReviews;