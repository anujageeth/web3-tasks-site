'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAccount } from 'wagmi'
import Link from 'next/link'

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
  const router = useRouter()
  const { isConnected } = useAccount()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  
  useEffect(() => {
    if (!isConnected) {
      router.push('/login')
      return
    }
    
    fetchEvents(currentPage)
  }, [currentPage, isConnected, router])
  
  const fetchEvents = async (page: number) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/events?page=${page}&limit=12`)
      
      if (!response.ok) {
        throw new Error('Failed to load events')
      }
      
      const data = await response.json()
      setEvents(data.events)
      setTotalPages(data.totalPages)
    } catch (err) {
      console.error('Error fetching events:', err)
      setError('Failed to load events')
    } finally {
      setLoading(false)
    }
  }
  
  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return
    setCurrentPage(page)
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Browse Events</h1>
          <div className="space-x-4">
            <Link 
              href="/dashboard" 
              className="py-2 px-4 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Back to Dashboard
            </Link>
            <Link 
              href="/events/create" 
              className="py-2 px-4 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Create Event
            </Link>
          </div>
        </div>
        
        {loading ? (
          <div className="text-center py-12">
            <p>Loading events...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600">{error}</p>
          </div>
        ) : (
          <>
            {events.length === 0 ? (
              <div className="text-center py-12">
                <h2 className="text-xl font-semibold mb-4">No events found</h2>
                <p className="text-gray-600 mb-8">
                  There are currently no events available.
                </p>
                <Link 
                  href="/events/create" 
                  className="py-2 px-6 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Create Your Event
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.map(event => (
                  <Link href={`/events/${event._id}`} key={event._id} className="block">
                    <div className="border rounded-lg overflow-hidden hover:shadow-md transition duration-200">
                      {event.imageUrl ? (
                        <img 
                          src={event.imageUrl} 
                          alt={event.title} 
                          className="w-full h-40 object-cover"
                        />
                      ) : (
                        <div className="w-full h-40 bg-gray-200 flex items-center justify-center">
                          <span className="text-gray-500">No image</span>
                        </div>
                      )}
                      
                      <div className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold">{event.title}</h3>
                          <span className={`px-2 py-0.5 rounded-full text-xs ${event.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                            {event.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        
                        <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                          {event.description}
                        </p>
                        
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>
                            {event.participants.length} participant{event.participants.length !== 1 ? 's' : ''}
                          </span>
                          <span>{event.totalPoints} points</span>
                        </div>
                        
                        <div className="mt-3 pt-3 border-t text-xs text-gray-500">
                          <p>
                            Created by: {event.creator.firstName || event.creator.address.substring(0, 8)}
                          </p>
                          <p>
                            Ends: {new Date(event.endDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-8">
                <nav className="flex items-center">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1 rounded border disabled:opacity-50"
                  >
                    Previous
                  </button>
                  
                  <div className="mx-4">
                    Page {currentPage} of {totalPages}
                  </div>
                  
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 rounded border disabled:opacity-50"
                  >
                    Next
                  </button>
                </nav>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}