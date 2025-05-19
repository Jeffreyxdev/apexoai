
import Footer from "../Components/Footer"
import Navbar from "../Components/Navbar"
import CTA from "../InnerPage/CTA"
import Features from "../InnerPage/Features"
import HeroSection from "../InnerPage/HeroSection"
import Testimonial from "../InnerPage/Testimonials"


const Home = () => {
  return (
    <>
    <Navbar/>
        <HeroSection/>
        <Features/>
        <Testimonial/>
        <CTA/>
        <Footer/>

        
    </>
  )
}

export default Home