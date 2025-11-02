
import Logo from "../Components/Logo";
import SignupStepper from "../Components/SignupStepper";
import SignupForm from "../Components/SignupForm";
import bg from '../assets/fade.jpg'
const Signup = () => {
  return (
    <div className="flex min-h-screen">
      {/* Left section with gradient */}
      <div className="hidden md:flex md:w-1/2 bg-gradient-purple flex-col p-10">
        <img
    className="absolute inset-0 bg-cover bg-center filter blur-xs brightness-75 z-0 h-[100vh] w-[50vw]"
   src={bg}
  />
        <Logo  className="z-10"/>
        <div className="flex flex-col justify-center items-start h-full max-w-md mx-auto z-10">
          <h1 className="text-4xl font-bold text-white mb-3">Get Started with Us</h1>
          <p className="text-white/70 mb-8">
            Complete these easy steps to register your account.
          </p>
          <SignupStepper />
        </div>
      </div>
      
      {/* Right section with form */}
      <div className="w-full md:w-1/2 bg-black flex flex-col p-6 md:p-10">
        <div className="md:hidden mb-8">
          <Logo />
        </div>
        <div className="flex flex-col justify-center items-center h-full">
          <SignupForm />
        </div>
      </div>
    </div>
  );
};

export default Signup;