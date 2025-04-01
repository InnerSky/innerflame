import React from 'react';
import { QuestionnaireRenderer } from '../features/questionnaire/components/QuestionnaireRenderer.js';

export default function TestQuestionnairePage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-semibold mb-6 text-center">Onboarding Questionnaire</h1>
      <QuestionnaireRenderer questionnaireType="onboarding" />
      
      {/* Additional info section */}
      <div className="mt-12 max-w-md mx-auto border-t border-border/40 pt-4">
        <h2 className="text-lg font-medium mb-2">About this questionnaire</h2>
        <p className="text-muted-foreground text-sm">
          This questionnaire helps us personalize your experience. Your responses will be saved
          as you progress, allowing you to continue later if needed.
        </p>
      </div>
    </div>
  );
} 