'use client';

import { useState } from 'react';
import { toast } from 'react-toastify';

interface Recipient {
  id: string;
  name: string;
  phone: string | null;
  email?: string;
}

interface Student extends Omit<Recipient, 'email'> {
  class: { name: string } | null;
  parentStudents: {
    parent: {
      phone: string | null;
    };
  }[];
}

interface Parent extends Recipient {
  parentStudents: {
    student: { name: string; class: { name: string } | null };
  }[];
}

interface Teacher extends Recipient {
  subjects: { name: string }[];
}

interface SMSLog {
  id: number;
  phoneNumber: string;
  content: string;
  type: string;
  status: string;
  createdAt: string;
  errorMessage?: string;
}

interface Props {
  students: Student[];
  parents: Parent[];
  teachers: Teacher[];
  smsLogs: SMSLog[];
  schoolName: string;
}

const SMSManagement = ({ students, parents, teachers, smsLogs, schoolName }: Props) => {
  const [selectedTab, setSelectedTab] = useState<'send' | 'logs'>('send');
  const [recipientType, setRecipientType] = useState<'students' | 'parents' | 'teachers' | 'all'>('students');
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'ANNOUNCEMENT' | 'EVENT_NOTIFICATION' | 'MANUAL'>('ANNOUNCEMENT');
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const getAllRecipients = () => {
    switch (recipientType) {
      case 'students': return students;
      case 'parents': return parents;
      case 'teachers': return teachers;
      case 'all': return [...students, ...parents, ...teachers];
      default: return [];
    }
  };

  const getFilteredRecipients = () => {
    const allRecipients = getAllRecipients();
    
    if (!searchTerm.trim()) {
      return allRecipients;
    }

    const searchLower = searchTerm.toLowerCase();
    
    return allRecipients.filter(recipient => {
      // Search by recipient's own name (first name + surname if available)
      const recipientName = recipient.name || '';
      const recipientSurname = (recipient as any).surname || '';
      const fullName = `${recipientName} ${recipientSurname}`.toLowerCase();
      const nameMatch = fullName.includes(searchLower);
      
      // For parents, also search by their children's names
      if ('parentStudents' in recipient && recipient.parentStudents) {
        const childrenMatch = recipient.parentStudents.some(ps => {
          if (ps && ps.student && ps.student.name) {
            const studentFullName = `${ps.student.name}`.toLowerCase();
            return studentFullName.includes(searchLower);
          }
          return false;
        });
        return nameMatch || childrenMatch;
      }
      
      // For students and teachers, search by their name
      return nameMatch;
    });
  };

  const handleSelectAll = () => {
    const filteredIds = getFilteredRecipients().map(r => r.id);
    setSelectedRecipients(prev => {
      const newSelected = new Set([...prev, ...filteredIds]);
      return Array.from(newSelected);
    });
  };

  const handleDeselectAll = () => {
    const filteredIds = getFilteredRecipients().map(r => r.id);
    setSelectedRecipients(prev => prev.filter(id => !filteredIds.includes(id)));
  };

  const handleClearSearch = () => {
    setSearchTerm('');
  };

  const handleRecipientToggle = (id: string) => {
    setSelectedRecipients(prev => 
      prev.includes(id) 
        ? prev.filter(r => r !== id)
        : [...prev, id]
    );
  };

  const sendSMS = async () => {
    if (!message.trim()) {
      toast.error('Please enter a message');
      return;
    }

    if (selectedRecipients.length === 0) {
      toast.error('Please select at least one recipient');
      return;
    }

    setSending(true);
    let successCount = 0;
    let failCount = 0;
    let noPhoneCount = 0;

    try {
      const recipients = getAllRecipients().filter(r => selectedRecipients.includes(r.id));
      console.log('Selected recipients:', recipients);
      
      if (recipients.length === 0) {
        toast.error('No valid recipients found');
        setSending(false);
        return;
      }

      for (const recipient of recipients) {
        console.log('Processing recipient:', recipient.name, 'Phone:', recipient.phone);
        
        // Get all phone numbers for this recipient (including parent phones for students)
        const phoneNumbers: string[] = [];
        
        if (recipient.phone) {
          phoneNumbers.push(recipient.phone);
        }
        
        // If this is a student, also get parent phone numbers
        if ('parentStudents' in recipient && recipient.parentStudents) {
          for (const parentStudent of recipient.parentStudents) {
            if (parentStudent && parentStudent.parent && parentStudent.parent.phone) {
              phoneNumbers.push(parentStudent.parent.phone);
            }
          }
        }
        
        if (phoneNumbers.length === 0) {
          console.log('No phone numbers available for:', recipient.name);
          noPhoneCount++;
          continue;
        }

        // Send SMS to all available phone numbers for this recipient
        for (const phoneNumber of phoneNumbers) {
          try {
            console.log('Sending SMS to:', phoneNumber, 'for recipient:', recipient.name);
            const response = await fetch('/api/sms/send', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                to: phoneNumber,
                content: message,
                type: messageType,
                recipientId: recipient.id
              })
            });

            const result = await response.json();
            console.log('SMS API response:', result);
            
            if (result.success) {
              successCount++;
            } else {
              console.error('SMS failed:', result.message);
              failCount++;
            }
          } catch (error) {
            console.error('SMS request error:', error);
            failCount++;
          }
        }
      }

      // Show results
      if (successCount > 0) {
        toast.success(`SMS sent successfully to ${successCount} recipients`);
      }
      if (failCount > 0) {
        toast.error(`Failed to send SMS to ${failCount} recipients`);
      }
      if (noPhoneCount > 0) {
        toast.warning(`${noPhoneCount} recipients have no phone numbers`);
      }
      if (successCount === 0 && failCount === 0 && noPhoneCount === 0) {
        toast.error('No SMS messages were sent');
      }

      // Reset form
      setMessage('');
      setSelectedRecipients([]);
      
    } catch (error) {
      toast.error('Failed to send SMS');
    } finally {
      setSending(false);
    }
  };

  const getRecipientDisplay = (recipient: Student | Parent | Teacher) => {
    if ('class' in recipient && recipient.class) {
      // For students, show if they have their own phone or will use parent phones
      const hasOwnPhone = !!recipient.phone;
      const hasParentPhones = recipient.parentStudents && recipient.parentStudents.some(ps => ps && ps.parent && ps.parent.phone);
      
      let phoneInfo = '';
      if (hasOwnPhone && hasParentPhones) {
        phoneInfo = '📱👨‍👩‍👧‍👦'; // Both student and parent phones
      } else if (hasOwnPhone) {
        phoneInfo = '📱'; // Only student phone
      } else if (hasParentPhones) {
        phoneInfo = '👨‍👩‍👧‍👦'; // Only parent phones
      } else {
        phoneInfo = '❌'; // No phones available
      }
      
      return `${recipient.name} (${recipient.class.name}) ${phoneInfo}`;
    }
    if ('parentStudents' in recipient) {
      const studentNames = recipient.parentStudents.map(ps => ps.student.name).join(', ');
      return `${recipient.name} (Parent of: ${studentNames}) 📱`;
    }
    if ('subjects' in recipient) {
      const subjects = recipient.subjects.map(s => s.name).join(', ');
      return `${recipient.name} (${subjects}) 📱`;
    }
    return recipient.name;
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex space-x-4 border-b">
        <button
          onClick={() => setSelectedTab('send')}
          className={`pb-2 px-4 ${selectedTab === 'send' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}
        >
          Send SMS
        </button>
        <button
          onClick={() => setSelectedTab('logs')}
          className={`pb-2 px-4 ${selectedTab === 'logs' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}
        >
          SMS Logs
        </button>
      </div>

      {selectedTab === 'send' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Message Composition */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Message Type</label>
              <select
                value={messageType}
                onChange={(e) => setMessageType(e.target.value as any)}
                className="w-full p-2 border rounded-md"
              >
                <option value="ANNOUNCEMENT">Announcement</option>
                <option value="EVENT_NOTIFICATION">Event Notification</option>
                <option value="MANUAL">Manual Message</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Enter your message here..."
                className="w-full p-3 border rounded-md h-32 resize-none"
                maxLength={160}
              />
              <div className="text-sm text-gray-500 mt-1">
                {message.length}/160 characters
              </div>
            </div>

            <button
              onClick={sendSMS}
              disabled={sending || selectedRecipients.length === 0}
              className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 disabled:opacity-50"
            >
              {sending ? 'Sending...' : `Send SMS to ${selectedRecipients.length} recipients`}
            </button>
          </div>

          {/* Recipient Selection */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Recipient Type</label>
              <select
                value={recipientType}
                onChange={(e) => {
                  setRecipientType(e.target.value as any);
                  setSelectedRecipients([]);
                  setSearchTerm(''); // Clear search when changing recipient type
                }}
                className="w-full p-2 border rounded-md"
              >
                <option value="students">Students</option>
                <option value="parents">Parents</option>
                <option value="teachers">Teachers</option>
                <option value="all">All</option>
              </select>
            </div>

            {/* Search Input */}
            <div>
              <label className="block text-sm font-medium mb-2">Search Recipients</label>
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={
                    recipientType === 'parents' 
                      ? 'Search by parent or student name...' 
                      : recipientType === 'students'
                      ? 'Search by student name...'
                      : recipientType === 'teachers'
                      ? 'Search by teacher name...'
                      : 'Search by name...'
                  }
                  className="w-full p-2 pr-8 border rounded-md text-sm"
                />
                {searchTerm && (
                  <button
                    onClick={handleClearSearch}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                )}
              </div>
              {searchTerm && (
                <div className="text-xs text-gray-500 mt-1">
                  Showing {getFilteredRecipients().length} of {getAllRecipients().length} recipients
                </div>
              )}
            </div>

            <div className="flex space-x-2">
              <button
                onClick={handleSelectAll}
                className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600"
              >
                Select All {searchTerm ? 'Filtered' : ''}
              </button>
              <button
                onClick={handleDeselectAll}
                className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
              >
                Deselect All {searchTerm ? 'Filtered' : ''}
              </button>
            </div>

            <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
              <strong>Phone Icons:</strong> 📱 = Own phone, 👨‍👩‍👧‍👦 = Parent phone, 📱👨‍👩‍👧‍👦 = Both, ❌ = No phone
            </div>

            <div className="border rounded-md max-h-96 overflow-y-auto">
              {getFilteredRecipients().length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  {searchTerm ? 'No recipients found matching your search.' : 'No recipients available.'}
                </div>
              ) : (
                getFilteredRecipients().map((recipient) => (
                <div
                  key={recipient.id}
                  className="flex items-center p-3 border-b last:border-b-0 hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    checked={selectedRecipients.includes(recipient.id)}
                    onChange={() => handleRecipientToggle(recipient.id)}
                    className="mr-3"
                  />
                  <div className="flex-1">
                    <div className="font-medium">{getRecipientDisplay(recipient)}</div>
                    <div className="text-sm text-gray-500">
                      {(() => {
                        const phoneNumbers: string[] = [];
                        if (recipient.phone) phoneNumbers.push(recipient.phone);
                        
                        // Add parent phones for students only
                        if ('parentStudents' in recipient && recipient.parentStudents) {
                          recipient.parentStudents.forEach(ps => {
                            if (ps && ps.parent && ps.parent.phone) {
                              phoneNumbers.push(`${ps.parent.phone} (parent)`);
                            }
                          });
                        }
                        
                        return phoneNumbers.length > 0 ? phoneNumbers.join(', ') : 'No phone';
                      })()}
                    </div>
                  </div>
                </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {selectedTab === 'logs' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Recent SMS Logs</h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 p-2 text-left">Date</th>
                  <th className="border border-gray-300 p-2 text-left">Phone</th>
                  <th className="border border-gray-300 p-2 text-left">Type</th>
                  <th className="border border-gray-300 p-2 text-left">Status</th>
                  <th className="border border-gray-300 p-2 text-left">Message</th>
                </tr>
              </thead>
              <tbody>
                {smsLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="border border-gray-300 p-2">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="border border-gray-300 p-2">{log.phoneNumber}</td>
                    <td className="border border-gray-300 p-2">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                        {log.type}
                      </span>
                    </td>
                    <td className="border border-gray-300 p-2">
                      <span className={`px-2 py-1 text-xs rounded ${
                        log.status === 'SENT' ? 'bg-green-100 text-green-800' : 
                        log.status === 'FAILED' ? 'bg-red-100 text-red-800' : 
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="border border-gray-300 p-2 max-w-xs truncate">
                      {log.content}
                      {log.errorMessage && (
                        <div className="text-red-500 text-xs mt-1">{log.errorMessage}</div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default SMSManagement;