import { useState } from 'react';
import { StarIcon } from '@heroicons/react/24/solid';
import { ChatBubbleLeftIcon } from '@heroicons/react/24/outline';

const ReviewsList = ({ reviews, averageRating, totalReviews }) => {
  const [showAll, setShowAll] = useState(false);
  
  if (!reviews || reviews.length === 0) {
    return (
      <div className="text-center py-8 bg-gray-50 rounded-lg">
        <ChatBubbleLeftIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-500">No reviews yet. Be the first to review this product!</p>
      </div>
    );
  }

  const displayReviews = showAll ? reviews : reviews.slice(0, 3);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div>
      {/* Rating Summary */}
      <div className="flex items-center gap-4 mb-6 pb-6 border-b">
        <div className="text-center">
          <span className="text-4xl font-bold text-gray-900">{averageRating.toFixed(1)}</span>
          <span className="text-gray-500 block">out of 5</span>
        </div>
        <div className="flex-grow">
          <div className="flex items-center gap-2 mb-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <StarIcon
                key={star}
                className={`h-5 w-5 ${
                  star <= Math.round(averageRating)
                    ? 'text-yellow-400'
                    : 'text-gray-300'
                }`}
              />
            ))}
          </div>
          <p className="text-gray-600">Based on {totalReviews} reviews</p>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-6">
        {displayReviews.map((review) => (
          <div key={review.id} className="border-b last:border-0 pb-6 last:pb-0">
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="font-semibold">{review.user_name || review.user_email}</span>
                <div className="flex items-center gap-1 mt-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <StarIcon
                      key={star}
                      className={`h-4 w-4 ${
                        star <= review.rating
                          ? 'text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
              <span className="text-sm text-gray-500">{formatDate(review.created_at)}</span>
            </div>
            <p className="text-gray-700">{review.comment}</p>
          </div>
        ))}
      </div>

      {/* Show More/Less Button */}
      {reviews.length > 3 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
        >
          {showAll ? 'Show Less' : `Show All ${reviews.length} Reviews`}
        </button>
      )}
    </div>
  );
};

export default ReviewsList;