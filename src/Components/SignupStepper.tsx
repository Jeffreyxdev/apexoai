
import { cn } from "../lib/utils";

interface StepProps {
  number: number;
  title: string;
  active?: boolean;
  completed?: boolean;
}

const Step = ({ number, title, active, completed }: StepProps) => {
  return (
    <div className="flex items-center mb-4">
      <div
        className={cn(
          "flex items-center justify-center h-8 w-8 rounded-full mr-3 transition-colors",
          {
            "bg-white text-black": active || completed,
            "bg-white/20 text-white": !active && !completed,
          }
        )}
      >
        {number}
      </div>
      <span className="text-white">{title}</span>
    </div>
  );
};

const SignupStepper = () => {
  return (
    <div className="mt-8">
      <Step number={1} title="Sign up your account" active />
      <Step number={2} title="Set up your workspace" />
      <Step number={3} title="Set up your profile" />
    </div>
  );
};

export default SignupStepper;
