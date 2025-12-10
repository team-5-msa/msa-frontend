import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import type { Performance, Review } from '../types';
import './PerformanceDetailPage.css';

function extractUserIdFromToken(token: string | null): string | null {
  if (!token) return null;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    return payload.sub || payload.userId || payload.user_id || payload.id || null;
  } catch {
    return null;
  }
}

export default function PerformanceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [performance, setPerformance] = useState<Performance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [seatCount, setSeatCount] = useState(1);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsError, setReviewsError] = useState('');
  const [newReview, setNewReview] = useState({ rating: 5, content: '' });
  const [editingReviewId, setEditingReviewId] = useState<number | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [editingRating, setEditingRating] = useState(5);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadPerformance(parseInt(id));
    }
    // userId 초기화
    const token = localStorage.getItem('token');
    setCurrentUserId(extractUserIdFromToken(token));
  }, [id]);

  const loadPerformance = async (performanceId: number) => {
    try {
      setLoading(true);
      const data = await apiService.getPerformanceById(performanceId);
      setPerformance(data);
      // 리뷰도 로드
      loadReviews(performanceId);
    } catch (err: any) {
      setError(err.message || '공연 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const loadReviews = async (performanceId: number) => {
    try {
      setReviewsLoading(true);
      const data = await apiService.getPerformanceReviews(performanceId);
      // Handle different response formats
      const reviewArray = Array.isArray(data) ? data : data?.data || [];
      setReviews(reviewArray);
    } catch (err: any) {
      console.error('Failed to load reviews:', err);
      // 리뷰 로드 실패해도 공연 정보는 표시
      setReviewsError('리뷰를 불러올 수 없습니다.');
    } finally {
      setReviewsLoading(false);
    }
  };

  const handleBooking = () => {
    if (!performance) return;
    navigate(`/booking/${performance.id}`, {
      state: { performance, seatCount },
    });
  };

  const handleCreateReview = async () => {
    if (!performance || !newReview.content.trim()) return;
    try {
      const review = await apiService.createReview({
        rating: newReview.rating,
        content: newReview.content,
        performanceId: performance.id,
      });
      setReviews([review, ...reviews]);
      setNewReview({ rating: 5, content: '' });
    } catch (err: any) {
      console.error('Failed to create review:', err);
    }
  };

  const handleUpdateReview = async (reviewId: number) => {
    if (!editingContent.trim()) return;
    try {
      const updated = await apiService.updateReview(reviewId, {
        rating: editingRating,
        content: editingContent,
      });
      setReviews(reviews.map((r) => (r.id === reviewId ? updated : r)));
      setEditingReviewId(null);
      setEditingContent('');
    } catch (err: any) {
      console.error('Failed to update review:', err);
    }
  };

  const handleDeleteReview = async (reviewId: number) => {
    if (!window.confirm('리뷰를 삭제하시겠습니까?')) return;
    try {
      await apiService.deleteReview(reviewId);
      setReviews(reviews.filter((r) => r.id !== reviewId));
    } catch (err: any) {
      console.error('Failed to delete review:', err);
    }
  };

  const getCategoryBadge = (category: string) => {
    const badges: Record<string, string> = {
      MUSICAL: '🎭 뮤지컬',
      THEATER: '🎪 연극',
      CONCERT: '🎵 콘서트',
      EXHIBITION: '🖼️ 전시',
      MOVIE: '🎬 영화',
    };
    return badges[category] || category;
  };

  if (loading) {
    return (
      <div className='loading-container'>
        <div className='loading'></div>
        <p>공연 정보를 불러오는 중...</p>
      </div>
    );
  }

  if (error || !performance) {
    return (
      <div className='error-container'>
        <p className='error-message'>{error || '공연을 찾을 수 없습니다.'}</p>
        <button className='btn btn-primary' onClick={() => navigate('/performances')}>
          목록으로 돌아가기
        </button>
      </div>
    );
  }

  const totalPrice = performance.price * seatCount;
  const canBook = performance.availableSeats >= seatCount && seatCount > 0 && seatCount <= 10;

  return (
    <div className='performance-detail-page'>
      <button className='btn-back' onClick={() => navigate('/performances')}>
        ← 목록으로
      </button>

      <h1 className='detail-title'>{performance.title}</h1>

      <div className='detail-container'>
        <div className='detail-image-section'>
          {performance.imageUrl ? (
            <img src={performance.imageUrl} alt={performance.title} className='detail-image' />
          ) : (
            <div className='detail-placeholder'>
              <span className='placeholder-icon'>🎭</span>
            </div>
          )}
          <div className='image-overlay'>
            <div className='category-badge'>{getCategoryBadge(performance.category)}</div>
          </div>
        </div>

        <div className='detail-content'>
          <div className='detail-description'>
            <h3>공연 소개</h3>
            <p>{performance.description}</p>
          </div>

          <div className='detail-info-list'>
            <div className='info-list-item'>
              <span className='info-list-label'>📍 공연장</span>
              <span className='info-list-value'>{performance.venue}</span>
            </div>

            <div className='info-list-item'>
              <span className='info-list-label'>💰 가격</span>
              <span className='info-list-value'>{performance.price.toLocaleString()}원</span>
            </div>

            <div className='info-list-item'>
              <span className='info-list-label'>🎫 잔여 좌석</span>
              <span
                className={`info-list-value ${
                  performance.availableSeats > 0 ? 'available' : 'sold-out'
                }`}>
                {performance.availableSeats > 0
                  ? `${performance.availableSeats}석 / ${performance.totalSeats}석`
                  : '매진'}
              </span>
            </div>
          </div>
        </div>

        {performance.availableSeats > 0 && (
          <div className='booking-section'>
            <h3>예매하기</h3>

            <div className='seat-selector'>
              <label htmlFor='seatCount'>좌석 수</label>
              <div className='seat-input-group'>
                <button
                  className='seat-btn'
                  onClick={() => setSeatCount(Math.max(1, seatCount - 1))}
                  disabled={seatCount <= 1}>
                  -
                </button>
                <input
                  type='number'
                  id='seatCount'
                  value={seatCount}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 1;
                    setSeatCount(Math.min(10, Math.max(1, value)));
                  }}
                  min='1'
                  max='10'
                />
                <button
                  className='seat-btn'
                  onClick={() => setSeatCount(Math.min(10, seatCount + 1))}
                  disabled={seatCount >= 10}>
                  +
                </button>
              </div>
              <span className='seat-hint'>최대 10석까지 예매 가능합니다</span>
            </div>

            <div className='price-summary'>
              <div className='price-row'>
                <span>좌석 수</span>
                <span>{seatCount}석</span>
              </div>
              <div className='price-row'>
                <span>좌석당 가격</span>
                <span>{performance.price.toLocaleString()}원</span>
              </div>
              <div className='price-row total'>
                <span>총 금액</span>
                <span className='total-price'>{totalPrice.toLocaleString()}원</span>
              </div>
            </div>

            <button
              className='btn btn-primary btn-book'
              onClick={handleBooking}
              disabled={!canBook}>
              {canBook ? '예매하기' : '예매 불가'}
            </button>

            {seatCount > performance.availableSeats && (
              <p className='warning-message'>선택한 좌석 수가 잔여 좌석보다 많습니다.</p>
            )}
          </div>
        )}

        {performance.availableSeats === 0 && (
          <div className='sold-out-message'>
            <h3>😢 매진되었습니다</h3>
            <p>다음 기회에 만나요!</p>
          </div>
        )}
      </div>

      {/* Reviews Section - Outside detail-container */}
      <div className='reviews-section'>
        <h2 className='reviews-title'>리뷰</h2>

        {/* Review Creation Form */}
        <div className='review-form'>
          <div className='form-group'>
            <label>별점</label>
            <div className='rating-selector'>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  className={`star-btn ${newReview.rating >= star ? 'active' : ''}`}
                  onClick={() => setNewReview({ ...newReview, rating: star })}>
                  ★
                </button>
              ))}
            </div>
          </div>
          <textarea
            className='review-textarea'
            placeholder='리뷰를 작성해주세요'
            value={newReview.content}
            onChange={(e) => setNewReview({ ...newReview, content: e.target.value })}
          />
          <button
            className='btn btn-primary'
            onClick={handleCreateReview}
            disabled={!newReview.content.trim()}>
            리뷰 작성
          </button>
        </div>

        {reviewsError && <div className='error-message'>{reviewsError}</div>}

        {reviewsLoading ? (
          <div className='reviews-loading'>로딩 중...</div>
        ) : reviews.length === 0 ? (
          <div className='no-reviews'>아직 리뷰가 없습니다.</div>
        ) : (
          <div className='reviews-list'>
            {reviews.map((review) => (
              <div key={review.id} className='review-card'>
                {editingReviewId === review.id ? (
                  // Edit mode
                  <div className='review-edit-form'>
                    <div className='form-group'>
                      <label>별점</label>
                      <div className='rating-selector'>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            className={`star-btn ${editingRating >= star ? 'active' : ''}`}
                            onClick={() => setEditingRating(star)}>
                            ★
                          </button>
                        ))}
                      </div>
                    </div>
                    <textarea
                      className='review-textarea'
                      value={editingContent}
                      onChange={(e) => setEditingContent(e.target.value)}
                    />
                    <div className='review-actions'>
                      <button
                        className='btn btn-primary btn-sm'
                        onClick={() => handleUpdateReview(review.id)}>
                        저장
                      </button>
                      <button
                        className='btn btn-secondary btn-sm'
                        onClick={() => setEditingReviewId(null)}>
                        취소
                      </button>
                    </div>
                  </div>
                ) : (
                  // View mode
                  <>
                    <div className='review-header'>
                      <div className='review-rating'>
                        {'★'.repeat(review.rating)}
                        {'☆'.repeat(5 - review.rating)}
                      </div>
                      <span className='review-date'>
                        {new Date(review.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className='review-content'>{review.content}</p>
                    {currentUserId && String(currentUserId) === String(review.userId) && (
                      <div className='review-actions'>
                        <button
                          className='btn btn-secondary btn-sm'
                          onClick={() => {
                            setEditingReviewId(review.id);
                            setEditingContent(review.content);
                            setEditingRating(review.rating);
                          }}>
                          수정
                        </button>
                        <button
                          className='btn btn-danger btn-sm'
                          onClick={() => handleDeleteReview(review.id)}>
                          삭제
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
