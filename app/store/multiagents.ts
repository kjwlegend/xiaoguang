// src/app/store/doubleAgent.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { StateCreator } from "zustand";
import { DoubleAgentData, createDoubleAgentSession } from "../api/backend/chat";
import { RequestMessage } from "../client/api";
import { nanoid } from "nanoid";
import { estimateTokenLength } from "../utils/chat/token";
import { Conversation } from "microsoft-cognitiveservices-speech-sdk";
import { contextSummarize } from "../chains/summarize";
import { Mask, ChatMessage, ChatToolMessage } from "../types/index";
import { getMessageTextContent } from "../utils";
import { createMultipleAgentSession } from "../services/api/chats";
import { FileInfo } from "../client/platforms/utils";
import { useUserStore } from "./user";
import { getMessagesWithMemory } from "../(chat-pages)/chats/chat/inputpanel/utils/chatMessage";
import { createMessage } from "./chat";
export type MultiAgentChatMessage = ChatMessage & {
	agentId?: number;
};

export type MultiAgentChatSession = {
	id: string;
	aiConfigs: Mask[]; // 存储多个 agent 的配置
	topic: string;
	initialInput: string;
	messages: MultiAgentChatMessage[];
	lastUpdateTime: number;
	updated_at: string;
	created_at: string;
	memory?: any; // 其他可能的会话相关状态
	totalRounds: number; // 迭代次数
	round: number; // 轮次
	paused?: boolean; // 是否暂停
	next_agent_type: "round-robin" | "random" | "intelligent"; // 选择下一个 agent 的策略
};

export const MULTI_AGENT_DEFAULT_TOPIC = "未定义话题";

type StoreState = {
	currentConversationId: string; // 当前会话ID
	conversations: MultiAgentChatSession[]; // 会话列表
	startConversation: (
		topic: string,
		conversationId: string,
		initialInput: string,
	) => void;
	setCurrentConversationId: (id: string) => void;
	fetchNewConversations: (data: any) => void;
	currentSession: () => MultiAgentChatSession;
	addAgent: (conversationId: string, config: Mask) => void;
	setAIConfig: (conversationId: string, agentId: number, config: Mask) => void;
	clearAIConfig: (conversationId: string, agentId: number) => void;
	sortedConversations: () => MultiAgentChatSession[];
	clearConversation: (conversationId: string) => void;
	updateMessages: (
		conversationId: string,
		message: MultiAgentChatMessage,
	) => void;
	updateSingleMessage: (
		conversationId: string,
		messageIndex: number,
		newMessageContent: string,
		toolsMessage?: ChatToolMessage[],
	) => void;
	updateConversation: (
		conversationId: string,
		conversation: MultiAgentChatSession,
	) => void;
	deleteConversation: (conversationId: string | number) => void;
	// return round
	onUserInput: (
		content: string,
		attachImages: string[],
		attachFiles: FileInfo[] | undefined,
		session: MultiAgentChatSession,
	) => Promise<void>;
	updateRound: (conversationId: string) => { round: number };
	getHistory: (conversationId: string) => MultiAgentChatMessage[];
	summarizeSession: (conversationId: string) => Promise<any>;
};
export function createMultiAgentChatMessage(
	override: Partial<MultiAgentChatMessage>,
): MultiAgentChatMessage {
	return {
		id: nanoid(),
		date: new Date().toISOString(),
		content: "",
		role: "user",
		streaming: false,
		toolMessages: [],
		preview: false,

		...override,
	};
}

const storeCreator: StateCreator<StoreState> = (set, get) => ({
	currentConversationId: "",
	aiConfigs: [], // 存储多个 agent 的配置

	conversations: [],
	startConversation: (
		topic: string,
		conversationId: string,
		initialInput: string,
	) => {
		set((state) => {
			const newConversation: MultiAgentChatSession = {
				id: conversationId,
				aiConfigs: [],
				topic: topic,
				initialInput: initialInput,
				messages: [
					createMultiAgentChatMessage({
						content: initialInput,
						role: "user",
					}),
				],
				lastUpdateTime: new Date().getTime(),
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
				memory: "",
				totalRounds: 0,
				round: 0,
				paused: false,
				next_agent_type: "round-robin",
			};

			const newState = {
				currentConversationId: conversationId,
				conversations: [...state.conversations, newConversation],
			};

			return newState;
		});
	},
	setCurrentConversationId: (id) => set({ currentConversationId: id }),
	currentSession: () => {
		const { currentConversationId, conversations } = get();
		return (
			conversations.find((session) => session.id === currentConversationId) ||
			({} as MultiAgentChatSession)
		);
	},
	fetchNewConversations(data: any[]) {
		const existingConversations = get().conversations;

		const newConversations: MultiAgentChatSession[] = data.map(
			(session: any) => ({
				id: session.id,
				aiConfigs: session.custom_agents_data || [], // 使用多个 agent 配置
				topic: session.session_topic || MULTI_AGENT_DEFAULT_TOPIC,
				initialInput: session.session_description || "",
				messages: [], // 这里假设没有初始消息，需要后续加载
				lastUpdateTime: Date.parse(session.updated_at),
				created_at: session.created_at,
				updated_at: session.updated_at,
				totalRounds: 0, // 假设初始为 0，需要后续更新
				round: 0, // 假设初始为 0，需要后续更新
				paused: false, // 默认不暂停
				next_agent_type: "round-robin", // 默认使用轮询策略
				memory: "",
			}),
		);

		const updatedConversations = existingConversations.slice(); // 创建现有会话的副本

		newConversations.forEach((newConv: MultiAgentChatSession) => {
			const index = updatedConversations.findIndex(
				(conv) => conv.id === newConv.id,
			);

			if (index !== -1) {
				// 比较 lastUpdateTime
				if (
					newConv.lastUpdateTime > updatedConversations[index].lastUpdateTime
				) {
					// 如果现有的 aiConfigs 配置 存在则保留, 不存在则替换
					if (updatedConversations[index].aiConfigs) {
						newConv.aiConfigs = updatedConversations[index].aiConfigs;
					} else {
						newConv.aiConfigs = newConv.aiConfigs;
					}
					updatedConversations[index] = newConv;
				}
			} else {
				updatedConversations.push(newConv);
			}
		});

		set({
			conversations: updatedConversations,
		});
		get().sortedConversations();
	},
	addAgent(conversationId, config) {
		//  Add a new agent to the conversation

		set((state) => {
			const updatedConversations = state.conversations.map((session) => {
				if (session.id === conversationId) {
					const updatedAIConfigs = [...session.aiConfigs];

					updatedAIConfigs.push(config);
					return {
						...session,
						aiConfigs: updatedAIConfigs,
					};
				}

				return session;
			});
			return {
				conversations: updatedConversations,
			};
		});
	},
	setAIConfig: (conversationId: string, agentId: number, config: Mask) =>
		set((state) => {
			const updatedConversations = state.conversations.map((conversation) => {
				if (conversation.id === conversationId) {
					const updatedAIConfigs = conversation.aiConfigs.map(
						(aiConfig, index) => {
							if (index === agentId) {
								return { ...aiConfig, ...config };
							}
							return aiConfig;
						},
					);
					return {
						...conversation,
						aiConfigs: updatedAIConfigs,
					};
				}
				return conversation;
			});
			return {
				conversations: updatedConversations,
			};
		}),
	sortedConversations: () => {
		const { conversations } = get();
		// 排序会话列表
		// 按照最后更新时间从新到旧排序
		// 创建新列表

		const sortedConversations = conversations.sort(
			(a, b) => b.lastUpdateTime - a.lastUpdateTime,
		);

		set({ conversations: sortedConversations });

		console.log("sortedConversations", sortedConversations);
		return sortedConversations;
	},
	clearConversation: (conversationId: string) =>
		set((state) => {
			const updatedConversations = state.conversations.map((conversation) => {
				console.log("conversation.id", conversation.id, conversationId);
				if (conversation.id === conversationId) {
					return {
						...conversation,
						round: 0,
						messages: [],
					};
				}
				return conversation;
			});
			console.log("updatedConversations", updatedConversations);
			return {
				conversations: updatedConversations,
			};
		}),

	clearAIConfig: (conversationId: string, agentId: number) =>
		set((state) => {
			const updatedConversations = state.conversations.map((conversation) => {
				if (conversation.id === conversationId) {
					const updatedAIConfigs = conversation.aiConfigs.filter(
						(_, index) => index !== agentId,
					);
					return {
						...conversation,
						aiConfigs: updatedAIConfigs,
					};
				}
				return conversation;
			});
			return {
				conversations: updatedConversations,
			};
		}),
	// 更新消息
	updateMessages: (conversationId: string, message: MultiAgentChatMessage) =>
		set((state) => {
			const updatedConversations = state.conversations.map((session) => {
				if (session.id === conversationId) {
					return {
						...session,
						messages: [...session.messages, message],
					};
				}

				return session;
			});

			return {
				conversations: updatedConversations,
			};
		}),
	// 更新单条消息
	updateSingleMessage: (
		conversationId: string,
		messageIndex: number,
		newMessageContent: string,
		toolsMessage?: ChatToolMessage[],
	) =>
		set((state) => {
			const updatedConversations = state.conversations.map((session) => {
				if (session.id === conversationId) {
					// 确保消息索引在范围内
					if (messageIndex >= 0 && messageIndex < session.messages.length) {
						const currentMessage = session.messages[messageIndex];
						// 检查新旧消息内容是否一致
						if (currentMessage.content === newMessageContent) {
							// 消息内容没有变化，无需更新
							return session;
						}

						// 创建一个新的消息数组，其中包含更新后的消息
						const updatedMessages = session.messages.map((message, index) => {
							if (index === messageIndex) {
								// 更新消息内容
								return {
									...message,
									content: newMessageContent,
									// 如果需要，还可以更新timestamp或其他属性
									//如果存在 toolsMessage, 则更新
									toolMessages:
										toolsMessage !== undefined
											? toolsMessage
											: message.toolMessages,

									timestamp: Date.now(),
								};
							}
							return message;
						});

						// 返回更新后的会话
						return {
							...session,
							messages: updatedMessages,
						};
					}
				}
				return session;
			});

			// 返回更新后的状态
			return {
				conversations: updatedConversations,
			};
		}),
	// update conversation
	updateConversation: (
		conversationId: string,
		conversation: MultiAgentChatSession,
	) =>
		set((state) => {
			const updatedConversations = state.conversations.map((session) => {
				if (session.id === conversationId) {
					return conversation;
				}
				// 如果会话ID不匹配，则返回原始会话
				return session;
			});
			get().sortedConversations();
			return {
				// 返回更新后的会话
				conversations: updatedConversations,
			};
		}),
	deleteConversation: (conversationId: string | number) =>
		set((state) => {
			const updatedConversations = state.conversations.filter(
				(session) => session.id !== conversationId,
			);
			return {
				conversations: updatedConversations,
			};
		}),

	updateRound: (conversationId: string) => {
		set((state) => {
			let newRound: number = 0;
			const updatedConversations = state.conversations.map((session) => {
				if (session.id === conversationId) {
					const newRound = session.round + 1;
					// Check if the newRound is greater than or equal to totalRounds to pause
					if (newRound >= session.totalRounds) {
						console.log("pause", newRound, session.totalRounds);
						return { ...session, round: newRound, paused: true };
					}
					return { ...session, round: newRound };
				}
				return session;
			});

			return { conversations: updatedConversations };
		});
		// 获取更新后的会话round值并返回
		const updatedSession = get().conversations.find(
			(session) => session.id === conversationId,
		);
		return { round: updatedSession ? updatedSession.round : -1 };
	},
	onUserInput: async (
		content: string,
		attachImages: string[],
		attachFiles: FileInfo[] | undefined,
		session: MultiAgentChatSession,
	) => {
		console.log("workflow submit debug", session);

		const sessionId = session.id;
		const sessionModel = session.mask.modelConfig.model;
		const modelConfig = session.mask.modelConfig;
		const { id: userid, nickname } = useUserStore.getState().user;
		// 获取最近的消息
		const { recentMessages, recentMessagesTokenCount } =
			getMessagesWithMemory(session);

		const contentTokenCount = estimateTokenLength(content);
		const total_token_count = recentMessagesTokenCount + contentTokenCount;

		let userMessage: ChatMessage;
		let botMessage: ChatMessage;
		let sendMessages: ChatMessage[];

		const commonChatData = {
			user: userid,
			sessionId: sessionId, // 替换为实际的聊天会话 ID
			model: sessionModel,
			contentType: "workflowchatgroup",
		};

		console.log("workflow submit debug , before try");

		try {
			const createChatData = {
				...commonChatData,
				content: content, // 使用用户输入作为 message 参数
				attachImages: attachImages,
				recentMessages: recentMessages,
				chat_role: "user",
				sender_name: nickname,
				totalTokenCount: total_token_count,
			};
			console.log("workflow submit debug, before api", createChatData);

			const { chat_id, id } = await createChatDataAndFetchId(createChatData);

			console.log("workflow submit debug, after api");

			const userContent = content;
			console.log("[User Input] after template: ", userContent);

			let mContent: string | MultimodalContent[] = userContent;

			if (attachImages && attachImages.length > 0) {
				mContent = [
					{
						type: "text",
						text: userContent,
					},
				];
				mContent = mContent.concat(
					attachImages.map((url) => ({
						type: "image_url",
						image_url: { url },
					})),
				);
			}

			userMessage = createMessage({
				id,
				chat_id,
				role: "user",
				content: mContent,
				image_url: attachImages,
				// fileInfos: attachFiles,
				token_counts_total: total_token_count,
			});

			console.log("[userMessage] ", userMessage);

			botMessage = createMessage({
				role: "assistant",
				streaming: true,
				model: modelConfig.model,
				toolMessages: [],
				isFinished: false,
			});

			const newMessages = [userMessage, botMessage];
			const fullMessageList = session.messages.concat(newMessages);
			const updates: Partial<ChatSession> = {
				messages: fullMessageList,
			};

			//  找到对应的session, 将 userMessage 和botMessage 进行更新

			get().onNewMessage(newMessages, session);

			sendMessages = recentMessages.concat(userMessage);
			// 发送函数回调
			const onUpdateCallback = (message: string) => {
				// 其他需要在 onUpdate 时执行的逻辑
				// console.log(
				// 	`Message updated: ${message}, botmessage: `,
				// 	botMessage,
				// );
				botMessage.content = message;
				const updates = {
					messages: fullMessageList,
				};
				get().updateWorkflowSession(
					session.workflow_group_id,
					sessionId,
					updates,
				);
			};

			const onToolUpdateCallback = (toolName: string, toolInput: string) => {
				// 这里可以进行 tool 更新的逻辑
				console.log(`Tool updated: ${toolName}, Input: ${toolInput}`);
			};

			const onFinishCallback = async (message: string) => {
				// updateSession(message);
				console.log(`Message finished: ${message}`);

				// 其他需要在 onFinish 时执行的逻辑
				const tokenCount = estimateTokenLength(message);

				const createBotChatData = {
					...commonChatData,
					content: message,
					attachImages: attachImages,
					recentMessages: recentMessages,
					chat_role: "assistant",
					sender_name: session.mask.name,
					sender_id: session.mask.id,
					totalTokenCount: tokenCount,
				};

				const { chat_id, id } =
					await createChatDataAndFetchId(createBotChatData);

				if (id) {
					botMessage.id = id;
					botMessage.chat_id = chat_id.toString();
				}
				botMessage.isFinished = true;
				botMessage.isTransfered = false;
				botMessage.token_counts_total = tokenCount;
				get().updateWorkflowSession(session.workflow_group_id, sessionId, {
					messages: fullMessageList,
				});

				if (session.enableAutoFlow) {
					// 如果在激活了 autoflow 的基础上, 则找到 nextSession
					const nextSession = get().getNextSession(sessionId);
					// 如果存在 next session , 则调用自身onuserinput, 将 botMessage 发送出去
					if (nextSession) {
						console.log("next session", nextSession);
						get().onUserInput(message, attachImages, attachFiles, nextSession);
					}
					// 若不存在, 则终止
					else {
						console.log("no next session");
						return;
					}
				}
			};
			// 调用发送消息函数
			sendChatMessage(
				session,
				sendMessages,
				handleChatCallbacks(
					botMessage,
					userMessage,
					session,
					onUpdateCallback,
					onToolUpdateCallback,
					onFinishCallback,
				),
			);
		} catch (error) {
			console.log(error);
			throw error;
		}
	},
	getHistory: (conversationId: string) => {
		// return messages
		const MAX_TOKEN_COUNT = 3000; // 最大的token数量

		const conversation = get().conversations.find(
			(m) => m.id === conversationId,
		);
		if (!conversation) {
			return []; // 如果没有找到会话，返回空数组
		}

		// 1. 获取历史消息
		let messages = conversation.messages.slice(); // 获取会话的消息副本

		// 2. 决定获取最大历史消息的数量
		// 这里的实现取决于你如何定义最大历史消息数量，这里假设是消息数组的长度
		let maxMessageCount = messages.length;

		// 3. 取决于tokenCount 不超过3000
		// 4. 如果超过3000，则减少获取的消息数量
		let tokenCount = 0;
		let historyMessages = [];
		for (let i = maxMessageCount - 1; i >= 0; i--) {
			const message = messages[i];
			const messageTokenCount = estimateTokenLength(
				getMessageTextContent(message),
			); // 估算消息的token数量

			if (tokenCount + messageTokenCount > MAX_TOKEN_COUNT) {
				break; // 如果超过最大token数量，则停止添加消息
			}

			tokenCount += messageTokenCount;
			historyMessages.push(message); // 添加消息到历史消息数组
		}

		return historyMessages; // 返回历史消息
	},
	summarizeSession: async (conversationId: string) => {
		// 获取会话
		const session = get().conversations.find(
			(session) => session.id === conversationId,
		);
		if (!session) {
			return; // 如果会话不存在，则返回
		}

		// 获取历史消息
		const historyMessages = get().getHistory(conversationId).reverse();
		//  获取会话并转换成字符串
		const historyMessageString = historyMessages
			.map((m) => m.content)
			.join("\n");
		// 计算会话 token, 小于1000时则不进行summarize
		if (estimateTokenLength(historyMessageString) < 1000) {
			console.log(
				"historyMessageString",
				historyMessageString,
				"token length",
				estimateTokenLength(historyMessageString),
				"记忆长度小于1000，不进行summarize",
			);
			return "";
		}

		// 获取会话的摘要
		const summary = await contextSummarize(historyMessages, session.memory);
		console.log("memory in store", summary);

		// 更新会话的摘要
		set((state) => {
			const updatedConversations = state.conversations.map((session) => {
				if (session.id === conversationId) {
					return {
						...session,
						memory: summary,
					};
				}
				return session;
			});

			return {
				conversations: updatedConversations,
			};
		});
		return summary || "";
	},
});

export const useMultipleAgentStore = create<StoreState>()(
	persist(storeCreator, {
		name: "double-agent-storage",
		version: 1.0,
		migrate: (persistedState, version) => {
			if (version < 1.0) {
				console.log("Clearing storage due to version mismatch");
				return {}; // 清空存储
			}
			return persistedState;
		},
	}),
);

// 增加错误处理机制
useMultipleAgentStore.subscribe((state) => {
	try {
		localStorage.setItem("double-agent-storage", JSON.stringify(state));
	} catch (error) {
		console.error("Failed to persist state:", error);
	}
});
