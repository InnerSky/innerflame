/**
 * Unit tests for AnthropicAdapter
 */
import { 
  AnthropicAdapter, 
  createAnthropicAdapter 
} from '../AnthropicAdapter.js';
import { 
  Message, 
  MessageRole
} from '../../../interfaces/LLMProvider.js';
import { AnthropicHandler } from '../../../../api/providers/anthropic.js';

// Mock handler implementation
const mockCreateMessage = jest.fn().mockImplementation(async function* () {
  yield { type: 'text', text: 'Mock response' };
  yield { type: 'usage', inputTokens: 10, outputTokens: 5 };
});

const mockGetModel = jest.fn().mockReturnValue({ id: 'claude-3-mock' });

// Mock the AnthropicHandler
jest.mock('../../../../api/providers/anthropic.js', () => {
  return {
    AnthropicHandler: jest.fn().mockImplementation(() => {
      return {
        getModel: mockGetModel,
        createMessage: mockCreateMessage,
      };
    }),
  };
});

describe('AnthropicAdapter', () => {
  const apiKey = 'mock-api-key';
  const messages: Message[] = [
    {
      role: MessageRole.SYSTEM,
      content: 'You are a helpful assistant.'
    },
    {
      role: MessageRole.USER,
      content: 'Hello, how are you?'
    }
  ];
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create an instance with defaults', () => {
      const adapter = new AnthropicAdapter(apiKey);
      expect(adapter).toBeInstanceOf(AnthropicAdapter);
      expect(AnthropicHandler).toHaveBeenCalled();
    });

    it('should create an instance with custom options', () => {
      const adapter = new AnthropicAdapter(apiKey, {
        defaultModel: 'claude-3-custom',
        defaultMaxTokens: 2000
      });
      expect(adapter).toBeInstanceOf(AnthropicAdapter);
      expect(AnthropicHandler).toHaveBeenCalled();
    });

    it('should throw if apiKey is not provided', () => {
      expect(() => new AnthropicAdapter('')).toThrow('Anthropic API key is required');
    });
  });

  describe('createAnthropicAdapter factory function', () => {
    it('should create an adapter instance', () => {
      const adapter = createAnthropicAdapter(apiKey);
      expect(adapter).toBeInstanceOf(AnthropicAdapter);
    });
  });

  describe('convertMessages', () => {
    it('should convert messages to Anthropic format', () => {
      const adapter = new AnthropicAdapter(apiKey);
      // @ts-ignore - Access private method for testing
      const convertedMessages = adapter.convertMessages(messages);
      
      expect(convertedMessages).toHaveLength(1); // System message is filtered out
      expect(convertedMessages[0]).toEqual({
        role: 'user',
        content: 'Hello, how are you?'
      });
    });
  });

  describe('sendMessage', () => {
    it('should return a valid response', async () => {
      const adapter = new AnthropicAdapter(apiKey);
      const response = await adapter.sendMessage(messages);
      
      expect(response).toBeDefined();
      expect(response.content).toBe('Mock response');
      expect(response.model).toBe('claude-3-mock');
      expect(response.usage).toEqual({
        inputTokens: 10,
        outputTokens: 5
      });
    });

    it('should handle options correctly', async () => {
      const adapter = new AnthropicAdapter(apiKey);
      const options = {
        systemPrompt: 'Custom system prompt',
        model: 'claude-3-custom',
        temperature: 0.7,
        maxTokens: 100
      };
      
      await adapter.sendMessage(messages, options);
      
      // Verify that handler.createMessage was called with the system prompt
      expect(mockCreateMessage)
        .toHaveBeenCalledWith('Custom system prompt', expect.any(Array));
    });

    it('should handle errors', async () => {
      // Mock implementation that throws an error
      mockCreateMessage.mockImplementationOnce(async function* () {
        throw new Error('API Error');
      });
      
      const adapter = new AnthropicAdapter(apiKey);
      
      await expect(adapter.sendMessage(messages))
        .rejects.toThrow('API Error');
    });
  });

  describe('streamMessage', () => {
    it('should return a readable stream', async () => {
      const adapter = new AnthropicAdapter(apiKey);
      const stream = await adapter.streamMessage(messages);
      
      expect(stream).toBeInstanceOf(ReadableStream);
      
      // Test reading from the stream
      const reader = stream.getReader();
      const { done, value } = await reader.read();
      
      expect(done).toBe(false);
      expect(value).toBeInstanceOf(Uint8Array);
      
      const decoded = new TextDecoder().decode(value);
      expect(decoded).toContain('content_block_delta');
      expect(decoded).toContain('Mock response');
    });
  });
}); 