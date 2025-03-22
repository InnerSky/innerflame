import { 
  LLMProvider, 
  Message, 
  MessageRole, 
  RequestOptions, 
  LLMResponse 
} from './interfaces/LLMProvider.js';
import { 
  AgentMessage,
  AgentMessageRole
} from '../langgraph/types.js';

/**
 * Adapter for converting between agent message format and LLM provider format
 */
export class LLMAdapter {
  private provider: LLMProvider;
  
  constructor(provider: LLMProvider) {
    this.provider = provider;
  }
  
  /**
   * Convert agent messages to LLM provider format
   */
  convertToProviderMessages(messages: AgentMessage[]): Message[] {
    return messages.filter(msg => 
      msg.role === AgentMessageRole.USER || 
      msg.role === AgentMessageRole.ASSISTANT ||
      msg.role === AgentMessageRole.SYSTEM
    ).map(msg => {
      let role: MessageRole;
      
      switch (msg.role) {
        case AgentMessageRole.USER:
          role = MessageRole.USER;
          break;
        case AgentMessageRole.ASSISTANT:
          role = MessageRole.ASSISTANT;
          break;
        case AgentMessageRole.SYSTEM:
          role = MessageRole.SYSTEM;
          break;
        default:
          role = MessageRole.USER;
      }
      
      return {
        role,
        content: msg.content
      };
    });
  }
  
  /**
   * Send a message to the LLM provider
   */
  async sendMessage(
    messages: AgentMessage[],
    options?: RequestOptions
  ): Promise<LLMResponse> {
    const providerMessages = this.convertToProviderMessages(messages);
    return this.provider.sendMessage(providerMessages, options);
  }
  
  /**
   * Create a streaming message request to the LLM provider
   */
  async streamMessage(
    messages: AgentMessage[],
    options?: RequestOptions
  ): Promise<ReadableStream<Uint8Array>> {
    const providerMessages = this.convertToProviderMessages(messages);
    return this.provider.streamMessage(providerMessages, options);
  }
}

/**
 * Create an LLM adapter with the provided LLM provider
 */
export function createLLMAdapter(provider: LLMProvider): LLMAdapter {
  return new LLMAdapter(provider);
} 