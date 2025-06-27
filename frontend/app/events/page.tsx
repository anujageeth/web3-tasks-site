'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAccount } from 'wagmi'
import Link from 'next/link'
import { EventCard } from '@/components/ui/event-card'
import { Button } from '@/components/ui/button'
import { Meteors } from '@/components/ui/meteors'
import { FiArrowLeft, FiPlus, FiArrowRight, FiArrowLeft as FiPrevious, FiSearch, FiX } from 'react-icons/fi'
import { PageWrapper } from '@/components/ui/page-wrapper'
import { GlassCard } from '@/components/ui/glass-card'
import { motion } from 'framer-motion'
import { useDebounce } from '@/hooks/useDebounce'

interface Event {
  _id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  totalPoints: number;
  imageUrl?: string;
  creator: {
    address: string;
    firstName: string;
    lastName: string;
  };
  participants: Array<any>;
}

export default function EventsPage() {
  const router = useRouter();
  const { isConnected } = useAccount();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchActive, setSearchActive] = useState(false);
  const fetchingRef = useRef(false);
  const debouncedSearchTerm = useDebounce(searchTerm, 500); // Debounce to avoid excessive API calls
  
  const fetchEvents = useCallback(async (page: number, search: string = '') => {
    if (fetchingRef.current) return; // Prevent duplicate requests
    
    fetchingRef.current = true;
    setLoading(true);
    
    try {
      // Add search parameter to the API call
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: '12',
        ...(search ? { search } : {})
      }).toString();

      const response = await fetch(`/api/events?${queryParams}`, {
        headers: {
          'Cache-Control': 'max-age=60, stale-while-revalidate=120'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to load events');
      }
      
      const data = await response.json();
      setEvents(data.events);
      setTotalPages(data.totalPages);
      
      // Cache with search term included in key
      const cacheKey = `events_page_${page}_search_${search}`;
      sessionStorage.setItem(cacheKey, JSON.stringify({
        events: data.events,
        totalPages: data.totalPages,
        timestamp: Date.now()
      }));
    } catch (err) {
      console.error('Error fetching events:', err);
      setError('Failed to load events');
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, []);
  
  useEffect(() => {
    if (!isConnected) {
      router.push('/login');
      return;
    }
    
    // Reset to page 1 when search term changes
    if (debouncedSearchTerm && currentPage !== 1) {
      setCurrentPage(1);
      return;
    }
    
    // Try to get cached data first with search term
    const cacheKey = `events_page_${currentPage}_search_${debouncedSearchTerm}`;
    const cachedData = sessionStorage.getItem(cacheKey);
    
    if (cachedData) {
      const { events: cachedEvents, totalPages: cachedPages, timestamp } = JSON.parse(cachedData);
      // Use cache if less than 30 seconds old
      if (Date.now() - timestamp < 30000) {
        setEvents(cachedEvents);
        setTotalPages(cachedPages);
        setLoading(false);
        return;
      }
    }
    
    fetchEvents(currentPage, debouncedSearchTerm);
  }, [currentPage, debouncedSearchTerm, isConnected, router, fetchEvents]);
  
  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  // Add a function to handle search clearing
  const clearSearch = () => {
    setSearchTerm('');
    setSearchActive(false);
  }

  return (
    <PageWrapper>
      {/* Background effects */}
      <Meteors number={8} />
      
      <div className="max-w-6xl mx-auto">
        <motion.div 
          className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl font-bold gradient-text">Browse Events</h1>
          <div className="flex gap-4">
            <Button
              variant="secondary"
              animate
              onClick={() => router.push('/dashboard')}
              className="inline-flex items-center rounded-3xl glass-button" 
            >
              <FiArrowLeft className="mr-2" /> Dashboard
            </Button>
            <Button
              variant="primary"
              animate
              onClick={() => router.push('/events/create')}
              className="inline-flex items-center rounded-3xl glass-button"
            >
              <FiPlus className="mr-2" /> Create Event
            </Button>
          </div>
        </motion.div>
        
        {/* Search bar */}
        {/* <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search events..."
              className="w-full p-4 pr-12 rounded-3xl bg-black/20 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
            <button
              onClick={clearSearch}
              className="absolute right-3 top-3 text-gray-400 hover:text-gray-200 transition-colors"
            >
              <FiX />
            </button>
            <div className="absolute left-3 top-3 text-gray-400">
              <FiSearch />
            </div>
          </div>
        </motion.div> */}
        
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <div className="relative">
            <div className="flex rounded-full glass-border overflow-hidden backdrop-blur-md">
              <div className="flex items-center pl-4 pr-4 text-gray-400">
                <FiSearch size={20} />
              </div>
              <input
                type="text"
                placeholder="Search events by title, description, or creator..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setSearchActive(e.target.value.trim() !== '');
                }}
                className="flex-grow p-3 pl-2 bg-transparent text-white outline-none border-none"
              />
              {searchActive && (
                <button 
                  onClick={clearSearch}
                  className="flex items-center px-3 text-gray-400 hover:text-white transition-colors"
                >
                  <FiX size={18} />
                </button>
              )}
            </div>
          </div>
          
          {searchActive && debouncedSearchTerm && (
            <div className="mt-4 flex items-center justify-between text-sm">
              <div className="text-gray-300">
                {loading ? (
                  <span>Searching...</span>
                ) : (
                  <span>
                    Found <span className="text-light-green font-medium">{events.length}</span> 
                    {events.length === 1 ? ' event' : ' events'} for 
                    "<span className="text-light-green">{debouncedSearchTerm}</span>"
                  </span>
                )}
              </div>
              <button 
                onClick={clearSearch}
                className="text-gray-400 hover:text-light-green transition-colors text-sm underline"
              >
                Clear search
              </button>
            </div>
          )}
        </motion.div>
        
        {loading ? (
          <div className="py-12">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <motion.div 
                  key={i} 
                  className="animate-pulse rounded-[32px] overflow-hidden bg-black/20 backdrop-blur-sm glass-border"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                >
                  <div className="h-80 flex flex-col justify-between p-5">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 rounded-full bg-gray-800/50"></div>
                      <div className="h-4 w-24 bg-gray-800/50 rounded-full"></div>
                    </div>
                    <div>
                      <div className="h-6 w-3/4 bg-gray-800/50 rounded-lg mb-2"></div>
                      <div className="h-4 w-full bg-gray-800/30 rounded-lg"></div>
                      <div className="h-4 w-2/3 bg-gray-800/30 rounded-lg mt-2"></div>
                    </div>
                    <div>
                      <div className="grid grid-cols-3 gap-2 mb-3">
                        <div className="h-16 bg-gray-800/30 rounded-xl"></div>
                        <div className="h-16 bg-gray-800/30 rounded-xl"></div>
                        <div className="h-16 bg-gray-800/30 rounded-xl"></div>
                      </div>
                      <div className="h-10 bg-gray-800/50 rounded-full"></div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        ) : error ? (
          <GlassCard className="text-center py-12" animate>
            <p className="text-red-400">{error}</p>
            <Button 
              variant="primary" 
              className="mt-4 rounded-3xl glass-button"
              onClick={() => fetchEvents(currentPage)}
            >
              Retry
            </Button>
          </GlassCard>
        ) : (
          <>
            {events.length === 0 ? (
              <GlassCard className="p-10 text-center" animate highlight>
                <h2 className="text-xl font-semibold mb-4 text-white">No events found</h2>
                <p className="text-gray-400 mb-8">
                  There are currently no events available.
                </p>
                <Button
                  variant="primary"
                  size="lg"
                  animate
                  onClick={() => router.push('/events/create')}
                  className="inline-flex items-center rounded-3xl glass-button"
                >
                  <FiPlus className="mr-2" /> Create Your Event
                </Button>
              </GlassCard>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.map((event, index) => (
                  <motion.div
                    key={event._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.05 }}
                  >
                    <Link href={`/events/${event._id}`} className="block">
                      <EventCard event={event} />
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
            
            {/* Pagination */}
            {totalPages > 1 && (
              <motion.div 
                className="flex justify-center mt-12"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <nav className="glass-border flex items-center rounded-full px-4 py-2 backdrop-blur-md">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="rounded-full disabled:opacity-50 p-2"
                  >
                    <FiPrevious />
                  </Button>
                  
                  <div className="mx-4 text-white">
                    Page {currentPage} of {totalPages}
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="rounded-full disabled:opacity-50 p-2"
                  >
                    <FiArrowRight />
                  </Button>
                </nav>
              </motion.div>
            )}
          </>
        )}
      </div>
    </PageWrapper>
  );
}