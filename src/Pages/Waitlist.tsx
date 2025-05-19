import { useState, useEffect } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../Firebase/Firebase';
import { toast } from 'react-toastify';
import { FaXTwitter } from "react-icons/fa6";
import 'react-toastify/dist/ReactToastify.css';

interface FormData {
  name: string;
  email: string;
}

const Waitlist = () => {
  const [form, setForm] = useState<FormData>({ name: '', email: '' });
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus('sending');

    try {
      await addDoc(collection(db, 'waitlist'), {
        name: form.name,
        email: form.email,
        createdAt: new Date(),
      });
      setStatus('success');
      setForm({ name: '', email: '' });
    } catch (err) {
      console.error('Error adding document: ', err);
      setStatus('error');
    }
  };

  useEffect(() => {
    if (status === 'success') {
      toast("You're on the list! You’ll be first to know when Apexo launches 🎉");
    }
    if (status === 'error') {
      toast.error("Oops! Something went wrong.");
    }
  }, [status]);

  return (
    <>
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-4 py-12">
      <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-8 w-full max-w-md shadow-lg text-center">
        <p className="text-sm text-gray-400 mb-2">ApexoAI | Job hunting with ease </p>
        <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 via-pink-500 to-blue-400 bg-clip-text text-transparent mb-6">
           Join the Apexo AI Waitlist
        </h2>
        <h3 className=" font-medium mb-1">
         You’re Not Early,You are the First.
        </h3>
        
<form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <input
            type="text"
            name="name"
            placeholder="Full name..."
            value={form.name}
            onChange={handleChange}
            className="bg-black/40 border border-white/20 p-3 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            required
          />
          <input
            type="email"
            name="email"
            placeholder="Address email..."
            value={form.email}
            onChange={handleChange}
            className="bg-black/40 border border-white/20 p-3 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            required
          />
          <button
            type="submit"
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-3 rounded-lg transition"
          >
            Join the waitlist →
          </button>
        </form>

          </div>
        </div>
     

      {/* Toast Notification Container */}
      
    </>
  );
};

export default Waitlist;