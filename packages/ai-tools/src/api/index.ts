import { Anthropic } from "@anthropic-ai/sdk"
import { ApiConfiguration, ModelInfo } from "../shared/api"
import { AnthropicHandler } from "./providers/anthropic"
import { AwsBedrockHandler } from "./providers/bedrock"
import { OpenRouterHandler } from "./providers/openrouter"
import { VertexHandler } from "./providers/vertex"
import { OpenAiHandler } from "./providers/openai"
import { OllamaHandler } from "./providers/ollama"
import { LmStudioHandler } from "./providers/lmstudio"
import { GeminiHandler } from "./providers/gemini"
import { OpenAiNativeHandler } from "./providers/openai-native"
import { ApiStream } from "./transform/stream"
import { DeepSeekHandler } from "./providers/deepseek"
import { RequestyHandler } from "./providers/requesty"
import { TogetherHandler } from "./providers/together"
import { QwenHandler } from "./providers/qwen"
import { MistralHandler } from "./providers/mistral"
import { VsCodeLmHandler } from "./providers/vscode-lm"
import { ClineHandler } from "./providers/cline"
import { LiteLlmHandler } from "./providers/litellm"
import { AskSageHandler } from "./providers/asksage"
import { XAIHandler } from "./providers/xai"
import { SambanovaHandler } from "./providers/sambanova"
import { withLogging } from "./logging.js"

export interface ApiHandler {
	createMessage(systemPrompt: string, messages: Anthropic.Messages.MessageParam[]): ApiStream
	getModel(): { id: string; info: ModelInfo }
}

export interface SingleCompletionHandler {
	completePrompt(prompt: string): Promise<string>
}

export function buildApiHandler(configuration: ApiConfiguration): ApiHandler {
	console.log('==== API HANDLER FACTORY CALLED ====');
	console.log(`Provider: ${configuration.apiProvider}`);
	
	const { apiProvider, ...options } = configuration
	let handler: ApiHandler;
	
	switch (apiProvider) {
		case "anthropic":
			handler = new AnthropicHandler(options)
			break;
		case "openrouter":
			handler = new OpenRouterHandler(options)
			break;
		case "bedrock":
			handler = new AwsBedrockHandler(options)
			break;
		case "vertex":
			handler = new VertexHandler(options)
			break;
		case "openai":
			handler = new OpenAiHandler(options)
			break;
		case "ollama":
			handler = new OllamaHandler(options)
			break;
		case "lmstudio":
			handler = new LmStudioHandler(options)
			break;
		case "gemini":
			handler = new GeminiHandler(options)
			break;
		case "openai-native":
			handler = new OpenAiNativeHandler(options)
			break;
		case "deepseek":
			handler = new DeepSeekHandler(options)
			break;
		case "requesty":
			handler = new RequestyHandler(options)
			break;
		case "together":
			handler = new TogetherHandler(options)
			break;
		case "qwen":
			handler = new QwenHandler(options)
			break;
		case "mistral":
			handler = new MistralHandler(options)
			break;
		case "vscode-lm":
			handler = new VsCodeLmHandler(options)
			break;
		case "cline":
			handler = new ClineHandler(options)
			break;
		case "litellm":
			handler = new LiteLlmHandler(options)
			break;
		case "asksage":
			handler = new AskSageHandler(options)
			break;
		case "xai":
			handler = new XAIHandler(options)
			break;
		case "sambanova":
			handler = new SambanovaHandler(options)
			break;
		default:
			handler = new AnthropicHandler(options)
	}
	
	console.log('Adding logging wrapper to API handler');
	// Wrap the handler with API logging
	return withLogging(handler);
}
