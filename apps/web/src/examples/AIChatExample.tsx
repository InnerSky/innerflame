import React from 'react';
import AIChat from '../components/AIChat/AIChat';

// Example component that demonstrates using the AIChat component
const AIChatExample: React.FC = () => {
  // These values would typically come from environment variables
  // or a configuration file in a real application
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
  const websocketUrl = import.meta.env.VITE_WEBSOCKET_URL || 'ws://localhost:3001';
  
  return (
    <div className="ai-chat-example-container">
      <div className="example-header">
        <h1>AI Chat Integration Example</h1>
        <p>
          This example demonstrates real-time communication with the AI service 
          using WebSockets. The chat component handles authentication, message 
          sending, and displaying streaming responses.
        </p>
      </div>
      
      <div className="example-content">
        <AIChat
          supabaseUrl={supabaseUrl}
          supabaseAnonKey={supabaseAnonKey}
          websocketUrl={websocketUrl}
          entityId="example-document-id" // Optional: entity context for the AI
        />
      </div>
      
      <div className="example-notes">
        <h2>Implementation Notes</h2>
        <ul>
          <li>
            Authentication is handled automatically via Supabase session tokens.
          </li>
          <li>
            The component shows connection status and provides reconnection options.
          </li>
          <li>
            Streaming responses from the AI are displayed in real-time with a typing indicator.
          </li>
          <li>
            Messages are preserved during the session and can be scrolled through.
          </li>
          <li>
            An optional entityId can be provided to give the AI context about what document
            or entity the user is currently working with.
          </li>
        </ul>
      </div>
      
      {/* Use a regular style tag with CSS instead of the jsx attribute */}
      <style>{`
        .ai-chat-example-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 24px;
        }
        
        .example-header {
          margin-bottom: 32px;
        }
        
        .example-header h1 {
          font-size: 28px;
          margin-bottom: 16px;
        }
        
        .example-content {
          border: 1px solid #e1e1e1;
          border-radius: 8px;
          padding: 24px;
          margin-bottom: 32px;
          background-color: #f8f9fa;
        }
        
        .example-notes {
          background-color: #f0f4f8;
          padding: 20px;
          border-radius: 8px;
        }
        
        .example-notes h2 {
          font-size: 20px;
          margin-bottom: 16px;
        }
        
        .example-notes ul {
          margin-left: 20px;
        }
        
        .example-notes li {
          margin-bottom: 8px;
        }
      `}</style>
    </div>
  );
};

export default AIChatExample;
