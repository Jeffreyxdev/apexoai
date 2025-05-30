import { useState } from 'react';

import ChatArea from '../Components/ChatArea';

const Chatbot = () => {
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-white">
      
      <ChatArea 
        chatId={selectedChatId}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        isSidebarOpen={isSidebarOpen}
      />
    </div>
  );
};

export default Chatbot;