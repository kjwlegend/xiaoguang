import { getClientConfig } from "../config/client";
import { ACCESS_CODE_PREFIX, Azure, ServiceProvider } from "../constant";
import { ModelType, useAccessStore } from "../store";
import { ChatMessage } from "@/app/types/";

import { ChatGPTApi } from "./platforms/openai";
import { FileApi } from "./platforms/utils";

export const ROLES = ["system", "user", "assistant"] as const;
export type MessageRole = (typeof ROLES)[number];

export const Models = ["gpt-3.5-turbo", "gpt-4"] as const;
export type ChatModel = ModelType;

export interface RequestMessage {
	role: MessageRole;
	content: string;
	image_url?: string;
}

export interface LLMConfig {
	model: string;
	temperature?: number;
	top_p?: number;
	stream?: boolean;
	presence_penalty?: number;
	frequency_penalty?: number;
}

export interface LLMAgentConfig {
	maxIterations: number;
	returnIntermediateSteps: boolean;
	useTools?: (string | undefined)[];
}

export interface ChatOptions {
	messages: RequestMessage[];
	config: LLMConfig;
	onToolUpdate?: (toolName: string, toolInput: string) => void;
	onUpdate?: (message: string, chunk: string) => void;
	onFinish: (message: string) => void;
	onError?: (err: Error) => void;
	onController?: (controller: AbortController) => void;
}

export interface AgentChatOptions {
	messages: RequestMessage[];
	config: LLMConfig;
	agentConfig: LLMAgentConfig;
	onToolUpdate?: (toolName: string, toolInput: string) => void;
	onUpdate?: (message: string, chunk: string) => void;
	onFinish: (message: string) => void;
	onError?: (err: Error) => void;
	onController?: (controller: AbortController) => void;
}

export interface LLMUsage {
	used: number;
	total: number;
}

export interface LLMModel {
	name: string;
	available: boolean;
	displayName?: string;
}

export abstract class LLMApi {
	abstract chat(options: ChatOptions): Promise<void>;
	abstract toolAgentChat(options: AgentChatOptions): Promise<void>;
	abstract usage(): Promise<LLMUsage>;
	abstract models(): Promise<LLMModel[]>;
}

type ProviderName = "openai" | "azure" | "claude" | "palm";

interface Model {
	name: string;
	provider: ProviderName;
	ctxlen: number;
}

interface ChatProvider {
	name: ProviderName;
	apiConfig: {
		baseUrl: string;
		apiKey: string;
		summaryModel: Model;
	};
	models: Model[];

	chat: () => void;
	usage: () => void;
}

export abstract class ToolApi {
	abstract call(input: string): Promise<string>;
	abstract name: string;
	abstract description: string;
}

export class ClientApi {
	public llm: LLMApi;
	public file: FileApi;

	constructor() {
		this.llm = new ChatGPTApi();
		this.file = new FileApi();
	}

	config() {}

	prompts() {}

	masks() {}

	async share(messages: ChatMessage[], avatarUrl: string | null = null) {
		const msgs = messages
			.map((m) => ({
				from: m.role === "user" ? "human" : "gpt",
				value: m.content,
			}))
			.concat([
				{
					from: "human",
					value:
						"Share from [ChatGPT Next Web]: https://github.com/Yidadaa/ChatGPT-Next-Web",
				},
			]);
		// 敬告二开开发者们，为了开源大模型的发展，请不要修改上述消息，此消息用于后续数据清洗使用
		// Please do not modify this message

		console.log("[Share]", messages, msgs);
		const clientConfig = getClientConfig();
		const proxyUrl = "/sharegpt";
		const rawUrl = "https://sharegpt.com/api/conversations";
		const shareUrl = clientConfig?.isApp ? rawUrl : proxyUrl;
		const res = await fetch(shareUrl, {
			body: JSON.stringify({
				avatarUrl,
				items: msgs,
			}),
			headers: {
				"Content-Type": "application/json",
			},
			method: "POST",
		});

		const resJson = await res.json();
		console.log("[Share]", resJson);
		if (resJson.id) {
			return `https://shareg.pt/${resJson.id}`;
		}
	}
}

export const api = new ClientApi();

export function getAuthHeaders() {
	const accessStore = useAccessStore.getState();
	const headers: Record<string, string> = {};

	const isAzure = accessStore.provider === ServiceProvider.Azure;
	const authHeader = isAzure ? "api-key" : "Authorization";
	const apiKey = isAzure ? accessStore.azureApiKey : accessStore.openaiApiKey;

	const makeBearer = (s: string) => `${isAzure ? "" : "Bearer "}${s.trim()}`;
	const validString = (x: string) => x && x.length > 0;

	// use user's api key first
	if (validString(apiKey)) {
		headers[authHeader] = makeBearer(apiKey);
	} else if (
		accessStore.enabledAccessControl() &&
		validString(accessStore.accessCode)
	) {
		headers[authHeader] = makeBearer(
			ACCESS_CODE_PREFIX + accessStore.accessCode,
		);
	}

	return headers;
}

export function getHeaders() {
	const accessStore = useAccessStore.getState();
	const headers: Record<string, string> = {
		"Content-Type": "application/json",
		"x-requested-with": "XMLHttpRequest",
	};

	const isAzure = accessStore.provider === ServiceProvider.Azure;
	const authHeader = isAzure ? "api-key" : "Authorization";
	const apiKey = isAzure ? accessStore.azureApiKey : accessStore.openaiApiKey;

	const makeBearer = (s: string) => `${isAzure ? "" : "Bearer "}${s.trim()}`;
	const validString = (x: string) => x && x.length > 0;

	// use user's api key first
	if (validString(apiKey)) {
		headers[authHeader] = makeBearer(apiKey);
	} else if (
		accessStore.enabledAccessControl() &&
		validString(accessStore.accessCode)
	) {
		headers[authHeader] = makeBearer(
			ACCESS_CODE_PREFIX + accessStore.accessCode,
		);
	}

	return headers;
}
