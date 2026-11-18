import { NavLink } from 'react-router-dom';
import { useAppSelector } from '../../store/hooks';
import { selectCurrentUser } from '../../store/selectors';
import { ConnectionBadge } from './ConnectionBadge';

export function Header() {
  const currentUser = useAppSelector(selectCurrentUser);
  return (
    <header className="app-header">
      <div className="app-header-inner">
        <NavLink to="/rooms" className="wordmark" aria-label="BookRoom, переговорные">
          BookRoom
        </NavLink>
        <nav className="app-nav" aria-label="Основная навигация">
          <NavLink
            to="/rooms"
            className={({ isActive }) => (isActive ? 'nav-link is-active' : 'nav-link')}
          >
            Переговорные
          </NavLink>
          <NavLink
            to="/bookings"
            className={({ isActive }) => (isActive ? 'nav-link is-active' : 'nav-link')}
          >
            Мои бронирования
          </NavLink>
        </nav>
        <div className="account">
          <ConnectionBadge />
          {currentUser && (
            <>
              <span className="account-name">{currentUser.displayName}</span>
              <span className="avatar" title={currentUser.displayName}>
                {currentUser.initials}
              </span>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
