import { useState, useEffect } from 'react';
import { type Address } from 'viem';

interface MessagingInterfaceProps {
  account: Address;
}

export function MessagingInterface({ account }: MessagingInterfaceProps) {
  const [selectedContact, setSelectedContact] = useState<Address | null>(null);
  const [newContactAddress, setNewContactAddress] = useState('');
  const [showAddContact, setShowAddContact] = useState(false);
  const [contacts, setContacts] = useState<Address[]>([]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
      {/* Contacts Sidebar */}
      <div className="lg:col-span-1 bg-white rounded-2xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Contacts</h3>
          <button
            onClick={() => setShowAddContact(true)}
            className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white hover:bg-indigo-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>

        {showAddContact && (
          <div className="mb-4 p-4 bg-gray-50 rounded-lg">
            <input
              type="text"
              placeholder="Enter wallet address or ENS"
              value={newContactAddress}
              onChange={(e) => setNewContactAddress(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
            />
            <div className="flex space-x-2 mt-3">
              <button
                onClick={() => {
                  if (newContactAddress.trim()) {
                    setContacts([...contacts, newContactAddress.trim() as Address]);
                    setNewContactAddress('');
                    setShowAddContact(false);
                  }
                }}
                className="flex-1 bg-indigo-600 text-white py-2 px-3 rounded-lg text-sm font-medium hover:bg-indigo-700"
              >
                Add
              </button>
              <button
                onClick={() => {
                  setShowAddContact(false);
                  setNewContactAddress('');
                }}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-3 rounded-lg text-sm font-medium hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {contacts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p className="text-sm">No contacts yet</p>
              <p className="text-xs text-gray-400 mt-1">Add someone to start messaging</p>
            </div>
          ) : (
            contacts.map((contact) => (
              <button
                key={contact}
                onClick={() => setSelectedContact(contact)}
                className={`w-full p-3 rounded-lg text-left transition-colors ${
                  selectedContact === contact 
                    ? 'bg-indigo-50 border-indigo-200 border' 
                    : 'hover:bg-gray-50 border border-transparent'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                    <span className="text-sm font-semibold text-gray-600">
                      {contact.slice(2, 4).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {contact.slice(0, 6)}...{contact.slice(-4)}
                    </p>
                    <p className="text-xs text-gray-500">No messages yet</p>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Message Area */}
      <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm flex flex-col">
        {selectedContact ? (
          <>
            {/* Message Header */}
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                  <span className="text-sm font-semibold text-gray-600">
                    {selectedContact.slice(2, 4).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">
                    {selectedContact.slice(0, 6)}...{selectedContact.slice(-4)}
                  </h4>
                  <p className="text-sm text-gray-500">
                    {selectedContact}
                  </p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 p-6 overflow-y-auto">
              <div className="text-center py-12 text-gray-500">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p className="text-lg font-medium mb-2">No messages yet</p>
                <p className="text-sm">Send your first encrypted message below</p>
              </div>
            </div>

            {/* Message Input */}
            <div className="p-6 border-t border-gray-100">
              <div className="flex space-x-3">
                <input
                  type="text"
                  placeholder="Type your encrypted message..."
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      // TODO: Send message
                    }
                  }}
                />
                <button className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
              
              <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
                <span>Messages are end-to-end encrypted</span>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" className="rounded text-indigo-600" />
                  <span>Make permanent (costs gas)</span>
                </label>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 4v-4z" />
              </svg>
              <h4 className="text-lg font-medium mb-2">Select a contact to start messaging</h4>
              <p className="text-sm">Choose someone from your contacts or add a new contact to begin</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}