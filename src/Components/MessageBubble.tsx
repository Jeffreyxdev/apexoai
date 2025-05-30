import React from 'react';
import { Copy, ThumbsUp, ThumbsDown, RotateCcw, User, Sparkles } from 'lucide-react';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface MessageBubbleProps {
  message: Message;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
  };

  const handleRegenerate = () => {
    console.log('Regenerating response...');
  };

  const handleFeedback = (type: 'like' | 'dislike') => {
    console.log(`Feedback: ${type} for message ${message.id}`);
  };

  if (message.type === 'user') {
    return (
      <div className="flex justify-end mb-8">
        <div className="flex items-start gap-4 max-w-3xl">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-2xl rounded-tr-lg shadow-sm">
            <p className="text-sm leading-relaxed">{message.content}</p>
          </div>
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
            <User size={16} className="text-white" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start mb-8">
      <div className="flex items-start gap-4 max-w-4xl w-full">
        <div className="w-8 h-8 bg-gradient-to-br from-gray-700 to-gray-900 rounded-full flex items-center justify-center flex-shrink-0">
          <Sparkles size={16} className="text-white" />
        </div>
        <div className="flex-1">
          <div className="bg-gray-50 p-6 rounded-2xl rounded-tl-lg border border-gray-100">
            <div className="prose prose-sm max-w-none">
              <p className="text-gray-800 leading-relaxed whitespace-pre-wrap m-0">{message.content}</p>
            </div>
          </div>
          
          {/* Action buttons */}
          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={handleCopy}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200"
              title="Copy message"
            >
              <Copy size={14} />
            </button>
            <button
              onClick={() => handleFeedback('like')}
              className="p-2 text-gray-400 hover:text-green-600 hover:bg-gray-100 rounded-lg transition-all duration-200"
              title="Good response"
            >
              <ThumbsUp size={14} />
            </button>
            <button
              onClick={() => handleFeedback('dislike')}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-gray-100 rounded-lg transition-all duration-200"
              title="Bad response"
            >
              <ThumbsDown size={14} />
            </button>
            <button
              onClick={handleRegenerate}
              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-gray-100 rounded-lg transition-all duration-200"
              title="Regenerate response"
            >
              <RotateCcw size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
