'use client';

import { useState } from 'react';
import { toast } from 'react-toastify';

interface Props {
  schoolName: string;
}

const SMSTestComponent = ({ schoolName }: Props) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const sendTestSMS = async () => {
    if (!phoneNumber.trim() || !message.trim()) {
      toast.error('Please enter both phone number and message');
      return;
    }

    setSending(true);
    try {
      const response = await fetch('/api/sms/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: phoneNumber,
          content: message,
          type: 'MANUAL'
        })
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success('SMS sent successfully!');
        setMessage('');
      } else {
        toast.error(`Failed to send SMS: ${result.message}`);
      }
    } catch (error) {
      toast.error('Network error occurred');
    } finally {
      setSending(false);
    }
  };

  const loadSampleMessage = (type: string) => {
    const samples = {
      welcome: `Welcome to ${schoolName}! Your student account has been created. Username: testuser, Password: testpass123. Please change your password after first login.`,
      parent_welcome: `Welcome to ${schoolName}! Your parent account has been created for John Doe, Mary Doe. Username: testuser, Password: testpass123. You can now track your children's progress. Please change your password after first login.`,
      payment: `Payment confirmed for John Doe at ${schoolName}. Amount: GHS 500 for School Fees. Remaining balance: GHS 1000 of GHS 1500. Thank you!`,
      payment_full: `Payment confirmed for John Doe at ${schoolName}. Amount: GHS 1500 for School Fees. Fee fully paid (GHS 1500). Thank you!`,
      announcement: `${schoolName} - Important Notice: School will be closed tomorrow due to maintenance. Classes will resume on Monday.`,
      event: `${schoolName} Event: Sports Day scheduled for Friday, 2nd August 2025. Don't miss it!`,
      attendance: `${schoolName}: John Doe was absent on 30/07/2025. Please contact the school if this is unexpected.`
    };
    setMessage(samples[type as keyof typeof samples] || '');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h2 className="text-lg font-semibold text-blue-800 mb-2">SMS Configuration Test</h2>
        <p className="text-blue-700 text-sm">
          Use this page to test your Hubtel SMS integration. Make sure your credentials are properly configured in the environment variables.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Phone Number</label>
          <input
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="e.g., 233241234567"
            className="w-full p-3 border rounded-md"
          />
          <p className="text-xs text-gray-500 mt-1">
            Enter phone number in international format (e.g., 233241234567 for Ghana)
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Message</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Enter your test message here..."
            className="w-full p-3 border rounded-md h-32 resize-none"
            maxLength={160}
          />
          <div className="text-sm text-gray-500 mt-1">
            {message.length}/160 characters
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Sample Messages</label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => loadSampleMessage('welcome')}
              className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded hover:bg-green-200"
            >
              Student Welcome
            </button>
            <button
              onClick={() => loadSampleMessage('parent_welcome')}
              className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded hover:bg-green-200"
            >
              Parent Welcome
            </button>
            <button
              onClick={() => loadSampleMessage('payment')}
              className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded hover:bg-blue-200"
            >
              Payment (Partial)
            </button>
            <button
              onClick={() => loadSampleMessage('payment_full')}
              className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded hover:bg-blue-200"
            >
              Payment (Full)
            </button>
            <button
              onClick={() => loadSampleMessage('announcement')}
              className="px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded hover:bg-purple-200"
            >
              Announcement
            </button>
            <button
              onClick={() => loadSampleMessage('event')}
              className="px-3 py-1 bg-orange-100 text-orange-800 text-sm rounded hover:bg-orange-200"
            >
              Event
            </button>
            <button
              onClick={() => loadSampleMessage('attendance')}
              className="px-3 py-1 bg-red-100 text-red-800 text-sm rounded hover:bg-red-200"
            >
              Attendance Alert
            </button>
          </div>
        </div>

        <button
          onClick={sendTestSMS}
          disabled={sending || !phoneNumber.trim() || !message.trim()}
          className="w-full bg-blue-500 text-white py-3 px-4 rounded-md hover:bg-blue-600 disabled:opacity-50"
        >
          {sending ? 'Sending...' : 'Send Test SMS'}
        </button>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-yellow-800 mb-2">Test Instructions</h3>
        <div className="text-sm text-yellow-700 space-y-1">
          <p>• Make sure your Hubtel credentials are configured in environment variables</p>
          <p>• Use international format for phone numbers (e.g., 233241234567)</p>
          <p>• SMS will be sent from: <strong>{schoolName}</strong> (formatted for SMS sender ID)</p>
          <p>• Check SMS logs in the main SMS Management page for delivery status</p>
        </div>
      </div>
    </div>
  );
};

export default SMSTestComponent;