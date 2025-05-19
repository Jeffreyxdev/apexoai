import { AnimatePresence, motion,  } from "framer-motion";
import { useState } from "react";
import { MdOutlineClose } from "react-icons/md";
import { IoMdMenu } from "react-icons/io";
import { itemVariants, sideVariants } from "../Utils/Motion";
import { Link } from "react-router-dom";

import Logo from '../assets/logo.png'

 
const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  

  const handleMobileMenuToggle = () => {
    setIsMobileMenuOpen((prev) => !prev);
  };
 return (
    <>
    <nav className="flex  nav-full justify-between items-center p-4 text-black bg-white">
      {/* Logo */}
      <div className="flex items-center">
        <div className="h-9  rounded-full  mt-[-4.5vh] mr-[-1vw]"> <img src={Logo} alt="logo for page" className=" h-[9vh]  " /></div>
        <div className="flex items-center">
         
        </div>
     
        <span className="text-xl font-bold">apexoai</span>
      </div>

      {/* Navigation Links */}
      <div className="space-x-6">
        <a href="#" className="hover:underline">Use Cases</a>
        <a href="#" className="hover:underline">Features</a>
        <a href="#" className="hover:underline">Resources</a>
        <a href="#" className="hover:underline">Pricing</a>
        <a href="#" className="hover:underline">About</a>
      </div>

      {/* Buttons */}
      <div className="space-x-4">
        
        <button className="bg-black text-white px-4 py-2 rounded-[50px] h-10 hover:opacity-80 transition btn">
          Sign Up
        </button>
        <button className=" bg-black px-4 py-2 rounded-full h-10 hover:opacity-80 transition text-white btn">
          Log In
        </button>


      </div>
    </nav>
     {/* Mobile Nav Toggle */}
      <nav className="md:hidden flex justify-center fixed z-10  w-[90vw] h-[15vh] ">
        <div className="nav-container pt-5 flex justify-between w-[90%]">
         <h3 className="text-white text-2xl font-semibold mt-[-2vh] ml-[-3vw]  inline-block rounded ">apexoAI</h3>
          <div onClick={handleMobileMenuToggle}>
            {isMobileMenuOpen ? (
              <MdOutlineClose className="w-[40px] h-[40px] p-2 cursor-pointer mt-[-2vh]" />
            ) : (
              <div className="flex justify-center items-center h-[100%] pb-9">
                <IoMdMenu className="w-[40px] h-[40px] p-2 cursor-pointer mt-[-4vh] mr-[-6vw]" />
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile Nav Content */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.aside
            style={{ overflow: "hidden" }}
            initial={{ width: 0 }}
            animate={{ width: 500 }}
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
              className="container md:hidden flex flex-col fixed bg-[#272727] text-white w-[60vw] ml-[35vw] mt-[10vh] h-[350px] mr-[-3vw]   rounded-2xl pt-4 z-10"
            >
              <ul className="text-[20px] mr-[-20px] p-5" onClick={handleMobileMenuToggle}>
                <motion.li variants={itemVariants} className="mb-6">
                  <Link to="/">Home</Link>
                </motion.li>
                <motion.li variants={itemVariants} className="mb-6">
                  <Link to="/">Features</Link>
                </motion.li>
                <motion.li variants={itemVariants} className="mb-6">
                  <Link to="/">Pricing</Link>
                </motion.li>
                <motion.li variants={itemVariants} className="mb-6">
                  Contact
                </motion.li>
              </ul>

              <Link to="/waitlist">
                <motion.button
                  variants={itemVariants}
                  className="w-[150px] h-[48px] bg-[#272727a9] text-white rounded-xl text-[14px]  "
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