import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageCircle, Trash2, Plus, MessageSquare } from 'lucide-react';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface ChatMessage {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  created_at?: string;
}

interface ChatSession {
  id?: string;
  session_id: string;
  title: string;
  messages?: ChatMessage[];
  created_at?: string;
}

export const ChatbotPage: React.FC = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Load sessions on mount
  useEffect(() => {
    loadSessions();
  }, []);

  // Load messages when session changes
  useEffect(() => {
    if (currentSessionId) {
      loadChatHistory(currentSessionId);
    }
  }, [currentSessionId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadSessions = async () => {
    try {
      const response = await api.getChatSessions();
      setSessions(response);
      if (response.length > 0 && !currentSessionId) {
        setCurrentSessionId(response[0].session_id);
      }
    } catch (error) {
      console.error('Error loading sessions:', error);
      toast({
        title: 'Error',
        description: 'Failed to load chat sessions',
        variant: 'destructive',
      });
    }
  };

  const loadChatHistory = async (sessionId: string) => {
    try {
      const response = await api.getChatHistory(sessionId);
      setMessages(response.messages || []);
    } catch (error) {
      console.error('Error loading chat history:', error);
      setMessages([]);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    // Add user message optimistically
    const userMessage: ChatMessage = {
      role: 'user',
      content: inputValue,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await api.sendChatMessage({
        message: inputValue,
        session_id: currentSessionId || '',
      });

      // Update session if it's new
      if (!currentSessionId && response.session_id) {
        setCurrentSessionId(response.session_id);
        await loadSessions();
      }

      // Add assistant response
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response.assistant_response,
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, assistantMessage]);

      // Show toast if meeting was scheduled
      if (response.meeting_scheduled) {
        toast({
          title: 'Success',
          description: 'Meeting scheduled successfully!',
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMessage]);

      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewChat = () => {
    setCurrentSessionId(null);
    setMessages([]);
    loadSessions();
  };

  const handleDeleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.deleteChatSession(sessionId);
      setSessions(prev => prev.filter(s => s.session_id !== sessionId));
      if (currentSessionId === sessionId) {
        setCurrentSessionId(null);
        setMessages([]);
      }
      toast({
        title: 'Success',
        description: 'Chat session deleted',
      });
    } catch (error) {
      console.error('Error deleting session:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete session',
        variant: 'destructive',
      });
    }
  };

  const currentSession = sessions.find(s => s.session_id === currentSessionId);

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div
        className={`${
          isSidebarOpen ? 'w-64' : 'w-0'
        } bg-white border-r border-gray-200 transition-all duration-300 overflow-hidden`}
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <button
              onClick={handleNewChat}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              New Chat
            </button>
          </div>

          {/* Sessions List */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4 space-y-2">
              {sessions.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-8">
                  No conversations yet
                </p>
              ) : (
                sessions.map(session => (
                  <div
                    key={session.session_id}
                    onClick={() => setCurrentSessionId(session.session_id)}
                    className={`w-full text-left p-3 rounded-lg transition space-y-1 cursor-pointer ${
                      currentSessionId === session.session_id
                        ? 'bg-blue-100 text-blue-900'
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <MessageSquare className="w-4 h-4 flex-shrink-0" />
                        <span className="text-sm font-medium truncate">
                          {session.title}
                        </span>
                      </div>
                      <button
                        onClick={(e) => handleDeleteSession(session.session_id, e)}
                        className="p-1 hover:bg-red-200 rounded text-red-600"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-xs text-gray-500">
                      {new Date(session.created_at || '').toLocaleDateString()}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              {isSidebarOpen ? '✕' : '☰'}
            </button>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">
                Meeting Assistant
              </h1>
              <p className="text-sm text-gray-500">
                {currentSession ? `Chat: ${currentSession.title}` : 'Start a new chat'}
              </p>
            </div>
          </div>
          <MessageCircle className="w-6 h-6 text-blue-600" />
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <MessageCircle className="w-16 h-16 mb-4 text-gray-300" />
              <h2 className="text-xl font-semibold text-gray-600 mb-2">
                Start Scheduling Meetings
              </h2>
              <p className="text-gray-500 max-w-md">
                Tell me about the meeting you'd like to schedule. Include participant names
                and I'll help you set it up and send invitations.
              </p>
              <div className="mt-6 space-y-2 text-sm text-gray-600">
                <p className="font-medium">Example messages:</p>
                <ul className="space-y-1 text-left">
                  <li>✓ "Schedule a meeting with John and Jane"</li>
                  <li>✓ "Setup a team sync with Technical team members"</li>
                  <li>✓ "Create a meeting for Alice and Bob tomorrow at 2pm"</li>
                </ul>
              </div>
            </div>
          )}

          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-md p-4 rounded-lg ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white rounded-br-none'
                    : 'bg-white text-gray-900 rounded-bl-none shadow-sm'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap break-words">
                  {msg.content}
                </p>
                {msg.created_at && (
                  <p
                    className={`text-xs mt-2 ${
                      msg.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                    }`}
                  >
                    {new Date(msg.created_at).toLocaleTimeString()}
                  </p>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white text-gray-900 p-4 rounded-lg rounded-bl-none shadow-sm">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="bg-white border-t border-gray-200 p-6">
          <form onSubmit={handleSendMessage} className="flex gap-3">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Type your message or describe the meeting..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !inputValue.trim()}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition font-medium flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
