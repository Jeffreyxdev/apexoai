import Logo from "../Components/Logo";
import LoginForm from "../Components/LoginForm";
import bg from '../assets/bg.png'

const Login = () => {
  return (
    <div className="flex min-h-screen">
      {/* Left section with gradient */}
      <div className="hidden md:flex md:w-1/2 bg-gradient-purple flex-col p-10">
        <img
          className="absolute inset-0 bg-cover bg-center filter blur-sm brightness-75 z-0 h-[100vh] w-[50vw]"
          src={bg}
        />
        <Logo className="z-10"/>
        <div className="flex flex-col justify-center items-start h-full max-w-md mx-auto z-10">
          <h1 className="text-4xl font-bold text-white mb-3">Welcome Back</h1>
          <p className="text-white/70 mb-8">
            Log in to access your account and continue your journey with us.
          </p>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white font-semibold">
                1
              </div>
              <span className="text-white text-lg">Access your workspace</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white font-semibold">
                2
              </div>
              <span className="text-white text-lg">Continue your projects</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white font-semibold">
                3
              </div>
              <span className="text-white text-lg">Collaborate with your team</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Right section with form */}
      <div className="w-full md:w-1/2 bg-black flex flex-col p-6 md:p-10">
        <div className="md:hidden mb-8">
          <Logo />
        </div>
        <div className="flex flex-col justify-center items-center h-full">
          <LoginForm />
        </div>
      </div>
    </div>
  );
};

export default Login;