import React from 'react';
import AIChatExample from '../examples/AIChatExample';

const AIChatExamplePage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8 min-h-screen">
      <h1 className="text-2xl font-bold mb-6">AI Chat Integration Example</h1>
      <AIChatExample />
    </div>
  );
};

export default AIChatExamplePage;
