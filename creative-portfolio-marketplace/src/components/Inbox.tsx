/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Send, Search, User, ShieldAlert, Sparkles, Check, CheckCheck } from 'lucide-react';
import { Conversation, Message } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface InboxProps {
  conversations: Conversation[];
  onSendMessage: (conversationId: string, text: string, senderId: string) => void;
  currentUserId: string; // The active identity ID (e.g., 'f1', 'client')
  currentUserName: string;
}

export default function Inbox({ conversations, onSendMessage, currentUserId, currentUserName }: InboxProps) {
  const [activeConvId, setActiveConvId] = useState<string>('');
  const [typedMessage, setTypedMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Filter conversations based on user search
  const filteredConversations = conversations.filter(conv => {
    const targetName = currentUserId === 'client' ? conv.freelancerName : conv.clientName;
    return targetName.toLowerCase().includes(searchQuery.toLowerCase()) || 
           conv.lastMessageText.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Set default active conversation if none selected
  useEffect(() => {
    if (filteredConversations.length > 0 && !activeConvId) {
      setActiveConvId(filteredConversations[0].id);
    }
  }, [filteredConversations, activeConvId]);

  const activeConv = conversations.find(c => c.id === activeConvId);

  // Scroll to bottom of message logs
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeConv?.messages, isTyping]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedMessage.trim() || !activeConvId) return;

    const textToSend = typedMessage.trim();
    setTypedMessage('');

    // Send original message
    onSendMessage(activeConvId, textToSend, currentUserId);

    // Simulate an interactive, premium client response!
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      
      const responses = [
        "That sounds perfect! Let's arrange a brief video call to review the milestone scope. What is your schedule like tomorrow afternoon?",
        "Wonderful details. I just checked out your customized theme and categories, your website looks extremely modern! Let's finalize the contracts.",
        "Yes, the color script and layout you proposed align exactly with our vision. Let me discuss the budget adjustments with our finance lead.",
        "Perfect! I will send over the detailed brand handbook and asset files by tonight so we can kick off immediately.",
        "Thanks for the quick reply. I'm reviewing the draft guidelines now and will send over consolidated revisions soon."
      ];
      
      const randomReply = responses[Math.floor(Math.random() * responses.length)];
      
      // Send replies back as the alternate participant
      const receiverId = currentUserId === 'client' ? activeConvId : 'client';
      onSendMessage(activeConvId, randomReply, receiverId);
    }, 2200);
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden h-[600px] flex">
      {/* Sidebar - Chats List */}
      <div className="w-80 border-r border-slate-100 flex flex-col shrink-0 bg-slate-50/50">
        <div className="p-4 space-y-3 border-b border-slate-150 bg-white">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-slate-900">Conversations</h2>
            <span className="text-xs font-bold text-slate-400">Secure AES-256</span>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search chat..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 rounded-xl border border-slate-150 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-xs font-semibold"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {filteredConversations.map(conv => {
            const isSelected = conv.id === activeConvId;
            const chatName = currentUserId === 'client' ? conv.freelancerName : conv.clientName;
            const chatAvatar = conv.freelancerAvatar;

            return (
              <button
                key={conv.id}
                onClick={() => {
                  setActiveConvId(conv.id);
                  conv.unread = false;
                }}
                className={`w-full text-left p-4 flex items-center gap-3 transition-colors ${
                  isSelected ? 'bg-white border-l-4 border-indigo-600' : 'hover:bg-slate-50'
                }`}
              >
                {/* Avatar */}
                <div className="relative shrink-0">
                  {currentUserId === 'client' && chatAvatar ? (
                    <img
                      src={chatAvatar}
                      alt={chatName}
                      className="w-11 h-11 rounded-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-150 font-extrabold flex items-center justify-center text-sm uppercase">
                      {chatName[0]}
                    </div>
                  )}
                  <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 border-2 border-white" />
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="font-bold text-sm text-slate-900 truncate">{chatName}</span>
                    <span className="text-[10px] font-semibold text-slate-400 shrink-0">{conv.lastMessageTime}</span>
                  </div>
                  <p className="text-xs text-slate-500 truncate pr-4 leading-normal">
                    {conv.lastMessageText}
                  </p>
                </div>

                {/* Unread circle */}
                {conv.unread && (
                  <span className="h-2.5 w-2.5 rounded-full bg-indigo-600 shrink-0" />
                )}
              </button>
            );
          })}

          {filteredConversations.length === 0 && (
            <div className="text-center py-12 text-slate-400 text-xs font-semibold">
              No conversations found.
            </div>
          )}
        </div>
      </div>

      {/* Conversation Window */}
      <div className="flex-1 flex flex-col bg-white">
        {activeConv ? (
          <>
            {/* Thread Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white z-10 shadow-xs">
              <div className="flex items-center gap-3">
                {currentUserId === 'client' && activeConv.freelancerAvatar ? (
                  <img
                    src={activeConv.freelancerAvatar}
                    alt={activeConv.freelancerName}
                    className="w-10 h-10 rounded-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-150 font-extrabold flex items-center justify-center text-sm uppercase">
                    {(currentUserId === 'client' ? activeConv.freelancerName : activeConv.clientName)[0]}
                  </div>
                )}
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">
                    {currentUserId === 'client' ? activeConv.freelancerName : activeConv.clientName}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold tracking-wider uppercase flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
                    Active Now &bull; End-To-End encrypted
                  </p>
                </div>
              </div>

              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-800 text-xs font-bold border border-indigo-100">
                <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
                <span>Client Communications Portal</span>
              </div>
            </div>

            {/* Message log */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/20">
              <div className="text-center py-2">
                <span className="text-[10px] bg-slate-100 text-slate-500 px-3 py-1 rounded-full font-bold uppercase tracking-widest">
                  Secure Connection Established
                </span>
              </div>

              {activeConv.messages.map((msg) => {
                const isMe = msg.senderId === currentUserId;
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[70%] space-y-1`}>
                      <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                        isMe
                          ? 'bg-indigo-600 text-white rounded-br-none font-semibold'
                          : 'bg-white text-slate-900 border border-slate-150 rounded-bl-none font-medium'
                      }`}>
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      </div>
                      <div className={`flex items-center gap-1.5 text-[9px] font-bold text-slate-400 ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <span>{msg.timestamp.split(' ')[1] || msg.timestamp}</span>
                        {isMe && (
                          <CheckCheck className="h-3.5 w-3.5 text-indigo-600" />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Typing indicator */}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white border border-slate-150 px-4 py-3 rounded-2xl rounded-bl-none flex items-center gap-1.5 shadow-sm">
                    <span className="h-2 w-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="h-2 w-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="h-2 w-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Message input */}
            <form onSubmit={handleSend} className="p-4 border-t border-slate-100 bg-white flex gap-2">
              <input
                type="text"
                placeholder="Type a secure message..."
                value={typedMessage}
                onChange={(e) => setTypedMessage(e.target.value)}
                className="flex-1 px-4 py-3 bg-slate-50 border border-slate-150 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-sm"
              />
              <button
                type="submit"
                disabled={!typedMessage.trim()}
                className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-100 disabled:text-slate-400 text-white rounded-xl font-extrabold transition-all shrink-0 flex items-center justify-center cursor-pointer shadow-md shadow-indigo-600/10"
              >
                <Send className="h-4.5 w-4.5" />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-slate-50/20 space-y-3">
            <div className="p-3 bg-slate-100 rounded-full">
              <ShieldAlert className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="font-extrabold text-slate-800">Secure Direct Messaging</h3>
            <p className="text-sm text-slate-500 max-w-sm">
              Select any creative channel from the sidebar or click "Message Me" on their custom websites to safely negotiate freelance opportunities, milestones, and deliverables.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
