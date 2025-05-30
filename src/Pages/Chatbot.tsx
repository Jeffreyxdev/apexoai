import { useState } from 'react';
import ChatSidebar from '../Components/ChatSidebar';
import ChatArea from '../Components/ChatArea';

const Chatbot = () => {
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-white">
      <ChatSidebar 
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        selectedChatId={selectedChatId}
        onSelectChat={setSelectedChatId}
      />
      <ChatArea 
        chatId={selectedChatId}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        isSidebarOpen={isSidebarOpen}
      />
    </div>
  );
};

export default Chatbot;