import { Check } from 'lucide-react';

interface ProgressStepperProps {
  status: string;
}

const ProgressStepper = ({ status }: ProgressStepperProps) => {
  const steps = [
    { label: 'Submitted', statuses: ['Pending', 'In Progress', 'Resolved', 'Closed', 'Escalated'] },
    { label: 'In Progress', statuses: ['In Progress', 'Resolved', 'Closed', 'Escalated'] },
    { label: 'Resolved', statuses: ['Resolved', 'Closed'] },
    { label: 'Closed', statuses: ['Closed'] },
  ];

  return (
    <div className="flex items-center gap-2 w-full max-w-md">
      {steps.map((step, index) => {
        const isActive = step.statuses.includes(status);
        const isLast = index === steps.length - 1;

        return (
          <div key={step.label} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div
                className={`h-6 w-6 rounded-full flex items-center justify-center border-2 transition-colors ${
                  isActive
                    ? 'bg-primary border-primary text-primary-foreground'
                    : 'bg-background border-border text-muted-foreground'
                }`}
              >
                {isActive && <Check className="h-3 w-3" />}
              </div>
              <span className={`text-[10px] mt-1 text-center ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                {step.label}
              </span>
            </div>
            {!isLast && (
              <div
                className={`h-0.5 flex-1 mx-1 transition-colors ${
                  steps[index + 1].statuses.includes(status) ? 'bg-primary' : 'bg-border'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ProgressStepper;
