// src/app/watchlist/page.tsx
import Navbar from '../../components/navigation/Navbar';
import Watchlist from '../../components/dashboard/Watchlist';
import Link from 'next/link';
export default function WatchlistPage() {
  return (
    <main className="min-h-screen bg-white">
      <Navbar />
      <nav className="px-6 mt-4 flex items-center gap-4 text-sm">
        <Link href="/home" className="text-black text-2xl" style={{ fontFamily: 'Rubik, sans-serif', fontSize: '23px' }}>Home</Link>
        <span className="text-black text-2xl" style={{ fontFamily: 'Rubik, sans-serif', fontSize: '23px' }}>&gt;</span>
        <Link href="/watchlist" className="text-black text-2xl" style={{ fontFamily: 'Rubik, sans-serif', fontSize: '23px' }}>Watchlists</Link>
      </nav>
      <div className="container mx-auto px-4 md:px-40 py-8">
        <Watchlist />
      </div>
    </main>
  );
}