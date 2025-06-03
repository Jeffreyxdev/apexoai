import type{  FormEvent, ChangeEvent } from 'react';
import { useState } from 'react';
import axios from 'axios';

export default function LiveChat() {
  const [text, setText] = useState<string>('');
  const [response, setResponse] = useState<string>('');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!text.trim()) return;

    setLoading(true);
    setResponse('');
    setAudioUrl(null);

    try {
      // Step 1: Send text to Gemini + ElevenLabs
      const voiceRes = await axios.post<ArrayBuffer>(
        'https://apexoai.onrender.com/api/gemini-voice',
        { text },
        { responseType: 'arraybuffer' }
      );

      const blob = new Blob([voiceRes.data], { type: 'audio/mpeg' });
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);

      // Optional: Fetch text reply for displaying
      const chatRes = await axios.post<{ enhancedSummary: string }>('https://apexoai.onrender.com/api/chat', { message: text });
      setResponse(chatRes.data.enhancedSummary);
    } catch (error) { 
      console.error('Voice or text generation failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">🎤 ApexoAI Career Assistant</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <textarea
          rows={5}
          placeholder="Ask about your resume, job search, or career advice..."
          value={text}
          onChange={handleChange}
          className="w-full p-3 border rounded"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {loading ? 'Processing...' : 'Submit'}
        </button>
      </form>

      {response && (
        <div className="mt-6 bg-gray-100 p-4 rounded">
          <h2 className="text-lg font-semibold mb-2">🧠 Gemini's Response:</h2>
          <div
            className="prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: response.replace(/\n/g, '<br/>') }}
          />
        </div>
      )}

      {audioUrl && (
        <div className="mt-4">
          <h2 className="text-lg font-semibold mb-2">🔊 Listen:</h2>
          <audio controls src={audioUrl} className="w-full" />
        </div>
      )}
    </div>
  );
}
