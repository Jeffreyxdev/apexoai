

interface LogoProps {
  className?: string;
}

const Logo = ({ className = "" }: LogoProps) => {
  return (
    <div className={`flex items-center ${className}`}>
      <div className="flex items-center justify-center h-8 w-8 rounded-full bg-white/10 mr-2">
        <div className="h-5 w-5 rounded-full bg-white" />
      </div>
      <span className="text-white text-xl font-semibold">ApexoAI</span>
    </div>
  );
};

export default Logo;