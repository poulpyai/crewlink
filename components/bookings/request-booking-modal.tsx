'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface RequestBookingModalProps {
  slot: {
    id: string;
    aircraft_type: string;
    date?: string;
    start_time: string;
    end_time: string;
    duration_hours?: number;
    base_price?: number;
    price?: number;
    examiner_available?: boolean;
    examiner_type?: string;
    examiner_rate?: number;
    instructor_available?: boolean;
    instructor_rate?: number;
    copilot_available?: boolean;
    copilot_rate?: number;
    location?: string;
  };
  providerId: string;
  providerName: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function RequestBookingModal({
  slot,
  providerId,
  providerName,
  onClose,
  onSuccess,
}: RequestBookingModalProps) {
  const supabase = createClient();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Partner matching state
  const [hasExaminerInstructor, setHasExaminerInstructor] = useState(false);
  const [needsExaminerInstructor, setNeedsExaminerInstructor] = useState(false);
  const [hasCopilot, setHasCopilot] = useState(false);
  const [needsCopilot, setNeedsCopilot] = useState(false);
  
  const [message, setMessage] = useState('');
  
  // Calculate package price
  const calculatePrice = () => {
    let total = slot.base_price || slot.price || 0;
    
    if (needsExaminerInstructor && (slot.examiner_available || slot.instructor_available)) {
      const rate = slot.examiner_rate || slot.instructor_rate || 0;
      total += rate;
    }
    if (needsCopilot && slot.copilot_available && slot.copilot_rate) {
      total += slot.copilot_rate;
    }
    
    return total;
  };
  
  // Derive duration if not available
  const getDuration = () => {
    if (slot.duration_hours) return slot.duration_hours;
    const start = new Date(slot.start_time);
    const end = new Date(slot.end_time);
    return Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60) * 10) / 10;
  };
  
  // Get display date
  const getDisplayDate = () => {
    return slot.date || new Date(slot.start_time).toISOString().split('T')[0];
  };
  
  // Check for mismatches
  const getWarnings = () => {
    const warnings = [];
    
    if (needsExaminerInstructor && !slot.examiner_available && !slot.instructor_available) {
      warnings.push('This slot does not include an examiner/instructor. You will need to bring your own.');
    }
    if (needsCopilot && !slot.copilot_available) {
      warnings.push('This slot does not include a copilot. You will need to bring your own.');
    }
    
    return warnings;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('You must be logged in to request a booking');
        setLoading(false);
        return;
      }
      
      // Validate provider ID
      if (!providerId) {
        console.error('Missing provider ID');
        setError('Provider information is missing. Please refresh and try again.');
        setLoading(false);
        return;
      }
      
      console.log('Creating booking request:', {
        pilot_id: user.id,
        provider_id: providerId,
        slot_id: slot.id,
        package_price: calculatePrice(),
      });
      
      // Determine selected package
      let selectedPackage = 'sim_only';
      if (needsExaminerInstructor && (slot.examiner_available || slot.instructor_available)) {
        selectedPackage = slot.examiner_available ? 'with_examiner' : 'with_instructor';
      }
      if (needsExaminerInstructor && needsCopilot && (slot.examiner_available || slot.instructor_available) && slot.copilot_available) {
        selectedPackage = 'full_package';
      }
      
      // Create booking request
      const { data: bookingData, error: insertError } = await supabase
        .from('booking_requests')
        .insert({
          pilot_id: user.id,
          provider_id: providerId,
          provider_type: 'sim_company',
          slot_id: slot.id,
          message: message.trim() || null,
          needs_examiner: needsExaminerInstructor && slot.examiner_available,
          has_examiner: hasExaminerInstructor && !needsExaminerInstructor,
          needs_instructor: needsExaminerInstructor && slot.instructor_available,
          has_instructor: hasExaminerInstructor && !needsExaminerInstructor,
          needs_copilot: needsCopilot,
          has_copilot: hasCopilot,
          selected_package: selectedPackage,
          package_price: calculatePrice(),
          status: 'pending',
          expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(), // 48h expiry
        })
        .select();
      
      if (insertError) {
        console.error('Booking insert error:', insertError);
        throw insertError;
      }
      
      console.log('Booking created:', bookingData);
      
      // Create notification for provider (using existing notifications table structure)
      const { error: notifError } = await supabase.from('notifications').insert({
        user_id: providerId,
        type: 'booking_request',
        title: 'New Booking Request',
        message: `${user.email} wants to book ${slot.aircraft_type} on ${new Date(getDisplayDate()).toLocaleDateString('en-GB')}. Go to /bookings to respond.`,
      });
      
      if (notifError) {
        console.error('Notification error (non-blocking):', notifError);
        console.error('Notification error details:', notifError.message, notifError.code, notifError.details);
        // Don't block booking if notification fails
      }
      
      console.log('Booking request successful!');
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error creating booking request:', err);
      setError(err.message || 'Failed to send booking request');
    } finally {
      setLoading(false);
    }
  };
  
  const warnings = getWarnings();
  const totalPrice = calculatePrice();
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Request Booking</h2>
              <p className="text-sm text-gray-600 mt-1">{providerName}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        <form onSubmit={handleSubmit}>
          {/* Slot Details */}
          <div className="p-6 bg-gray-50 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-3">Slot Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Aircraft:</span>
                <span className="ml-2 font-medium text-gray-900">{slot.aircraft_type}</span>
              </div>
              <div>
                <span className="text-gray-600">Date:</span>
                <span className="ml-2 font-medium text-gray-900">
                  {new Date(getDisplayDate()).toLocaleDateString('en-GB')}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Time:</span>
                <span className="ml-2 font-medium text-gray-900">
                  {new Date(slot.start_time).toLocaleTimeString('en-GB', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                  })} - {new Date(slot.end_time).toLocaleTimeString('en-GB', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                  })}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Duration:</span>
                <span className="ml-2 font-medium text-gray-900">{getDuration()}h</span>
              </div>
            </div>
          </div>
          
          {/* Partner Matching */}
          <div className="p-6 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-4">What do you need?</h3>
            
            {/* Examiner/Instructor */}
            {(slot.examiner_available || slot.instructor_available) && (
              <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-green-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-medium text-green-900">
                      {slot.examiner_type || 'Instructor'} Available
                    </p>
                    <p className="text-sm text-green-700 mt-1">
                      +€{(slot.examiner_rate || slot.instructor_rate || 0).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="space-y-3">
              {/* Has/Needs Examiner/Instructor */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Examiner / Instructor</label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={hasExaminerInstructor}
                      onChange={(e) => {
                        setHasExaminerInstructor(e.target.checked);
                        if (e.target.checked) setNeedsExaminerInstructor(false);
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">I already have an examiner/instructor</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={needsExaminerInstructor}
                      onChange={(e) => {
                        setNeedsExaminerInstructor(e.target.checked);
                        if (e.target.checked) setHasExaminerInstructor(false);
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">I need an examiner/instructor</span>
                  </label>
                </div>
              </div>
              
              {/* Has/Needs Copilot */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Copilot / Safety Pilot</label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={hasCopilot}
                      onChange={(e) => {
                        setHasCopilot(e.target.checked);
                        if (e.target.checked) setNeedsCopilot(false);
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">I already have a copilot</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={needsCopilot}
                      onChange={(e) => {
                        setNeedsCopilot(e.target.checked);
                        if (e.target.checked) setHasCopilot(false);
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">I need a copilot</span>
                  </label>
                </div>
              </div>
            </div>
            
            {/* Warnings */}
            {warnings.length > 0 && (
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex">
                  <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-yellow-900">Please Note:</h4>
                    <ul className="mt-2 text-sm text-yellow-700 space-y-1">
                      {warnings.map((warning, idx) => (
                        <li key={idx}>• {warning}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Optional Message */}
          <div className="p-6 border-b border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message to Training Center (Optional)
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="Any special requests or questions..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
            <p className="text-xs text-gray-500 mt-1">{message.length}/500</p>
          </div>
          
          {/* Price Summary */}
          <div className="p-6 bg-gray-50 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-gray-900">Estimated Total</span>
              <span className="text-2xl font-bold text-blue-600">€{totalPrice.toFixed(2)}</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Final price will be confirmed by the training center via messaging.
            </p>
          </div>
          
          {/* Error Message */}
          {error && (
            <div className="p-6 bg-red-50 border-b border-red-200">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
          
          {/* Footer */}
          <div className="p-6 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Sending...' : 'Request Booking'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
