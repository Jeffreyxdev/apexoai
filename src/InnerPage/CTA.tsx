
import React from "react";

import { ArrowRight } from "lucide-react";

const CTA: React.FC = () => {
  return (
    <section className="py-20 bg-gradient-to-r from-blue-800 to-blue-600 text-white">
      <div className="container mx-auto px-6 text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-6">
          Ready to Transform Your Career?
        </h2>
        <p className="text-xl mb-10 max-w-2xl mx-auto">
          Join thousands of professionals who have already found their perfect job match with Apexoai.
        </p>
        <button className="bg-white text-blue-700 hover:bg-gray-100 rounded-full px-8 py-6 text-lg font-medium inline-flex items-center">
          Get Started Today <ArrowRight className="ml-2 h-5 w-5" />
        </button>
      </div>
    </section>
  );
};

export default CTA;