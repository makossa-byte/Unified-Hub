import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Sidebar } from './components/Sidebar';
import { MessageList } from './components/MessageList';
import { MessageDetail } from './components/MessageDetail';
import type { Message, Channel, Theme, Reply, Attachment } from './types';
import { MOCK_MESSAGES } from './constants';

const App: React.FC = () => {
  const [theme, setTheme] = useState<Theme>('light');
  const [allMessages, setAllMessages] = useState<Message[]>(MOCK_MESSAGES);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<Channel>('All');
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [isComposing, setIsComposing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);
  
  useEffect(() => {
    let filtered = selectedChannel === 'All' 
      ? allMessages 
      : allMessages.filter(m => m.channel === selectedChannel);

    if (searchQuery.trim() !== '') {
      const lowercasedQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(m => 
        m.sender.toLowerCase().includes(lowercasedQuery) ||
        m.subject.toLowerCase().includes(lowercasedQuery) ||
        m.body.toLowerCase().includes(lowercasedQuery)
      );
    }
    
    setMessages(filtered);
    
    if (!isComposing) {
      setSelectedMessage(prevSelected => {
        if (prevSelected && filtered.some(m => m.id === prevSelected.id)) {
          return filtered.find(m => m.id === prevSelected.id) || null;
        }
        return filtered[0] || null;
      });
    }
  }, [selectedChannel, allMessages, isComposing, searchQuery]);


  const handleSelectMessage = useCallback((message: Message) => {
    setIsComposing(false);
    setSelectedMessage(message);
    if (!message.read) {
      setAllMessages(prevMessages => 
        prevMessages.map(m => 
          m.id === message.id ? { ...m, read: true } : m
        )
      );
    }
  }, []);

  const handleSendReply = useCallback((messageId: number, replyText: string, attachment?: Attachment) => {
    const newReply: Reply = {
      id: Date.now(),
      sender: 'Me',
      body: replyText,
      timestamp: 'Just now',
      avatar: 'https://i.pravatar.cc/40?u=me',
      attachment,
    };

    setAllMessages(prevMessages =>
      prevMessages.map(msg =>
        msg.id === messageId
          ? { ...msg, replies: [...(msg.replies || []), newReply] }
          : msg
      )
    );
  }, []);

  const handleStartCompose = () => {
    setSelectedMessage(null);
    setIsComposing(true);
  };
  
  const handleCancelCompose = () => {
    setIsComposing(false);
  };

  const handleSendMessage = useCallback(({ recipients, subject, body }: { recipients: string[], subject: string, body: string }) => {
    if (recipients.length === 0 || !subject.trim() || !body.trim()) return;

    const ourReply: Reply = {
      id: Date.now(),
      sender: 'Me',
      body: body,
      timestamp: 'Just now',
      avatar: 'https://i.pravatar.cc/40?u=me',
    };

    const newMessage: Message = {
      id: Date.now(),
      sender: recipients.join(', '),
      subject: subject,
      body: body,
      timestamp: 'Just now',
      channel: 'Business',
      avatar: `https://picsum.photos/seed/${Date.now()}/40/40`,
      read: true,
      replies: [ourReply],
    };

    setAllMessages(prev => [newMessage, ...prev]);
    setIsComposing(false);
    
    setTimeout(() => {
      handleSelectMessage(newMessage);
    }, 0);

  }, [handleSelectMessage]);

  const handleDeleteMessage = (messageId: number) => {
    setAllMessages(prev => prev.filter(m => m.id !== messageId));
  };

  const unreadCounts = useMemo(() => {
    const personal = allMessages.filter(m => m.channel === 'Personal' && !m.read).length;
    const business = allMessages.filter(m => m.channel === 'Business' && !m.read).length;
    return {
      all: personal + business,
      personal,
      business,
    };
  }, [allMessages]);

  return (
    <div className="flex h-screen font-sans text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-900 transition-colors duration-300">
      <Sidebar 
        theme={theme} 
        setTheme={setTheme} 
        selectedChannel={selectedChannel}
        setSelectedChannel={setSelectedChannel}
        unreadCounts={unreadCounts}
        onStartCompose={handleStartCompose}
      />
      <main className="flex flex-1 overflow-hidden">
        <MessageList 
          messages={messages} 
          selectedMessage={selectedMessage}
          onSelectMessage={handleSelectMessage}
          isComposing={isComposing}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
        <MessageDetail 
          message={selectedMessage}
          onSendReply={handleSendReply}
          isComposing={isComposing}
          onSendMessage={handleSendMessage}
          onCancelCompose={handleCancelCompose}
          onDeleteMessage={handleDeleteMessage}
        />
      </main>
    </div>
  );
};

export default App;