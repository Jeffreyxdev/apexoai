import { AnimatePresence, motion } from "framer-motion";
import { useState, useEffect } from "react";
import { MdOutlineClose } from "react-icons/md";
import { IoMdMenu } from "react-icons/io";
import { itemVariants, sideVariants } from "../Utils/Motion";
import { Link } from "react-router-dom";



const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleMobileMenuToggle = () => {
    setIsMobileMenuOpen((prev) => !prev);
  };

  return (
    <>
      {/* Desktop Navbar */}
      <nav
        className={`hidden sm:flex fixed left-1/2 transform -translate-x-1/2 justify-between items-center px-6 z-50 backdrop-blur-sm shadow-lg transition-all duration-300 ${
          isScrolled
            ? "top-0 w-full max-w-full rounded-none bg-black/70 backdrop-blur-sm text-white h-[60px]"
            : "top-3 w-[90%] max-w-6xl rounded-full bg-white/10 backdrop-blur-sm text-white h-[45px]"
        }`}
      >
        <div className="flex items-center space-x-2">
          <span className="text-xl font-bold">ApexoAI</span>
        </div>

        <div className="flex space-x-6 text-sm font-medium">
          <a href="#" className={`transition ${isScrolled ? "hover:text-gray-300 text-bold" : "hover:text-gray-600"}`}>
            Use Cases
          </a>
          <a href="#" className={`transition ${isScrolled ? "hover:text-gray-300 text-bold" : "hover:text-gray-600"}`}>
            Features
          </a>
          <a href="#" className={`transition ${isScrolled ? "hover:text-gray-300 text-bold" : "hover:text-gray-600"}`}>
            Resources
          </a>
          <a href="#" className={`transition ${isScrolled ? "hover:text-gray-300 text-bold" : "hover:text-gray-600"}`}>
            Pricing
          </a>
          <a href="#" className={`transition ${isScrolled ? "hover:text-gray-300 text-bold" : "hover:text-gray-600"}`}>
            About
          </a>
        </div>

        <div className="flex space-x-3">
          <Link to="/signup">
            <button
              className={`rounded-full h-10 px-4 hover:opacity-80 transition text-sm ${
                isScrolled ? "bg-white text-black" : "bg-black text-white"
              }`}
            >
              Sign Up
            </button>
          </Link>
          <Link to={'/login'}>
          <button
            className={`rounded-full h-10 px-4 hover:opacity-80 transition text-sm ${
              isScrolled ? "bg-white text-black" : "bg-black text-white"
            }`}
          >
            Log In
          </button></Link>
        </div>
      </nav>

      {/* Mobile Nav Toggle */}
      <nav
        className={`sm:hidden flex fixed top-0 left-0 right-0 z-50 w-full transition-all duration-300 ${
          isScrolled ? "h-16 bg-black" : "h-16 bg-white/10 backdrop-blur-sm"
        }`}
      >
        <div className="flex justify-between items-center w-[90%] mx-auto">
          <h3 className={`text-2xl font-semibold transition-colors ${isScrolled ? "text-white" : "text-white"}`}>
            Apexo AI
          </h3>
          <button onClick={handleMobileMenuToggle} className="p-2">
            {isMobileMenuOpen ? (
              <MdOutlineClose className="w-8 h-8 text-white" />
            ) : (
              <IoMdMenu className="w-8 h-8 text-white" />
            )}
          </button>
        </div>
      </nav>

      {/* Mobile Nav Content */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.aside
            className="fixed top-16 right-0 z-40"
            style={{ overflow: "hidden" }}
            initial={{ width: 0 }}
            animate={{ width: "60vw" }}
            exit={{
              width: 0,
              transition: { delay: 0.3, duration: 0.1 },
            }}
          >
            <motion.div
              initial="closed"
              animate="open"
              exit="closed"
              variants={sideVariants}
              className="bg-white text-black w-full rounded-l-2xl shadow-xl p-6"
            >
              <ul className="text-lg space-y-6" onClick={handleMobileMenuToggle}>
                <motion.li variants={itemVariants}>
                  <Link to="/" className="hover:text-blue-400 transition">Home</Link>
                </motion.li>
                <motion.li variants={itemVariants}>
                  <Link to="/" className="hover:text-blue-400 transition">Features</Link>
                </motion.li>
                <motion.li variants={itemVariants}>
                  <Link to="/" className="hover:text-blue-400 transition">Pricing</Link>
                </motion.li>
                <motion.li variants={itemVariants}>
                  <a href="#" className="hover:text-blue-400 transition">Contact</a>
                </motion.li>
              </ul>

              <Link to="/waitlist">
                <motion.button
                  variants={itemVariants}
                  className="w-full mt-8 h-12 bg-blue-400 text-white rounded-xl hover:bg-blue-500 transition"
                >
                  Request Demo
                </motion.button>
              </Link>
            </motion.div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;