import React, { useState } from "react";

import { Eye, EyeOff } from "lucide-react";
import SocialButton from "./SocialButton";
import { IoLogoGoogle ,IoLogoLinkedin } from "react-icons/io";

  import {  toast } from 'react-toastify';

const SignupForm = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });


  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
      toast(
       
        "Please fill in all fields",
        
      );
      return;
    }
    
    // Form validation would go here
    toast(
      "Account created!"
      
    );
    
    console.log("Form submitted:", formData);
    // Redirect or handle successful signup
  };

  return (
    <div className="w-full max-w-md">
      <h2 className="text-2xl font-bold text-white mb-2">Sign Up Account</h2>
      <p className="text-gray-400 mb-6">Enter your personal data to create your account.</p>
      
      <div className="grid grid-cols-2 gap-4 mb-6">
        <SocialButton icon={IoLogoGoogle} label="Google" />
        <SocialButton icon={IoLogoLinkedin} label="linkedin" />
      </div>
      
      <div className="flex items-center my-6">
        <div className="flex-grow h-px bg-white/10"></div>
        <span className="px-3 text-sm text-gray-400">or</span>
        <div className="flex-grow h-px bg-white/10"></div>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label htmlFor="firstName" className="block text-sm text-gray-400 mb-1">First Name</label>
            <input 
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleInputChange}
              placeholder="eg. John"
              className="bg-transparent border-white/20 text-white"
            />
          </div>
          <div>
            <label htmlFor="lastName" className="block text-sm text-gray-400 mb-1">Last Name</label>
            <input 
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleInputChange}
              placeholder="eg. Francisco"
              className="bg-transparent border-white/20 text-white"
            />
          </div>
        </div>
        
        <div className="mb-4">
          <label htmlFor="email" className="block text-sm text-gray-400 mb-1">Email</label>
          <input 
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="eg. johnfrancis@gmail.com"
            className="bg-transparent border-white/20 text-white"
          />
        </div>
        
        <div className="mb-4">
          <label htmlFor="password" className="block text-sm text-gray-400 mb-1">Password</label>
          <div className="relative">
            <input 
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={handleInputChange}
              placeholder="Enter your password"
              className="bg-transparent border-white/20 text-white pr-10"
            />
            <button 
              type="button"
              onClick={togglePasswordVisibility}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-1">Must be at least 8 characters.</p>
        </div>
        
        <button 
          type="submit" 
          className="w-full mt-4 bg-purple-light hover:bg-purple text-white"
        >
          Sign Up
        </button>
      </form>
      
      <div className="text-center mt-6 text-gray-400">
        Already have an account? 
        <a href="/login" className="text-white ml-1 hover:underline">Log In</a>
      </div>
    </div>
  );
};

export default SignupForm;
