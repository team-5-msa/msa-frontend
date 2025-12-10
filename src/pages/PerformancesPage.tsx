import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import type { Performance } from '../types';
import './PerformancesPage.css';

export default function PerformancesPage() {
  const [performances, setPerformances] = useState<Performance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadPerformances();
  }, []);

  const loadPerformances = async () => {
    try {
      setLoading(true);
      const data = await apiService.getPerformances();
      setPerformances(data);
    } catch (err) {
      setError((err as Error).message || '공연 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
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
        <p>공연 목록을 불러오는 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className='error-container'>
        <p className='error-message'>{error}</p>
        <button className='btn btn-primary' onClick={loadPerformances}>
          다시 시도
        </button>
      </div>
    );
  }

  return (
    <div className='performances-page'>
      <div className='page-header'>
        <h1>🎬 공연 목록</h1>
        <p>원하시는 공연을 선택해주세요</p>
      </div>

      <div className='performances-grid'>
        {performances.map((performance) => (
          <div
            key={performance.id}
            className='performance-card'
            onClick={() => navigate(`/performances/${performance.id}`)}>
            <div className='performance-image'>
              {performance.imageUrl ? (
                <img src={performance.imageUrl} alt={performance.title} />
              ) : (
                <div className='performance-placeholder'>
                  <span className='placeholder-icon'>🎭</span>
                </div>
              )}
              <div className='performance-category'>{getCategoryBadge(performance.category)}</div>
            </div>

            <div className='performance-content'>
              <h3 className='performance-title'>{performance.title}</h3>
              <p className='performance-venue'>📍 {performance.venue}</p>
              <p className='performance-description'>{performance.description}</p>

              <div className='performance-footer'>
                <div className='performance-price'>{performance.price.toLocaleString()}원</div>
                <div className='performance-seats'>
                  <span
                    className={
                      performance.availableSeats > 0 ? 'seats-available' : 'seats-sold-out'
                    }>
                    {performance.availableSeats > 0
                      ? `${performance.availableSeats}석 남음`
                      : '매진'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {performances.length === 0 && (
        <div className='empty-state'>
          <p>현재 등록된 공연이 없습니다.</p>
        </div>
      )}
    </div>
  );
}
