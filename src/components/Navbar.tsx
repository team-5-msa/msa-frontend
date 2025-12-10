import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Navbar.css';

export default function Navbar() {
  const { logout } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <nav className='navbar'>
      <div className='navbar-container'>
        <Link to='/performances' className='navbar-brand'>
          <h1>🎬 MovieBook</h1>
        </Link>

        <div className='navbar-menu'>
          <Link
            to='/performances'
            className={`nav-link ${isActive('/performances') ? 'active' : ''}`}>
            공연 목록
          </Link>
          <Link
            to='/my-bookings'
            className={`nav-link ${isActive('/my-bookings') ? 'active' : ''}`}>
            예매 내역
          </Link>
          <Link to='/my-reviews' className={`nav-link ${isActive('/my-reviews') ? 'active' : ''}`}>
            내 리뷰
          </Link>
          <button className='btn-logout' onClick={logout}>
            로그아웃
          </button>
        </div>
      </div>
    </nav>
  );
}
