import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { BookingsPage } from './pages/BookingsPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { RoomDetailPage } from './pages/RoomDetailPage';
import { RoomsPage } from './pages/RoomsPage';

export function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Navigate to="/rooms" replace />} />
        <Route path="/rooms" element={<RoomsPage />} />
        <Route path="/rooms/:roomId" element={<RoomDetailPage />} />
        <Route path="/bookings" element={<BookingsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
