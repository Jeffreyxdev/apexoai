
import React from "react";


interface SocialButtonProps {
  icon: React.ElementType;
  label: string;
  onClick?: () => void;
}

const SocialButton = ({ icon: Icon, label, onClick }: SocialButtonProps) => {
  return (
    <button
      
      className="flex items-center justify-center gap-2 w-full bg-transparent text-white border-white/20 hover:bg-white/10"
      onClick={onClick}
    >
      <Icon size={18} />
      <span>{label}</span>
    </button>
  );
};

export default SocialButton;
