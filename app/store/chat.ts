import { trimTopic } from "../utils";

import Locale, { getLang } from "../locales";
import { showToast } from "../components/ui-lib";
import { ModelConfig, ModelType, useAppConfig } from "./config";
import { createEmptyMask } from "./mask";
import { StoreKey, SUMMARIZE_MODEL } from "../constant";

import { estimateTokenLength } from "../utils/chat/token";
import { nanoid } from "nanoid";

import { UserStore, useUserStore } from "./user";
import { BUILTIN_MASKS, DEFAULT_MASK } from "../masks";
import type { BuiltinMask, sessionConfig } from "../types/index";
import { Plugin, usePluginStore } from "../store/plugin";
import {
	sendChatMessage,
	handleChatCallbacks,
	createChatDataAndFetchId,
} from "../services/chatService";
import { midjourneyOnUserInput } from "../services/midjourneyService";
// import { DEFAULT_TOPIC, BOT_HELLO } from "./constant";

import { createPersistStore } from "../utils/store";

import { summarizeTitle, summarizeSession } from "../chains/summarize";
import {
	CreateChatData,
	CreateChatSessionData,
	createChat,
	createChatSession,
	updateChatSession,
} from "@/app/services/api/chats";

import { getMessageTextContent, getMessageImages } from "../utils";

import {
	ChatMessage,
	ChatToolMessage,
	ChatSession,
	MJMessage,
} from "../types/index";
import { Mask } from "../types/index";

import { FileInfo } from "../client/platforms/utils";
import { fillTemplateWith } from "@/app/chains/base";
import { MultimodalContent } from "../client/api";
import { Tracing } from "trace_events";
import { getMessagesWithMemory } from "../(chat-pages)/chats/chat/inputpanel/utils/chatMessage";
import { getMessages } from "@fortaine/fetch-event-source/lib/cjs/parse";

export function createMessage(override: Partial<ChatMessage>): ChatMessage {
	const randomId = nanoid();
	return {
		id: randomId,
		nanoid: randomId,
		date: new Date().toLocaleString(),
		toolMessages: new Array<ChatToolMessage>(),
		role: "user",
		content: "",
		image_url: [],
		...override,
	};
}

export const DEFAULT_TOPIC = Locale.Store.DefaultTopic || "未命名话题";

export const BOT_HELLO: ChatMessage = createMessage({
	role: "assistant",
	content: Locale.Store.BotHello,
});

export function createEmptySession(props: {
	id?: string;
	topic?: string;
	mask?: Mask;
}): ChatSession {
	return {
		id: props.id ?? nanoid(),
		session_id: "",
		topic: props.topic ?? DEFAULT_TOPIC,
		memoryPrompt: "",
		messages: [],
		stat: {
			tokenCount: 0,
		},
		lastUpdateTime: Date.now(),
		lastSummarizeIndex: 0,
		mask: props.mask ?? createEmptyMask(),
		isworkflow: false,
		mjConfig: { size: "", quality: "", stylize: "", model: "" },
		isDoubleAgent: false,
	};
}

function getSummarizeModel(currentModel: string) {
	// if it is using gpt-* models, force to use 3.5 to summarize
	return currentModel.startsWith("gpt") ? SUMMARIZE_MODEL : currentModel;
}

interface ChatStore {
	sessions: ChatSession[];
	currentSessionIndex: number;
	clearSessions: () => void;
	moveSession: (from: number, to: number) => void;
	selectSession: (index: number) => void;
	newSession: (mask?: Mask, useUserStore?: UserStore) => ChatSession;
	deleteSession: (index: number, useUserStore?: UserStore) => void;
	currentSession: () => ChatSession;
	nextSession: (delta: number) => void;
	onNewMessage: (message: ChatMessage) => void;
	onUserInput: (content: string, sessionId?: string) => Promise<void>;
	updateStat: (message: ChatMessage) => void;
	updateCurrentSession: (updater: (session: ChatSession) => void) => void;
	updateSession(
		sessionId: string,
		updater: (session: ChatSession) => void,
	): void;
	updateMessage: (
		sessionIndex: number,
		messageIndex: number,
		updater: (message?: ChatMessage) => void,
	) => void;
	resetSession: () => void;
	getMessagesWithMemory: (session?: ChatSession) => ChatMessage[];
	clearAllData: () => void;
}

function countMessages(msgs: ChatMessage[]) {
	return msgs.reduce(
		(pre, cur) => pre + estimateTokenLength(getMessageTextContent(cur)),
		0,
	);
}

const DEFAULT_CHAT_STATE = {
	sessions: [createEmptySession({})],
	currentSessionIndex: 0,
	currentSessionId: "",
};

export const useChatStore = createPersistStore(
	DEFAULT_CHAT_STATE,
	(set, _get) => {
		function get() {
			return {
				..._get(),
				...methods,
			};
		}

		const methods = {
			clearSessions() {
				set(() => ({
					sessions: [],
					currentSessionIndex: 0,
				}));
			},

			selectSession(index: number) {
				if (index < 0 || index >= get().sessions.length) {
					console.error("Invalid session index:", index);
					return;
				}
				console.log("selectSession: ", index);
				set({
					currentSessionIndex: index,
					currentSessionId: get().sessions[index].id,
				});
			},
			selectSessionById(id: string) {
				const index = get().sessions.findIndex((session) => session.id === id);
				if (index !== -1) {
					get().selectSession(index);
				} else {
					console.log("No session found with the given id:", id);
				}
			},

			moveSession(from: number, to: number, _sessions?: any) {
				set((state) => {
					const { sessions, currentSessionIndex: oldIndex } = state;

					if (_sessions) {
						// console.log("sessions: ", sessions);
						const newSessions = [..._sessions];
						const oldSessions = sessions.filter(
							(session) => !newSessions.includes(session),
						);
						const session = newSessions[from];
						newSessions.splice(from, 1);
						newSessions.splice(to, 0, session);
						// 传入sessions 时, 将新的sessions 和原本的state.sessions 进行合并
						const mergedSessions = [...oldSessions, ...newSessions];

						return {
							sessions: mergedSessions,
						};
					} else {
						// move the session
						const newSessions = [...sessions];
						const session = newSessions[from];
						newSessions.splice(from, 1);
						newSessions.splice(to, 0, session);

						// modify current session id
						let newIndex = oldIndex === from ? to : oldIndex;
						if (oldIndex > from && oldIndex <= to) {
							newIndex -= 1;
						} else if (oldIndex < from && oldIndex >= to) {
							newIndex += 1;
						}

						return {
							currentSessionIndex: newIndex,
							sessions: newSessions,
						};
					}
				});
			},

			async newSession(
				mask?: Mask,
				userStore?: UserStore,
				isworkflow?: boolean,
			) {
				console.log("newsession");
				const config = useAppConfig.getState();
				let session: ChatSession;
				const userId = useUserStore.getState().user.id;
				const globalModelConfig = config.modelConfig;

				// 使用类型守卫来检查 'id' 属性是否存在
				const defaultMaskId = "2";
				const selectedMask: any = mask ?? DEFAULT_MASK;

				// 如果 selectedMask 没有 'id' 属性，我们提供一个默认值

				// 处理 userStore 相关逻辑
				const data: CreateChatSessionData = {
					user: userId,
					active: true,
					agent: mask?.id ?? 1,
					session_topic: DEFAULT_TOPIC,
					session_summary: "",
					session_description: "",
					custom_agent_data: selectedMask,
				};

				// 使用 async/await 优化异步请求处理
				try {
					const res = await createChatSession(data);
					if (!res.id) throw new Error("Failed to create chat session");

					session = createEmptySession({
						id: res.id,
						topic: DEFAULT_TOPIC,
						mask: mask,
					});

					if (isworkflow) session.isworkflow = true;

					session.mask = {
						...selectedMask,
						id: defaultMaskId ?? selectedMask.id,
						modelConfig: {
							...globalModelConfig,
							...selectedMask.modelConfig,
						},
					};

					set((state) => ({
						currentSessionIndex: 0,
						currentSessionId: session.id,
						sessions: [session, ...state.sessions],
					}));

					get().selectSession(res.id);
				} catch (error) {
					console.error("Error creating chat session:", error);
				}
			},

			nextSession(delta: number) {
				const n = get().sessions.length;
				const limit = (x: number) => (x + n) % n;
				const i = get().currentSessionIndex;
				get().selectSession(limit(i + delta));
			},

			deleteSession(sessionId: string) {
				const sessions = get().sessions;

				const sessionIndex = sessions.findIndex((session) => {
					// console.log(
					// 	typeof session.id,
					// 	session.id,
					// 	typeof sessionId,
					// 	sessionId,
					// ); // 打印类型和内容
					return session.id == sessionId; // 去掉可能存在的空白字符
				});

				// 如果没有找到对应的会话，直接返回
				if (sessionIndex === -1) return;

				const deletingLastSession = sessions.length === 1;
				const deletedSession = sessions[sessionIndex];

				// 更新会话状态
				updateChatSession({ active: false }, sessionId);

				// 创建一个新的会话数组，删除指定的会话
				const updatedSessions = sessions.slice();
				updatedSessions.splice(sessionIndex, 1);

				const currentIndex = get().currentSessionIndex;
				let nextIndex = Math.min(
					currentIndex - Number(sessionIndex < currentIndex),
					updatedSessions.length - 1,
				);

				// 用于撤销删除操作的状态
				const restoreState = {
					currentSessionIndex: get().currentSessionIndex,
					sessions: sessions.slice(),
				};

				// 更新状态
				set(() => ({
					currentSessionIndex: nextIndex,
					sessions: updatedSessions,
				}));

				// 显示撤销删除的提示
				showToast(
					Locale.Home.DeleteToast,
					{
						text: Locale.Home.Revert,
						onClick() {
							set(() => restoreState);
							updateChatSession({ active: true }, sessionId);
						},
					},
					5000,
				);
			},

			currentSession() {
				let index = get().currentSessionIndex;
				const sessions = get().sessions;
				// console.log(
				// 	`store debug - currentSessionIndex: ${index}, sessions length: ${sessions.length}`,
				// );

				if (index === undefined || index === null) {
					throw new Error("Index is not defined");
				}

				if (index < 0 || index >= sessions.length) {
					index = Math.min(sessions.length - 1, Math.max(0, index));
					set(() => ({ currentSessionIndex: index }));
				}

				const session = sessions[index];

				return session;
			},
			getSession(_session?: ChatSession) {
				let session: ChatSession;
				// 定义一个session
				if (_session) {
					session = _session;
				} else {
					session = get().currentSession();
				}
				return session;
			},

			onNewMessage(message: ChatMessage) {
				get().updateCurrentSession((session) => {
					session.messages = session.messages.concat();
					session.lastUpdateTime = Date.now();
				});
				summarizeSession();
			},

			addMessageToSession: (sessionId: string, newMessage: ChatMessage) => {
				set((state) => ({
					sessions: state.sessions.map((session) => {
						if (session.session_id === sessionId) {
							session.messages = [...session.messages, newMessage];
						}
						return session;
					}),
				}));
			},
			sortSession() {
				set((state) => {
					// Create a new sorted array instead of modifying the existing state directly
					const sortedSessions = [...state.sessions].sort(
						(a, b) => b.lastUpdateTime - a.lastUpdateTime,
					);

					// Check if the sorted array is different from the current state to avoid unnecessary updates
					if (
						JSON.stringify(state.sessions) !== JSON.stringify(sortedSessions)
					) {
						return { sessions: sortedSessions };
					}

					// If the sorted array is the same as the current state, do not update the state
					return state;
				});
				// console.log("sortSession", get().sessions);
			},

			addSession(newSession: ChatSession) {
				set((state) => ({ sessions: [...state.sessions, newSession] }));
				get().sortSession();
			},

			forceUpdate: () => {
				set({});
			},

			async onUserInput(
				content: string,
				attachImages?: string[],
				attachFiles?: FileInfo[],
				_session?: ChatSession,
			) {
				const session = get().getSession(_session);
				const sessionId = session.id;
				const sessionModel = session.mask.modelConfig.model;
				const modelConfig = session.mask.modelConfig;
				const userStore = useUserStore.getState();

				// 获取最近的消息
				const { recentMessages, recentMessagesTokenCount } =
					getMessagesWithMemory(session);

				const contentTokenCount = estimateTokenLength(content);
				const total_token_count = recentMessagesTokenCount + contentTokenCount;

				let userMessage: ChatMessage;
				let botMessage: ChatMessage;
				let sendMessages: ChatMessage[];

				const commonChatData = {
					user: userStore.user.id,
					sessionId: sessionId, // 替换为实际的聊天会话 ID
					model: session.mask.modelConfig.model,
					content_type: "chatsession",
				};

				try {
					const createChatData = {
						...commonChatData,
						content: content, // 使用用户输入作为 message 参数
						attachImages: attachImages,
						recentMessages: recentMessages,
						chat_role: "user",
						sender_name: userStore.user.nickname,
						totalTokenCount: total_token_count,
					};

					const { chat_id, id } =
						await createChatDataAndFetchId(createChatData);

					const userContent = content;
					// console.log("[User Input] after template: ", userContent);

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
						fileInfos: attachFiles,
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

					sendMessages = recentMessages.concat(userMessage);
					// 更新会话
					get().updateSession(
						sessionId,
						(session: ChatSession) => {
							const savedUserMessage = { ...userMessage, content: mContent };
							session.messages = session.messages.concat([
								savedUserMessage,
								botMessage,
							]);
							session.responseStatus = false;
							session.lastUpdateTime = Date.now();
							set((state) => ({ sessions: state.sessions }));
						},
						false,
					);

					get().sortSession();

					// 发送函数回调
					const onUpdateCallback = (message: string) => {
						botMessage.content = message;
						botMessage.lastUpdateTime = Date.now();

						get().updateCurrentSession((session) => {
							session.messages = session.messages.concat();
							// console.log("onUpdateCallback", session.messages);
							session.lastUpdateTime = Date.now();
						});
					};

					const onToolUpdateCallback = (
						toolName: string,
						toolInput: string,
					) => {
						// 这里可以进行 tool 更新的逻辑
						console.log(`Tool updated: ${toolName}, Input: ${toolInput}`);
						get().updateCurrentSession((session) => {
							session.messages = session.messages.concat();
							session.lastUpdateTime = Date.now();
						});
					};

					const onFinishCallback = async (message: string) => {
						// updateSession(message);

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
							botMessage.isFinished = true;
							botMessage.isTransfered = false;
							botMessage.token_counts_total = tokenCount;
							get().onNewMessage(botMessage);
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
					console.log("click send: ", sendMessages, session.responseStatus);
				} catch (error: any) {
					// const botError = "API 请求失败, 请重新登录后重试";
					const botError = error.message as string;

					console.error("[Error] createChat API call failed:", error);
					userMessage = createMessage({
						id: nanoid(),
						chat_id: undefined,
						role: "user",
						content: content,
						image_url: attachImages,
						fileInfos: attachFiles,
						token_counts_total: total_token_count,
					});

					botMessage = createMessage({
						role: "assistant",
						streaming: false,
						model: modelConfig.model,
						toolMessages: [],
						isFinished: false,
						content: botError,
					});

					// 更新会话
					get().updateSession(
						sessionId,
						(session: ChatSession) => {
							const savedUserMessage = { ...userMessage, content };
							session.messages = session.messages.concat([
								savedUserMessage,
								botMessage,
							]);
							session.responseStatus = false;
							session.lastUpdateTime = Date.now();
							set((state) => ({ currentSessionIndex: 0 }));
						},
						false,
					);
				}
			},

			updateSessionMessage(
				session: ChatSession,
				botMessageId: string,
				content: string,
				imageUrl = [] as string[],
				mjresult?: MJMessage,
			) {
				const chatStoreState = useChatStore.getState();

				const sync = false;
				chatStoreState.updateSession(
					session.id,
					() => {
						const messageIndex = session.messages.findIndex(
							(m) => m.id === botMessageId,
						);
						if (messageIndex !== -1) {
							const currentMessage = session.messages[messageIndex];
							if (
								currentMessage.content !== content ||
								currentMessage.image_url !== imageUrl
							) {
								const updatedBotMessage: ChatMessage = {
									...currentMessage,
									content: content,
									image_url: imageUrl,
									mjstatus: mjresult,
								};
								session.messages[messageIndex] = updatedBotMessage;
							}
						}
						session.lastUpdateTime = Date.now();
					},
					sync,
				);
			},

			updateMessage(sessionId: string, messageId: string, message: string) {
				const sessions = get().sessions;
				const index = get().currentSessionIndex;

				sessions[index].messages = sessions[index].messages.map((m) => {
					if (m.id === messageId) {
						m.content = message;
					}

					return m;
				});
				sessions[index].lastUpdateTime = Date.now();
				set(() => ({ sessions }));
			},

			getMessages(sessionId: string) {
				return get().currentSession().messages;
			},

			resetSession() {
				get().updateCurrentSession((session) => {
					session.messages = [];
					session.memoryPrompt = "";
				});
			},

			updateCurrentSession(updater: (session: ChatSession) => void) {
				const sessions = get().sessions;
				const index = get().currentSessionIndex;
				updater(sessions[index]);
				set(() => ({ sessions }));
			},
			updateSession(
				sessionId: string | undefined,
				updater: (session: ChatSession) => void,
				// add another parameter to control whether to sync with backend, default is true
				sync = true,
			) {
				const userId = useUserStore.getState().user.id;
				if (sessionId) {
					set((state) => ({
						sessions: state.sessions.map((session) => {
							if (session.id === sessionId) {
								// 直接应用 updater 回调函数
								updater(session);
								console.log("sesison update", session);

								if (sync) {
									const data: CreateChatSessionData = {
										...session,
										session_topic: session.topic,
										user: userId,
									};
									updateChatSession(data, sessionId);
									console.log("store 同步触发");
								}
							}
							return session;
						}),
					}));
				} else {
					this.updateCurrentSession(updater);
				}
			},
			setworkflow(_session: ChatSession, isworkflow: boolean) {
				const sessionId = _session.id;
				set((state) => ({
					sessions: state.sessions.map((session) => {
						if (session.id === sessionId) {
							session.isworkflow = isworkflow;
							const data = {
								isworkflow: isworkflow,
							};
							updateChatSession(session, sessionId);
						}
						return session;
					}),
				}));
			},
			clearChatData() {
				localStorage.removeItem(StoreKey.Chat);
				location.reload();
			},

			clearAllData() {
				localStorage.clear();
				location.reload();
			},
		};

		return methods;
	},
	{
		name: StoreKey.Chat,
		version: 3.6,
		migrate(persistedState, version) {
			const state = persistedState as any;
			const newState = JSON.parse(
				JSON.stringify(state),
			) as typeof DEFAULT_CHAT_STATE;

			if (version < 2) {
				newState.sessions = [];

				const oldSessions = state.sessions;
				for (const oldSession of oldSessions) {
					const newSession = createEmptySession({});
					newSession.topic = oldSession.topic;
					newSession.messages = [...oldSession.messages];
					newSession.mask.modelConfig.sendMemory = true;
					newSession.mask.modelConfig.historyMessageCount = 4;
					newSession.mask.modelConfig.compressMessageLengthThreshold = 1000;
					newState.sessions.push(newSession);
				}
			}

			if (version < 3) {
				// migrate id to nanoid
				newState.sessions.forEach((s) => {
					s.id = nanoid();
					s.messages.forEach((m) => (m.id = nanoid()));
				});
			}

			// Enable `enableInjectSystemPrompts` attribute for old sessions.
			// Resolve issue of old sessions not automatically enabling.
			if (version < 3.1) {
				newState.sessions.forEach((s) => {
					if (
						// Exclude those already set by user
						!s.mask.modelConfig.hasOwnProperty("enableInjectSystemPrompts")
					) {
						// Because users may have changed this configuration,
						// the user's current configuration is used instead of the default
						const config = useAppConfig.getState();
						s.mask.modelConfig.enableInjectSystemPrompts =
							config.modelConfig.enableInjectSystemPrompts;
					}
				});
			}

			//  add isworkflow attribute to old sessions
			if (version < 3.2) {
				newState.sessions.forEach((s) => {
					s.isworkflow = false;
					s.mjConfig = {
						size: "",
						quality: "",
						stylize: "",
						model: "",
						speed: "",
						seed: "",
					};
				});
			}
			if (version < 3.4) {
				newState.sessions.forEach((s) => {
					s.mask.modelConfig.enableRelatedQuestions = false;
					s.mask.modelConfig.enableUserInfos = true;
				});
			}
			if (version < 3.5) {
				//准备更新内容
			}

			return newState as any;
		},
	},
);
