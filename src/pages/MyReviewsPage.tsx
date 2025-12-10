import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import type { Review } from '../types';
import './MyReviewsPage.css';

export function MyReviewsPage() {
  const navigate = useNavigate();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editRating, setEditRating] = useState(5);
  const [editContent, setEditContent] = useState('');

  useEffect(() => {
    loadMyReviews();
  }, []);

  const loadMyReviews = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getMyReviews();

      if (Array.isArray(data)) {
        setReviews(data);
      } else {
        setReviews([]);
      }
    } catch (err: unknown) {
      console.error('MyReviewsPage - loadMyReviews error:', err);
      const axiosErr = err as Record<string, unknown> & {
        response?: { status: number; data?: { message?: string } };
        message?: string;
      };

      if (axiosErr.response?.status === 401) {
        console.log('401 Unauthorized - but showing empty reviews instead of logout');
        setReviews([]);
        return;
      } else if (axiosErr.response?.status === 403) {
        setError('접근 권한이 없습니다.');
      } else if (axiosErr.response?.status === 404) {
        setReviews([]);
      } else {
        const errorMsg =
          (axiosErr.response?.data?.message as string) ||
          axiosErr.message ||
          '리뷰를 불러올 수 없습니다.';
        setError(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (review: Review) => {
    setEditingId(review.id);
    setEditRating(review.rating);
    setEditContent(review.content);
  };

  const handleSaveEdit = async (reviewId: number) => {
    try {
      const response = await apiService.updateReview(reviewId, {
        rating: editRating,
        content: editContent,
      });
      setReviews(reviews.map((r) => (r.id === reviewId ? response : r)));
      setEditingId(null);
    } catch (err) {
      setError('리뷰 수정에 실패했습니다.');
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

  const handleCancel = () => {
    setEditingId(null);
    setEditRating(5);
    setEditContent('');
  };

  if (loading) {
    return <div className='my-reviews-page'>로딩 중...</div>;
  }

  return (
    <div className='my-reviews-page'>
      <div className='my-reviews-container'>
        <h2>내 리뷰</h2>

        {error && <div className='error-message'>{error}</div>}

        <div className='reviews-list'>
          {reviews.length === 0 ? (
            <div className='no-reviews'>
              <p>아직 작성한 리뷰가 없습니다.</p>
              <button className='btn-browse-performances' onClick={() => navigate('/performances')}>
                공연 둘러보기
              </button>
            </div>
          ) : (
            reviews.map((review) => (
              <div key={review.id} className='review-item'>
                {editingId === review.id ? (
                  <div className='review-edit-form'>
                    <div className='form-group'>
                      <label>별점</label>
                      <div className='rating-input'>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type='button'
                            className={`star ${editRating >= star ? 'active' : ''}`}
                            onClick={() => setEditRating(star)}>
                            ★
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className='form-group'>
                      <label>내용</label>
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        required
                        minLength={10}
                      />
                    </div>

                    <div className='form-buttons'>
                      <button className='btn-save' onClick={() => handleSaveEdit(review.id)}>
                        저장
                      </button>
                      <button className='btn-cancel' onClick={handleCancel}>
                        취소
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className='review-header'>
                      <div className='review-info'>
                        <div className='review-rating'>
                          {'★'.repeat(review.rating)}
                          {'☆'.repeat(5 - review.rating)}
                        </div>
                        <span className='review-date'>
                          {new Date(review.createdAt).toLocaleDateString()}
                        </span>
                        <span className='review-performance-id'>
                          공연 ID: {review.performanceId}
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
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
