import React from "react";

import { ArrowRight } from "lucide-react";

const HeroSection: React.FC = () => {
  return (
    <div className="relative min-h-[1vh] min-w-[2vw] bg-white pt-20 overflow-hidden">
      <div className="absolute bottom-0 inset-0 bg-gradient-to-b from-blue-900 via-blue-600 to-blue-400 rounded-[50px] z-0"></div>
      <div className="container mx-auto px-6 relative z-10 flex flex-col items-center justify-center min-h-[90vh]  text-white">
        
            
        
        
     

        <h1 className="text-4xl md:text-7xl font-bold text-center mb-4 tracking-tight">
          Introducing apexoai
        </h1>
        <p className="text-xl md:text-2xl mb-10 text-center max-w-3xl">
          Revolutionizing Careers with Smart Resume and Job Matching
        </p>
        <button className="bg-white text-blue-700 hover:bg-gray-100 rounded-full px-8 py-6 text-lg font-medium flex items-center">
          Get employed <ArrowRight className="ml-2 h-5 w-5" />
        </button>

        <div className="mt-24 bg-white/10 backdrop-blur-sm rounded-2xl p-10 w-full max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
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