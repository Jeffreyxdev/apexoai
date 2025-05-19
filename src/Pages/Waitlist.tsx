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
      <div className="bg-gradient-to-t from-[#040116] to-[#050118] min-h-screen font-poppins">
        <div className="relative min-h-screen flex items-center justify-center">
          <div
            className="bg-white border border-blue-100 rounded-2xl shadow-xl w-[400px] p-6 relative z-10"
            style={{ boxShadow: '0px 0px 20px rgba(0, 89, 255, 0.2)' }}
          >
            {/* Mac-style buttons */}
            <div className="flex items-center space-x-2 mb-6">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <div className="w-3 h-3 rounded-full bg-green-500" />
            </div>
<a href="https://x.com/apexoai" target="_blank" rel="noopener noreferrer"> <FaXTwitter className="text-black text-xl mb-4 float-right mt-[-4vh]" /></a>
           

            <h2 className="text-2xl font-semibold text-center mb-6 text-black">
              Join the <span className="text-blue-600 font-bold">Waitlist</span>
            </h2>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-black">
              <input
                type="text"
                name="name"
                placeholder="Enter Full Name"
                value={form.name}
                onChange={handleChange}
                required
                className="border border-blue-800 rounded-xl p-2 px-4 focus:outline-none"
              />
              <input
                type="email"
                name="email"
                placeholder="Enter Email"
                value={form.email}
                onChange={handleChange}
                required
                className="border border-blue-800 rounded-xl p-2 px-4 focus:outline-none"
              />
              <button
                type="submit"
                className="bg-blue-800 text-white font-semibold py-2 rounded-xl hover:bg-blue-900 transition"
              >
                Join Now
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Toast Notification Container */}
      
    </>
  );
};

export default Waitlist;