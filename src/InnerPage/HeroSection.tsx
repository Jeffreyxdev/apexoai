import React from "react";
import { Link } from "react-router-dom";
import bgimg from '../assets/apexo back page.jpg'
const HeroSection: React.FC = () => {
  return (
    <div className="relative   bg-gradient-to-t from-[#030015] to-[#0c0722] pt-20 overflow-hidden">
      <div className="absolute bottom-0 inset-0 rounded-[50px] bgc"><img src={bgimg} alt=""  className="bng  object-contain"/></div>
      <div className="container mx-auto px-6 relative z-10 flex flex-col items-center justify-center min-h-[90vh]  text-white text-center space-y-4 sm:flex">
        <h1 className="text-8xl sm:text-5xl font-bold tracking-tight ">
          Introducing apexoai
        </h1>
        <p className="text-lg sm:text-xl text-gray-30l">
          Revolutionizing Careers with Smart Resume and Job Matching
        </p>
        <button className="bg-white text-blue-700 hover:bg-gray-100 rounded-full  text-lg font-medium flex items-center"><Link to='/signup'>
          Get employed ↗</Link>
        </button>

        <div className="mt-24 container bg-white/10 backdrop-blur-sm rounded-2xl p-10 w-full max-w-4xl max-h-4xl sm:flex">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center  text-sm">
            <div className="p-6">
              <h2 className="text-4xl md:text-5xl font-bold mb-2">60,000+</h2>
              <p className="text-sm md:text-base">
                Explore over 60,000+ job openings across our network
              </p>
            </div>
            <div className="p-6 md:border-x border-white/20">
              <h2 className="text-4xl md:text-5xl font-bold mb-2">20,000+</h2>
              <p className="text-sm md:text-base">
                Over 20,000 employers sourcing for professionals
              </p>
            </div>
            <div className="p-6">
              <h2 className="text-4xl md:text-5xl font-bold mb-2">1,000+</h2>
              <p className="text-sm md:text-base">
                Over 1,000+ persons matched with valued employees
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;