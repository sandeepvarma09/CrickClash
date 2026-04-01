import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--color-surface)' }}>
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
