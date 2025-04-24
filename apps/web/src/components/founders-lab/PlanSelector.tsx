import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

type PlanFeature = {
  text: string;
};

type PlanProps = {
  title: string;
  description: string;
  price: string;
  period: string;
  features: PlanFeature[];
  buttonText: string;
  bestFor?: string;
  onButtonClick: () => void;
};

const Plan = ({
  title,
  description,
  price,
  period,
  features,
  buttonText,
  bestFor,
  onButtonClick
}: PlanProps) => {
  return (
    <div className="flex-1 bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 p-6 md:p-8 flex flex-col h-full shadow-sm transition-all duration-300 hover:shadow-md">
      <div className="mb-6">
        <h3 className="text-2xl font-bold mb-2">{title}</h3>
        <p className="text-neutral-600 dark:text-neutral-400">{description}</p>
      </div>
      
      <div className="mb-6">
        <div className="flex items-baseline">
          <span className="text-3xl font-bold">{price}</span>
          <span className="text-neutral-600 dark:text-neutral-400 ml-1">{period}</span>
        </div>
      </div>
      
      <div className="flex-1 mb-6">
        <h4 className="font-medium mb-3">What's included</h4>
        <ul className="space-y-2">
          {features.map((feature, index) => (
            <li key={index} className="flex">
              <Check className="h-5 w-5 text-orange-500 shrink-0 mr-2" />
              <span className="text-neutral-700 dark:text-neutral-300">{feature.text}</span>
            </li>
          ))}
        </ul>
      </div>
      
      {bestFor && (
        <div className="mb-6">
          <h4 className="font-medium mb-1">Best for</h4>
          <p className="text-neutral-700 dark:text-neutral-300">{bestFor}</p>
        </div>
      )}
      
      <div className="mt-auto">
        <Button 
          onClick={onButtonClick}
          variant="outline"
          className="w-full"
        >
          {buttonText}
        </Button>
      </div>
    </div>
  );
};

export const PlanSelector = () => {
  const freePlanFeatures = [
    { text: "Create 1 Lean Canvas" },
    { text: "1 active project" },
    { text: "1,000 AI Mentor credits" },
    { text: "Access to basic AI model" },
    { text: "Save & share live Lean Canvas link" },
  ];
  
  const plusPlanFeatures = [
    { text: "Everything in Free, plus…" },
    { text: "Unlimited strategy docs (Ikigai, Golden Circle, Experiment Plans, Metrics Dashboards)" },
    { text: "Branch your docs" },
    { text: "10,000 AI Mentor credits / mo" },
    { text: "Access to Advanced AI models" },
    { text: "Full Startup Knowledge Vault" },
    { text: "Experiment autolog + progress timeline" },
    { text: "Early access to new AI features" }
  ];
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full max-w-6xl mx-auto">
      <Plan
        title="Free"
        description="Explore disciplined validation at zero cost"
        price="$0"
        period="/ month"
        features={freePlanFeatures}
        buttonText="Get Free"
        bestFor="First‑time founders sketching an idea"
        onButtonClick={() => {}}
      />
      
      <Plan
        title="Plus"
        description="Unlock the full Founder's Lab engine for rapid traction"
        price="$79"
        period="/ month"
        features={plusPlanFeatures}
        buttonText="Upgrade to Plus"
        bestFor="Founders committed to running weekly experiments & winning customers"
        onButtonClick={() => {}}
      />
    </div>
  );
}; 