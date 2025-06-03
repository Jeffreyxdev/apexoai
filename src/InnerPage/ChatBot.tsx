import { useState } from 'react';
import axios from 'axios';

export default function ChatInterface() {
  const [input, setInput] = useState('');
  const [reply, setReply] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const res = await axios.post('https://apexoai.onrender.com/api/chat', { message: input });
      setReply(res.data.enhancedSummary);
    } catch (error) {
      console.error('Error:', error);
      setReply('Error generating response.');
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-2">
        <textarea
          placeholder="Ask ApexoAI anything..."
          value={input}
          onChange={e => setInput(e.target.value)}
          className="border p-2 w-full"
        />
        <button type="submit" className="bg-green-600 text-white px-4 py-2">Send</button>
      </form>
      <div className="mt-6 whitespace-pre-wrap bg-gray-100 p-4 rounded">
        {reply}
      </div>
    </div>
  );
}
