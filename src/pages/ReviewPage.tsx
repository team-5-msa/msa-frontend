import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import type { Review } from '../types';
import './ReviewPage.css';

export function ReviewPage() {
  const { performanceId } = useParams<{ performanceId: string }>();
  const navigate = useNavigate();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);

  useEffect(() => {
    loadReviews();
  }, [performanceId]);

  const loadReviews = async () => {
    try {
      setLoading(true);
      if (performanceId) {
        const data = await apiService.getPerformanceReviews(Number(performanceId));
        // Handle both array and wrapped response formats
        const reviewArray = Array.isArray(data) ? data : data?.data || [];
        setReviews(reviewArray);
      }
    } catch (err: any) {
      console.error('ReviewPage - loadReviews error:', err);

      if (err.response?.status === 401) {
        console.log('401 Unauthorized - Logging out');
        apiService.logout();
        return;
      }

      const errorMsg = err.response?.data?.message || err.message || '리뷰를 불러올 수 없습니다.';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!performanceId) return;

      if (editingId) {
        const response = await apiService.updateReview(editingId, {
          rating,
          content,
        });
        if (response.success && response.data) {
          setReviews(reviews.map((r) => (r.id === editingId ? response.data! : r)));
          setEditingId(null);
        }
      } else {
        const response = await apiService.createReview({
          performanceId: Number(performanceId),
          rating,
          content,
        });
        if (response.success && response.data) {
          setReviews([...reviews, response.data]);
        }
      }
      setRating(5);
      setContent('');
      setShowForm(false);
    } catch (err) {
      setError('리뷰 저장에 실패했습니다.');
      console.error(err);
    }
  };

  const handleDelete = async (reviewId: number) => {
    if (window.confirm('정말 이 리뷰를 삭제하시겠습니까?')) {
      try {
        await apiService.deleteReview(reviewId);
        setReviews(reviews.filter((r) => r.id !== reviewId));
      } catch (err) {
        setError('리뷰 삭제에 실패했습니다.');
        console.error(err);
      }
    }
  };

  const handleEdit = (review: Review) => {
    setEditingId(review.id);
    setRating(review.rating);
    setContent(review.content);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setRating(5);
    setContent('');
  };

  if (loading) {
    return <div className='review-page'>로딩 중...</div>;
  }

  return (
    <div className='review-page'>
      <div className='review-container'>
        <div className='review-header'>
          <h2>리뷰</h2>
          {!showForm && (
            <button className='btn-add-review' onClick={() => setShowForm(true)}>
              리뷰 작성
            </button>
          )}
        </div>

        {error && <div className='error-message'>{error}</div>}

        {showForm && (
          <form className='review-form' onSubmit={handleSubmit}>
            <div className='form-group'>
              <label>별점</label>
              <div className='rating-input'>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type='button'
                    className={`star ${rating >= star ? 'active' : ''}`}
                    onClick={() => setRating(star)}>
                    ★
                  </button>
                ))}
              </div>
              <span className='rating-value'>{rating}/5</span>
            </div>

            <div className='form-group'>
              <label>내용</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder='리뷰를 작성해주세요...'
                required
                minLength={10}
              />
            </div>

            <div className='form-buttons'>
              <button type='submit' className='btn-submit'>
                {editingId ? '수정' : '작성'}
              </button>
              <button type='button' className='btn-cancel' onClick={handleCancel}>
                취소
              </button>
            </div>
          </form>
        )}

        <div className='reviews-list'>
          {reviews.length === 0 ? (
            <p className='no-reviews'>아직 리뷰가 없습니다.</p>
          ) : (
            reviews.map((review) => (
              <div key={review.id} className='review-item'>
                <div className='review-header-item'>
                  <div className='review-info'>
                    <div className='review-rating'>
                      {'★'.repeat(review.rating)}
                      {'☆'.repeat(5 - review.rating)}
                    </div>
                    <span className='review-date'>
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className='review-actions'>
                    <button className='btn-edit' onClick={() => handleEdit(review)}>
                      수정
                    </button>
                    <button className='btn-delete' onClick={() => handleDelete(review.id)}>
                      삭제
                    </button>
                  </div>
                </div>
                <p className='review-content'>{review.content}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
