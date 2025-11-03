import React, { useState } from "react";
import { Input } from "./Input";
import { Eye, EyeOff } from "lucide-react";
import SocialButton from "./SocialButton";
import { IoLogoGoogle, IoLogoLinkedin } from "react-icons/io";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom"; // ✅ Add this
import "react-toastify/dist/ReactToastify.css";

const SignupForm = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstname: "",
    lastname: "",
    email: "",
    password: "",
  });

  const navigate = useNavigate(); // ✅ React Router navigation

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.firstname || !formData.lastname || !formData.email || !formData.password) {
      toast(
        <div>
          <h4 className="font-bold text-red-500">Please fill in all fields</h4>
        </div>,
        { className: "bg-white border border-blue-500" }
      );
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        toast(
          <div>
            <h4 className="font-bold text-green-400">Account created!</h4>
            <p className="text-sm text-black">{data.message || "Signup successful."}</p>
          </div>,
          { className: "bg-white border border-blue-500" }
        );

        // ✅ Clear form and redirect
        setFormData({ firstname: "", lastname: "", email: "", password: "" });

        // Wait a short moment before redirect (for toast visibility)
        setTimeout(() => {
          navigate("/your-personal-ai");
        }, 1000);
      } else {
        toast(
          <div>
            <h4 className="font-bold text-red-500">Signup failed</h4>
            <p className="text-sm text-black">{data.message || "Something went wrong."}</p>
          </div>,
          { className: "bg-white border border-blue-500" }
        );
      }
    } catch (error) {
      toast(
        <div>
          <h4 className="font-bold text-red-500">Network Error</h4>
          <p className="text-sm text-black">Unable to connect to the server.</p>
        </div>,
        { className: "bg-white border border-blue-500" }
      );
    } finally {
      setLoading(false);
    }
  };
;

  return (
    <div className="w-full max-w-md">
      <h2 className="text-2xl font-bold text-white mb-2">Sign Up Account</h2>
      <p className="text-gray-400 mb-6">Enter your personal data to create your account.</p>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <SocialButton icon={IoLogoGoogle} label="Google" />
        <SocialButton icon={IoLogoLinkedin} label="LinkedIn" />
      </div>

      <div className="flex items-center my-6">
        <div className="flex-grow h-px bg-white/10"></div>
        <span className="px-3 text-sm text-gray-400">or</span>
        <div className="flex-grow h-px bg-white/10"></div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-4 mb-4">
          <div>
            <label htmlFor="firstname" className="block text-sm text-gray-400 mb-1">
              First Name
            </label>
            <Input
              id="firstname"
              name="firstname"
              value={formData.firstname}
              onChange={handleInputChange}
              placeholder="eg. John"
              className="bg-transparent border-white/20 text-white"
            />
          </div>
          <div>
            <label htmlFor="lastname" className="block text-sm text-gray-400 mb-1">
              Last Name
            </label>
            <Input
              id="lastname"
              name="lastname"
              value={formData.lastname}
              onChange={handleInputChange}
              placeholder="eg. Francisco"
              className="bg-transparent border-white/20 text-white"
            />
          </div>
        </div>

        <div className="mb-4">
          <label htmlFor="email" className="block text-sm text-gray-400 mb-1">
            Email
          </label>
          <Input
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
          <label htmlFor="password" className="block text-sm text-gray-400 mb-1">
            Password
          </label>
          <div className="relative">
            <Input
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
          disabled={loading}
          className={`w-full bg-white text-black font-semibold py-3 rounded-lg transition ${
            loading ? "opacity-60 cursor-not-allowed" : "hover:bg-gray-200"
          }`}
        >
          {loading ? "Creating..." : "Sign Up"}
        </button>
      </form>

      <div className="text-center mt-6 text-gray-400">
        Already have an account?
        <a href="/login" className="text-white ml-1 hover:underline">
          Log In
        </a>
      </div>
    </div>
  );
};

export default SignupForm;
