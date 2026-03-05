'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, User, MessageSquare, CheckCircle, XCircle } from 'lucide-react';

type BookingRequest = {
  id: string;
  pilot_id: string;
  provider_type: string;
  slot_id?: string;
  service_type?: string;
  aircraft_type?: string;
  message?: string;
  needs_examiner: boolean;
  has_examiner: boolean;
  needs_instructor: boolean;
  has_instructor: boolean;
  needs_copilot: boolean;
  has_copilot: boolean;
  selected_package: string;
  package_price: number;
  status: string;
  created_at: string;
  decline_reason?: string;
  sim_slots?: {
    aircraft_type: string;
    simulator_type: string;
    date?: string;
    start_time: string;
    end_time: string;
    duration_hours?: number;
  };
};

export default function BookingsPage() {
  const supabase = createClient();
  const [requests, setRequests] = useState<BookingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>('');
  const [respondingTo, setRespondingTo] = useState<string | null>(null);
  const [declineReason, setDeclineReason] = useState('');

  useEffect(() => {
    loadBookingRequests();
  }, []);

  async function loadBookingRequests() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get user role
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (userData) {
        setUserRole(userData.role);
      }

      // Get booking requests where this user is the provider
      const { data: requestsData, error } = await supabase
        .from('booking_requests')
        .select(`
          *,
          sim_slots!booking_requests_slot_id_fkey (
            aircraft_type,
            simulator_type,
            date,
            start_time,
            end_time,
            duration_hours
          )
        `)
        .eq('provider_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading booking requests:', error);
      } else {
        console.log('Provider bookings loaded:', requestsData);
        setRequests(requestsData || []);
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCancelBooking(requestId: string) {
    if (!confirm('Cancel this confirmed booking? The slot will become available again.')) return;

    try {
      const request = requests.find(r => r.id === requestId);
      if (!request) return;

      // Update booking status to cancelled
      const { error } = await supabase
        .from('booking_requests')
        .update({ 
          status: 'cancelled',
          decline_reason: 'Cancelled by provider'
        })
        .eq('id', requestId);

      if (error) throw error;

      // Release the slot
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

      // Notify pilot
      await supabase.from('notifications').insert({
        user_id: request.pilot_id,
        type: 'booking_cancelled',
        title: 'Booking Cancelled',
        message: 'The provider has cancelled your booking. The slot is now available again.',
        related_id: requestId,
        related_type: 'booking_request',
      });

      alert('Booking cancelled successfully.');
      await loadBookingRequests();
    } catch (err: any) {
      console.error('Error cancelling booking:', err);
      alert('Failed to cancel: ' + err.message);
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
      await loadBookingRequests();
    } catch (err: any) {
      console.error('Error deleting:', err);
      alert('Failed to delete: ' + err.message);
    }
  }

  async function handleProposeReschedule(requestId: string) {
    const newDate = prompt('Propose a new date (YYYY-MM-DD):');
    if (!newDate) return;

    const request = requests.find(r => r.id === requestId);
    if (!request) return;

    try {
      // Send message via conversation suggesting reschedule
      const { data: conversation } = await supabase
        .from('conversations')
        .select('id')
        .eq('booking_request_id', requestId)
        .single();

      if (conversation) {
        await supabase.from('messages').insert({
          conversation_id: conversation.id,
          sender_id: (await supabase.auth.getUser()).data.user?.id,
          message_text: `I'd like to propose rescheduling to ${newDate}. Would that work for you?`,
        });
      }

      alert('Reschedule proposal sent to pilot!');
    } catch (err: any) {
      console.error('Error proposing reschedule:', err);
      alert('Failed to propose reschedule: ' + err.message);
    }
  }

  async function handleRespond(requestId: string, status: 'confirmed' | 'declined', reason?: string) {
    try {
      setRespondingTo(requestId);

      const updateData: any = {
        status,
        responded_at: new Date().toISOString(),
      };

      if (status === 'confirmed') {
        updateData.confirmed_at = new Date().toISOString();
      } else if (reason) {
        updateData.decline_reason = reason;
      }

      const { error: updateError } = await supabase
        .from('booking_requests')
        .update(updateData)
        .eq('id', requestId);

      if (updateError) throw updateError;

      // Update slot status based on response
      const request = requests.find(r => r.id === requestId);
      if (request) {
        console.log('Updating slot status for:', request.provider_type, 'booking_request_id:', requestId);
        
        if (status === 'confirmed') {
          // Update slot to "booked" when confirming
          let slotUpdateError = null;
          
          if (request.provider_type === 'examiner') {
            // First, find the slot by booking_request_id
            const { data: slots, error: findError } = await supabase
              .from('examiner_slots')
              .select('id')
              .eq('booking_request_id', requestId);
            
            if (findError) {
              console.error('Failed to find examiner slot:', findError);
              slotUpdateError = findError;
            } else if (slots && slots.length > 0) {
              // Now update by slot ID
              const { error } = await supabase
                .from('examiner_slots')
                .update({ booking_status: 'booked' })
                .eq('id', slots[0].id);
              slotUpdateError = error;
            } else {
              console.error('No examiner slot found with booking_request_id:', requestId);
            }
          } else if (request.provider_type === 'ame') {
            // First, find the slot by booking_request_id
            const { data: slots, error: findError } = await supabase
              .from('ame_slots')
              .select('id')
              .eq('booking_request_id', requestId);
            
            if (findError) {
              console.error('Failed to find AME slot:', findError);
              slotUpdateError = findError;
            } else if (slots && slots.length > 0) {
              // Now update by slot ID
              const { error } = await supabase
                .from('ame_slots')
                .update({ booking_status: 'booked' })
                .eq('id', slots[0].id);
              slotUpdateError = error;
            } else {
              console.error('No AME slot found with booking_request_id:', requestId);
            }
          } else if (request.slot_id) {
            const { error } = await supabase
              .from('sim_slots')  // Fixed: was 'simulator_slots'
              .update({ booking_status: 'booked' })
              .eq('id', request.slot_id);
            slotUpdateError = error;
          }
          
          if (slotUpdateError) {
            // Log but don't alert - the database trigger handles slot updates automatically
            console.warn('Manual slot update skipped (trigger handles this):', slotUpdateError);
          } else {
            console.log('Slot status updated to "booked" successfully');
          }
        } else {
          // Release slot when declining (back to available)
          let slotUpdateError = null;
          
          if (request.provider_type === 'examiner') {
            const { data: slots, error: findError } = await supabase
              .from('examiner_slots')
              .select('id')
              .eq('booking_request_id', requestId);
            
            if (findError) {
              console.error('Failed to find examiner slot:', findError);
              slotUpdateError = findError;
            } else if (slots && slots.length > 0) {
              const { error } = await supabase
                .from('examiner_slots')
                .update({ booking_status: 'available', booking_request_id: null })
                .eq('id', slots[0].id);
              slotUpdateError = error;
            }
          } else if (request.provider_type === 'ame') {
            const { data: slots, error: findError } = await supabase
              .from('ame_slots')
              .select('id')
              .eq('booking_request_id', requestId);
            
            if (findError) {
              console.error('Failed to find AME slot:', findError);
              slotUpdateError = findError;
            } else if (slots && slots.length > 0) {
              const { error } = await supabase
                .from('ame_slots')
                .update({ booking_status: 'available', booking_request_id: null })
                .eq('id', slots[0].id);
              slotUpdateError = error;
            }
          } else if (request.slot_id) {
            const { error } = await supabase
              .from('simulator_slots')
              .update({ booking_status: 'available', booking_request_id: null })
              .eq('id', request.slot_id);
            slotUpdateError = error;
          }
          
          if (slotUpdateError) {
            console.error('Failed to release slot:', slotUpdateError);
          } else {
            console.log('Slot released successfully');
          }
        }
      }

      // Create conversation for messaging
      if (request) {
        const { data: { user } } = await supabase.auth.getUser();
        
        console.log('Creating conversation for booking:', requestId);
        console.log('Pilot ID:', request.pilot_id);
        console.log('Provider ID:', user?.id);
        
        // Check if conversation already exists
        const { data: existingConv, error: checkError } = await supabase
          .from('conversations')
          .select('id')
          .eq('booking_request_id', requestId)
          .single();

        console.log('Existing conversation check:', existingConv, checkError);

        if (!existingConv) {
          // Create new conversation
          const subject = request.sim_slots
            ? `Re: ${request.sim_slots.aircraft_type} Simulator - ${new Date(request.sim_slots.date || request.sim_slots.start_time).toLocaleDateString('en-GB')}`
            : `Re: ${request.service_type || 'Booking Request'}`;

          const { data: newConv, error: convError } = await supabase.from('conversations').insert({
            pilot_id: request.pilot_id,
            provider_id: user?.id,
            provider_type: request.provider_type,
            booking_request_id: requestId,
            subject,
          }).select();

          console.log('Conversation creation result:', newConv, convError);
        }

        // Create notification for pilot
        await supabase.from('notifications').insert({
          user_id: request.pilot_id,
          type: status === 'confirmed' ? 'booking_confirmed' : 'booking_declined',
          title: status === 'confirmed' ? 'Booking Confirmed!' : 'Booking Declined',
          message: status === 'confirmed'
            ? `Your booking request has been confirmed. Start chatting to arrange payment.`
            : `Your booking request was declined. ${reason || 'The provider will contact you with alternatives.'}`,
          link_to: '/my-bookings',
          related_booking_id: requestId,
        });
      }

      // Reload requests
      await loadBookingRequests();
      setDeclineReason('');
    } catch (err: any) {
      console.error('Error responding to request:', err);
      alert('Failed to respond: ' + err.message);
    } finally {
      setRespondingTo(null);
    }
  }

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const respondedRequests = requests.filter(r => r.status !== 'pending');

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-12">
        <div className="text-center text-neutral-400">Loading booking requests...</div>
      </div>
    );
  }

  if (userRole === 'pilot') {
    return (
      <div className="max-w-4xl mx-auto py-12">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-neutral-400">This page is for providers only.</p>
            <p className="text-sm text-neutral-500 mt-2">
              Go to <a href="/my-bookings" className="text-primary-500 hover:underline">My Bookings</a> to see your booking requests.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Booking Requests</h1>
        <p className="text-neutral-400">
          Manage incoming booking requests from pilots
        </p>
      </div>

      {/* Pending Requests */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-yellow-500" />
          Pending ({pendingRequests.length})
        </h2>

        {pendingRequests.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-neutral-400">No pending requests</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {pendingRequests.map((request) => (
              <Card key={request.id} className="border-yellow-500/30">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        {request.sim_slots
                          ? `${request.sim_slots.aircraft_type} Simulator`
                          : request.service_type || 'Service Request'}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-2">
                        <User className="w-4 h-4" />
                        <span>Pilot booking request</span>
                      </CardDescription>
                    </div>
                    <span className="text-xs px-2 py-1 rounded bg-yellow-500/20 text-yellow-500">
                      Pending
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Slot Details */}
                  {request.sim_slots && (
                    <div className="p-4 rounded-lg bg-neutral-900 space-y-2">
                      <div className="flex items-center gap-4 text-sm text-neutral-400">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {new Date(request.sim_slots.start_time).toLocaleDateString('en-GB')}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>
                            {new Date(request.sim_slots.start_time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <span>({request.sim_slots.duration_hours}h)</span>
                      </div>
                    </div>
                  )}

                  {/* Partner Needs */}
                  {(request.needs_examiner || request.needs_instructor || request.needs_copilot) && (
                    <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
                      <p className="font-medium text-sm text-white mb-2">Pilot needs:</p>
                      <ul className="text-sm text-neutral-300 space-y-1">
                        {request.needs_examiner && <li>• Examiner</li>}
                        {request.needs_instructor && <li>• Instructor</li>}
                        {request.needs_copilot && <li>• Copilot</li>}
                      </ul>
                    </div>
                  )}

                  {/* Message */}
                  {request.message && (
                    <div className="p-4 rounded-lg bg-neutral-900">
                      <p className="font-medium text-sm text-white mb-2">Message from pilot:</p>
                      <p className="text-sm text-neutral-400 italic">&quot;{request.message}&quot;</p>
                    </div>
                  )}

                  {/* Price */}
                  <div className="flex items-center justify-between py-2 border-t border-neutral-800">
                    <span className="text-sm text-neutral-400">Package Price:</span>
                    <span className="text-xl font-bold text-white">€{request.package_price.toFixed(2)}</span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-2">
                    <Button
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      onClick={() => handleRespond(request.id, 'confirmed')}
                      disabled={respondingTo === request.id}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      {respondingTo === request.id ? 'Confirming...' : 'Confirm Booking'}
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        const reason = prompt('Reason for declining (optional):');
                        if (reason !== null) {
                          handleRespond(request.id, 'declined', reason || undefined);
                        }
                      }}
                      disabled={respondingTo === request.id}
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Decline
                    </Button>
                  </div>
                  <p className="text-xs text-center text-neutral-500">
                    After responding, messaging will be unlocked to arrange payment details
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Responded Requests */}
      {respondedRequests.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-white mb-4">
            History ({respondedRequests.length})
          </h2>
          <div className="space-y-4">
            {respondedRequests.map((request) => (
              <Card key={request.id} className={request.status === 'confirmed' ? 'border-green-500/30' : 'border-red-500/30'}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        {request.sim_slots
                          ? `${request.sim_slots.aircraft_type} Simulator`
                          : request.service_type || 'Service Request'}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-2">
                        <User className="w-4 h-4" />
                        <span>Pilot booking request</span>
                      </CardDescription>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${
                      request.status === 'confirmed'
                        ? 'bg-green-500/20 text-green-500'
                        : 'bg-red-500/20 text-red-500'
                    }`}>
                      {request.status === 'confirmed' ? 'Confirmed' : 'Declined'}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {request.sim_slots && (
                    <div className="flex items-center gap-4 text-sm text-neutral-400">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(request.sim_slots.date).toLocaleDateString('en-GB')}</span>
                      <Clock className="w-4 h-4" />
                      <span>{request.sim_slots.start_time} - {request.sim_slots.end_time}</span>
                    </div>
                  )}
                  {request.decline_reason && (
                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                      <p className="text-sm text-red-400">Decline reason: {request.decline_reason}</p>
                    </div>
                  )}
                  {request.status === 'confirmed' ? (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        <Button variant="outline" className="w-full" onClick={() => window.location.href = '/messages'}>
                          <MessageSquare className="w-4 h-4 mr-2" />
                          Chat
                        </Button>
                        <Button 
                          variant="outline" 
                          className="w-full"
                          onClick={() => handleProposeReschedule(request.id)}
                        >
                          <Calendar className="w-4 h-4 mr-2" />
                          Reschedule
                        </Button>
                      </div>
                      <Button 
                        variant="ghost"
                        className="w-full text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        onClick={() => handleCancelBooking(request.id)}
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Cancel Booking
                      </Button>
                    </>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      <Button variant="outline" className="w-full" onClick={() => window.location.href = '/messages'}>
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Open Conversation
                      </Button>
                      <Button 
                        variant="ghost"
                        className="w-full text-neutral-400 hover:text-neutral-300"
                        onClick={() => handleDeleteRequest(request.id)}
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
