'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, MapPin, CheckCircle, XCircle, HourglassIcon, MessageSquare } from 'lucide-react';

type BookingRequest = {
  id: string;
  provider_id: string;
  provider_type: string;
  slot_id?: string;
  service_type?: string;
  aircraft_type?: string;
  rating_type?: string;
  requested_dates?: string[];
  message?: string;
  needs_examiner: boolean;
  has_examiner: boolean;
  needs_instructor: boolean;
  has_instructor: boolean;
  needs_copilot: boolean;
  has_copilot: boolean;
  selected_package?: string;
  package_price?: number;
  status: string;
  created_at: string;
  responded_at?: string;
  decline_reason?: string;
  expires_at?: string;
  provider?: {
    full_name: string;
    email: string;
  };
  sim_slots?: {
    aircraft_type: string;
    simulator_type: string;
    date: string;
    start_time: string;
    end_time: string;
    duration_hours: number;
    sim_companies: {
      company_name: string;
      location: string;
    };
  };
};

export default function MyBookingsPage() {
  const supabase = createClient();
  const [requests, setRequests] = useState<BookingRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMyBookings();
  }, []);

  async function loadMyBookings() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No user logged in');
        return;
      }
      console.log('Loading bookings for pilot:', user.id);

      // Get booking requests where this user is the pilot
      const { data: requestsData, error } = await supabase
        .from('booking_requests')
        .select(`
          *,
          provider:users!booking_requests_provider_id_fkey (
            full_name,
            email
          ),
          sim_slots!booking_requests_slot_id_fkey (
            aircraft_type,
            simulator_type,
            date,
            start_time,
            end_time,
            duration_hours,
            sim_companies (
              company_name,
              location
            )
          )
        `)
        .eq('pilot_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading bookings:', error);
        console.error('Error details:', error.message, error.details, error.hint);
      } else {
        console.log('Loaded bookings:', requestsData);
        setRequests(requestsData || []);
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  }

  function getBookingTitle(request: BookingRequest): string {
    if (request.sim_slots) {
      return `${request.sim_slots.aircraft_type} ${request.sim_slots.simulator_type}`;
    }
    if (request.provider_type === 'examiner') {
      return `${request.service_type} - ${request.aircraft_type || request.rating_type || ''}`;
    }
    if (request.provider_type === 'ame') {
      return request.service_type || 'Medical Examination';
    }
    return request.service_type || 'Booking';
  }

  function getBookingDate(request: BookingRequest): string {
    if (request.sim_slots) {
      return request.sim_slots.date;
    }
    if (request.requested_dates && request.requested_dates.length > 0) {
      return request.requested_dates[0];
    }
    return '';
  }

  async function handleCancelRequest(requestId: string, request: BookingRequest) {
    if (!confirm('Are you sure you want to cancel this booking? The slot will become available again.')) return;

    try {
      // Cancel the booking request
      const { error } = await supabase
        .from('booking_requests')
        .update({ status: 'cancelled' })
        .eq('id', requestId);

      if (error) throw error;

      // Release the slot (make it available again)
      if (request.provider_type === 'examiner') {
        await supabase
          .from('examiner_slots')
          .update({ 
            booking_status: 'available',
            booking_request_id: null 
          })
          .eq('booking_request_id', requestId);
      } else if (request.provider_type === 'ame') {
        await supabase
          .from('ame_slots')
          .update({ 
            booking_status: 'available',
            booking_request_id: null 
          })
          .eq('booking_request_id', requestId);
      } else if (request.slot_id) {
        await supabase
          .from('simulator_slots')
          .update({ 
            booking_status: 'available',
            booking_request_id: null 
          })
          .eq('id', request.slot_id);
      }

      alert('Booking cancelled successfully. The slot is now available again.');
      await loadMyBookings();
    } catch (err: any) {
      console.error('Error cancelling request:', err);
      alert('Failed to cancel: ' + err.message);
    }
  }

  async function handleRescheduleRequest(requestId: string) {
    const newDate = prompt('Enter new preferred date (YYYY-MM-DD):');
    if (!newDate) return;

    try {
      const { error } = await supabase
        .from('booking_requests')
        .update({ 
          requested_dates: [newDate],
          status: 'pending', // Reset to pending for provider to re-confirm
          message: `Reschedule request: New date ${newDate}`
        })
        .eq('id', requestId);

      if (error) throw error;

      alert('Reschedule request sent to provider!');
      await loadMyBookings();
    } catch (err: any) {
      console.error('Error rescheduling:', err);
      alert('Failed to reschedule: ' + err.message);
    }
  }

  async function handleDeleteRequest(requestId: string) {
    if (!confirm('Delete this booking from your history? This cannot be undone.')) return;

    try {
      const { error } = await supabase
        .from('booking_requests')
        .delete()
        .eq('id', requestId);

      if (error) throw error;

      alert('Booking deleted from history.');
      await loadMyBookings();
    } catch (err: any) {
      console.error('Error deleting:', err);
      alert('Failed to delete: ' + err.message);
    }
  }

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const confirmedRequests = requests.filter(r => r.status === 'confirmed');
  const declinedRequests = requests.filter(r => r.status === 'declined' || r.status === 'cancelled');

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-12">
        <div className="text-center text-neutral-400">Loading your bookings...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">My Bookings</h1>
        <p className="text-neutral-400">
          Track your booking requests and confirmed sessions
        </p>
      </div>

      {/* Empty State */}
      {requests.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50 text-neutral-400" />
            <h3 className="text-lg font-semibold text-white mb-2">No bookings yet</h3>
            <p className="text-neutral-400 mb-4">Start by browsing available simulators or examiners</p>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => window.location.href = '/simulators'}>
                Browse Simulators
              </Button>
              <Button variant="outline" onClick={() => window.location.href = '/examiners'}>
                Find Examiners
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Confirmed Bookings */}
      {confirmedRequests.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            Confirmed ({confirmedRequests.length})
          </h2>
          <div className="space-y-4">
            {confirmedRequests.map((request) => (
              <Card key={request.id} className="border-green-500/30">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{getBookingTitle(request)}</CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-2">
                        {request.sim_slots && (
                          <>
                            <MapPin className="w-4 h-4" />
                            <span>{request.sim_slots.sim_companies.company_name}</span>
                            <span>•</span>
                            <span>{request.sim_slots.sim_companies.location}</span>
                          </>
                        )}
                        {!request.sim_slots && request.provider && (
                          <>
                            <MapPin className="w-4 h-4" />
                            <span>{request.provider.full_name}</span>
                            <span>•</span>
                            <span className="capitalize">{request.provider_type}</span>
                          </>
                        )}
                      </CardDescription>
                    </div>
                    <span className="text-xs px-2 py-1 rounded bg-green-500/20 text-green-500 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Confirmed
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Session Details */}
                  <div className="p-4 rounded-lg bg-neutral-900 space-y-2">
                    <div className="flex items-center gap-4 text-sm text-neutral-400">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {getBookingDate(request) && new Date(getBookingDate(request)).toLocaleDateString('en-GB', {
                            weekday: 'short',
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                      {request.sim_slots && (
                        <>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            <span>
                              {request.sim_slots.start_time} - {request.sim_slots.end_time}
                            </span>
                          </div>
                          <span>({request.sim_slots.duration_hours}h)</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Package Info */}
                  {request.selected_package && request.selected_package !== 'sim_only' && (
                    <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
                      <p className="text-sm text-blue-400">
                        Package: {request.selected_package.replace(/_/g, ' ')}
                      </p>
                    </div>
                  )}

                  {/* Price */}
                  {request.package_price && (
                    <div className="flex items-center justify-between py-2 border-t border-neutral-800">
                      <span className="text-sm text-neutral-400">Total Price:</span>
                      <span className="text-xl font-bold text-white">€{request.package_price.toFixed(2)}</span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-3">
                    <Button className="w-full" onClick={() => window.location.href = '/messages'}>
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Chat
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => handleRescheduleRequest(request.id)}
                    >
                      <Calendar className="w-4 h-4 mr-2" />
                      Reschedule
                    </Button>
                  </div>
                  <Button 
                    variant="ghost" 
                    className="w-full text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    onClick={() => handleCancelRequest(request.id, request)}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Cancel Booking
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <HourglassIcon className="w-5 h-5 text-yellow-500" />
            Awaiting Response ({pendingRequests.length})
          </h2>
          <div className="space-y-4">
            {pendingRequests.map((request) => (
              <Card key={request.id} className="border-yellow-500/30">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{getBookingTitle(request)}</CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-2">
                        {request.sim_slots && (
                          <>
                            <MapPin className="w-4 h-4" />
                            <span>{request.sim_slots.sim_companies.company_name}</span>
                          </>
                        )}
                        {!request.sim_slots && request.provider && (
                          <>
                            <MapPin className="w-4 h-4" />
                            <span>{request.provider.full_name}</span>
                            <span>•</span>
                            <span className="capitalize">{request.provider_type}</span>
                          </>
                        )}
                      </CardDescription>
                    </div>
                    <span className="text-xs px-2 py-1 rounded bg-yellow-500/20 text-yellow-500">
                      Pending
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {request.sim_slots && (
                    <div className="p-4 rounded-lg bg-neutral-900 space-y-2">
                      <div className="flex items-center gap-4 text-sm text-neutral-400">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(request.sim_slots.date).toLocaleDateString('en-GB')}</span>
                        <Clock className="w-4 h-4" />
                        <span>{request.sim_slots.start_time} - {request.sim_slots.end_time}</span>
                      </div>
                    </div>
                  )}

                  <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                    <p className="text-sm text-yellow-400">
                      ⏳ Waiting for provider to respond {request.expires_at && `(expires ${new Date(request.expires_at).toLocaleDateString('en-GB')})`}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => handleRescheduleRequest(request.id)}
                    >
                      <Calendar className="w-4 h-4 mr-2" />
                      Reschedule
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full text-red-400 hover:text-red-300"
                      onClick={() => handleCancelRequest(request.id, request)}
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Declined Requests */}
      {declinedRequests.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <XCircle className="w-5 h-5 text-red-500" />
            Declined & Cancelled ({declinedRequests.length})
          </h2>
          <div className="space-y-4">
            {declinedRequests.map((request) => (
              <Card key={request.id} className="border-red-500/30">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{getBookingTitle(request)}</CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-2">
                        {request.sim_slots && (
                          <>
                            <MapPin className="w-4 h-4" />
                            <span>{request.sim_slots.sim_companies.company_name}</span>
                          </>
                        )}
                        {!request.sim_slots && request.provider && (
                          <>
                            <MapPin className="w-4 h-4" />
                            <span>{request.provider.full_name}</span>
                            <span>•</span>
                            <span className="capitalize">{request.provider_type}</span>
                          </>
                        )}
                      </CardDescription>
                    </div>
                    <span className="text-xs px-2 py-1 rounded bg-red-500/20 text-red-500">
                      {request.status === 'cancelled' ? 'Cancelled' : 'Declined'}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {request.decline_reason && (
                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                      <p className="text-sm font-medium text-red-400 mb-1">Reason:</p>
                      <p className="text-sm text-neutral-400">{request.decline_reason}</p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    <Button variant="outline" className="w-full" onClick={() => window.location.href = '/messages'}>
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Contact Provider
                    </Button>
                    <Button 
                      variant="ghost"
                      className="w-full text-neutral-400 hover:text-neutral-300"
                      onClick={() => handleDeleteRequest(request.id)}
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Delete from History
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
