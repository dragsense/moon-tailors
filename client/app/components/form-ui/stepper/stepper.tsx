import { Check } from "lucide-react";
import { Fragment } from "react";
import { cn } from "~/lib/utils";

export type StepperItem = {
 label: string;
 description?: string;
};

export type StepperProps = {
 /** 0-based active step index. */
 currentStep: number;
 steps: StepperItem[];
 className?: string;
 /** Allow jumping back to a completed step. */
 onStepClick?: (index: number) => void;
};

/**
 * Horizontal step indicator — circle + label + connector.
 * Inspired by stepper UIs; kept generic for any SchemaSteps wizard.
 */
export function Stepper({
 currentStep,
 steps,
 className,
 onStepClick,
}: StepperProps) {
 return (
 <nav aria-label="Form steps" className={cn("w-full", className)}>
 <ol className="flex w-full items-center">
 {steps.map((step, index) => {
 const isActive = index === currentStep;
 const isCompleted = index < currentStep;
 const isLast = index === steps.length - 1;
 const clickable = Boolean(onStepClick) && isCompleted;

 return (
 <Fragment key={`${step.label}-${index}`}>
 <li className="flex items-center">
 <div className="flex flex-col items-center">
 <button
 type="button"
 disabled={!clickable}
 aria-current={isActive ? "step" : undefined}
 onClick={ () => {
 if (clickable) onStepClick?.(index);
 }}
 className={cn(
 "flex size-9 shrink-0 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors",
 (isCompleted || isActive) &&
 "border-primary bg-primary text-primary-foreground",
 !isCompleted &&
 !isActive &&
 "border-muted-foreground/40 bg-background text-muted-foreground",
 clickable && "cursor-pointer hover:opacity-90",
 !clickable && "cursor-default",
)}
 >
 {isCompleted ? (
 <Check className="size-4" aria-hidden />
) : (
 <span>{index + 1}</span>
)}
 </button>
 <div className="mt-2 max-w-28 text-center sm:max-w-36">
 <p
 className={cn(
 "text-sm font-medium leading-tight",
 isActive ? "text-foreground" : "text-muted-foreground",
)}
 >
 {step.label}
 </p>
 {step.description ? (
 <p className="mt-0.5 hidden text-xs text-muted-foreground sm:block">
 {step.description}
 </p>
) : null}
 </div>
 </div>
 </li>
 {!isLast ? (
 <li className="mx-3 mb-8 flex-1 self-start pt-4" aria-hidden>
 <div
 className={cn(
 "h-0.5 w-full transition-colors",
 isCompleted ? "bg-primary" : "bg-muted",
)}
 />
 </li>
) : null}
 </Fragment>
);
 })}
 </ol>
 </nav>
);
}
