import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ChatSession } from "../types/chat";
import {
	createWorkflowSession,
	deleteWorkflowSession,
	updateWorkflowSession,
} from "../api/backend/chat";
import { useUserStore } from "./user";
import { nanoid } from "nanoid";
import { Chat } from "../(chat-pages)/chats/chat/main";

export interface WorkflowGroup {
	id: string;
	topic: string;
	description: string;
	summary: string;
	agent_numbers: number;
	chat_session_ids: string[];
	updated_at: string;
	created_at: string;
	lastUpdateTime: number | string | Date;

	[key: string]: any;
}
export type workflowChatSession = ChatSession & {
	workflow_group_id: string;
	order: number;
};
type State = {
	workflowGroups: WorkflowGroup[];
	workflowGroupIndex: { [groupId: string]: number }; // 索引对象
	workflowSessions: workflowChatSession[];
	workflowSessionsIndex: { [groupId: string]: any[] };
	selectedId: string;
	setSelectedId: (index: string) => void;
	addWorkflowGroup: (groupId: string, groupName: string) => void;
	updateWorkflowGroup: (
		groupId: string,
		updates: Partial<WorkflowGroup>,
	) => void;

	deleteWorkflowGroup: (groupId: string | number) => void;
	fetchNewWorkflowGroup: (data: Array<WorkflowGroup>) => void;
	sortWorkflowGroups: () => void;
	addSessionToGroup: (groupId: string, session: ChatSession) => void;
	updateWorkflowSession: (
		groupId: string,
		sessionId: string,
		updates: Partial<ChatSession>,
	) => void;

	moveSession: (
		groupId: string,
		sourceIndex: number,
		destinationIndex: number,
	) => void;
	deleteSessionFromGroup: (groupId: string, sessionId: string) => void;
	getWorkflowSessionId: (groupId: string) => string[];
	getCurrentWorkflowGroup: (selectedId: string) => WorkflowGroup | null;
};

export const useWorkflowStore = create<State>()(
	persist(
		(set, get) => ({
			workflowGroups: [],
			workflowGroupIndex: {},
			selectedId: "",
			setSelectedId: (index) => set({ selectedId: index }),
			workflowSessions: [],
			workflowSessionsIndex: {},
			addWorkflowGroup: (groupId, topic) => {
				const newGroup: WorkflowGroup = {
					id: groupId,
					topic: topic,
					chat_session_ids: [],
					agent_numbers: 0,
					summary: "",
					description: "等待你创作无限的可能",
					lastUpdateTime: new Date().getTime(),
					created_at: new Date().toISOString(),
					updated_at: new Date().toISOString(),
				};

				set((state) => {
					const newIndex = state.workflowGroups.length;
					return {
						workflowGroups: [...state.workflowGroups, newGroup],
						workflowGroupIndex: {
							...state.workflowGroupIndex,
							[groupId]: newIndex,
						},
					};
				});
				get().setSelectedId(groupId);
				get().sortWorkflowGroups();
			},
			updateWorkflowGroup: (groupId, updates) => {
				set((state) => {
					const index = state.workflowGroupIndex[groupId];
					if (index === undefined) return state;

					const updatedGroup = {
						...state.workflowGroups[index],
						...updates,
					};
					const updatedGroups = [...state.workflowGroups];
					updatedGroups[index] = updatedGroup;
					return { workflowGroups: updatedGroups };
				});
				get().sortWorkflowGroups();
			},

			deleteWorkflowGroup: (groupId) => {
				set((state) => {
					const index = state.workflowGroupIndex[groupId];
					if (index === undefined) return state;

					// 删除 workflowGroups 中的特定 group
					const updatedGroups = state.workflowGroups.filter(
						(_, i) => i !== index,
					);

					// 更新 workflowGroupIndex
					const updatedIndex: { [key: string]: number } = {};
					updatedGroups.forEach((group, i) => {
						updatedIndex[group.id] = i;
					});

					// 删除与 groupId 相关的 workflowSessions
					const updatedSessions = state.workflowSessions.filter(
						(session) => session.workflow_group_id !== groupId,
					);

					// 删除 workflowSessionsIndex 中的特定 group
					const { [groupId]: _, ...updatedSessionsIndex } =
						state.workflowSessionsIndex;

					return {
						workflowGroups: updatedGroups,
						workflowGroupIndex: updatedIndex,
						workflowSessions: updatedSessions,
						workflowSessionsIndex: updatedSessionsIndex,
					};
				});

				if (Object.keys(get().workflowGroupIndex).length === 0) {
					get().setSelectedId("");
				}

				if (get().selectedId === groupId) {
					const firstGroup = get().workflowGroups[0]?.id || "";
					get().setSelectedId(firstGroup);
				}
			},
			fetchNewWorkflowGroup: (data: WorkflowGroup[]) => {
				// console.log("store debug:adding workflow", data);
				const existingGroups = get().workflowGroups;
				const existingIndex = get().workflowGroupIndex;

				const updatedGroups = [...existingGroups]; // 创建一个新的工作组数组
				const updatedIndex = { ...existingIndex }; // 创建一个新的索引对象

				data.forEach((item) => {
					const {
						id,
						session_id,
						session_topic,
						session_description,
						session_summary,
						agent_numbers,
						chat_groups,
						updated_at,
						created_at,
					} = item;

					// Convert updated_at string to Date timestamp
					const lastUpdateTime = new Date(updated_at).getTime();
					const existingGroupIndex = existingIndex[id];

					if (
						existingGroupIndex === undefined ||
						new Date(lastUpdateTime) >
							new Date(existingGroups[existingGroupIndex].lastUpdateTime)
					) {
						const newGroup = {
							id,
							topic: session_topic,
							summary: session_summary,
							description: session_description,
							created_at: created_at,
							updated_at: updated_at,
							agent_numbers: agent_numbers,
							lastUpdateTime,
							chat_session_ids: chat_groups !== undefined ? chat_groups : [],
							sessions: [],
						};

						if (existingGroupIndex === undefined) {
							// console.log(
							// 	"store debug:new group",
							// 	newGroup,
							// 	"index",
							// 	existingGroupIndex,
							// );
							// 如果该组不存在，则将其添加到数组末尾
							updatedGroups.push(newGroup);
							updatedIndex[id] = updatedGroups.length - 1; // 更新索引以指向新组
						} else {
							// 如果该组已存在，进行合并操作

							updatedGroups[existingGroupIndex] = {
								...updatedGroups[existingGroupIndex],
								...newGroup, // 合并新组的属性
								lastUpdateTime, // 确保更新时间被更新
								chat_session_ids: [
									...new Set([
										...updatedGroups[existingGroupIndex].chat_session_ids,
										...newGroup.chat_session_ids,
									]), // 合并 chat_session_ids 并去重
								],
								sessions: updatedGroups[existingGroupIndex].sessions || [],
							};
						}
					}
				});

				set(() => ({
					workflowGroups: updatedGroups,
					workflowGroupIndex: updatedIndex,
				}));
				get().sortWorkflowGroups();
			},

			sortWorkflowGroups: () => {
				set((state) => {
					const sortedGroups = state.workflowGroups.sort(
						(a, b) =>
							new Date(b.lastUpdateTime).getTime() -
							new Date(a.lastUpdateTime).getTime(),
					);

					// 重新构建索引以匹配排序后的数组
					const newIndex: { [key: string]: number } = {};
					sortedGroups.forEach((group, index) => {
						newIndex[group.id] = index;
					});

					return {
						workflowGroups: sortedGroups,
						workflowGroupIndex: newIndex, // 更新索引为新的顺序
					};
				});
			},
			addSessionToGroup: (groupId: string, session: ChatSession) => {
				set((state) => {
					const index = state.workflowGroupIndex[groupId];
					if (index === undefined) return state;

					//  判断当前的order , 如果还没有存在workflowSessionsIndex[groupId] 则初始化
					const sessions = state.workflowSessionsIndex[groupId] || [];

					// 将 workflow_group_id 添加到 session
					const newSession: workflowChatSession = {
						...session,
						workflow_group_id: groupId,
						order: sessions.length,
					};

					// 确保 newSession.id 存在
					if (newSession.id === undefined) {
						console.error("newSession.id is undefined");
						return state;
					}

					// 更新 workflowSessions
					const updatedSessions = [...state.workflowSessions, newSession];

					// 获取新添加的 session 的 ID
					const newSessionId = newSession.id;

					// 更新 workflowSessionsIndex
					const updatedSessionsIndex = {
						...state.workflowSessionsIndex,
						[groupId]: [
							...(state.workflowSessionsIndex[groupId] || []),
							newSessionId,
						],
					};

					return {
						workflowSessions: updatedSessions,
						workflowSessionsIndex: updatedSessionsIndex,
					};
				});
			},
			updateWorkflowSession: (
				groupId: string,
				sessionId: string,
				updates: Partial<ChatSession>,
			) => {
				set((state) => {
					const groupIndex = state.workflowGroupIndex[groupId];
					if (groupIndex === undefined) return state;

					// 在 workflowSessions 中找到对应的 session
					const sessionIndex = state.workflowSessions.findIndex(
						(session) =>
							session.id === sessionId && session.workflow_group_id === groupId,
					);
					if (sessionIndex === -1) return state;

					// 获取当前 session
					const currentSession = state.workflowSessions[sessionIndex];

					// 检查是否有实际的更新
					const updatedSession = {
						...currentSession,
						...updates,
					};

					// 深度比较更新前后的状态
					if (
						JSON.stringify(currentSession) === JSON.stringify(updatedSession)
					) {
						return state; // 如果没有实际更新，不改变状态
					}

					// 直接更新特定的 session
					state.workflowSessions[sessionIndex] = updatedSession;

					return state;
				});
			},

			moveSession: (groupId, sourceIndex, destinationIndex) => {
				set((state) => {
					const groupIndex = state.workflowGroupIndex[groupId];
					if (groupIndex === undefined) return state;

					// 获取该 groupId 下的所有 sessions 的索引
					const sessionIds = state.workflowSessionsIndex[groupId];
					if (!sessionIds) return state;

					if (
						sourceIndex < 0 ||
						sourceIndex >= sessionIds.length ||
						destinationIndex < 0 ||
						destinationIndex >= sessionIds.length
					) {
						return state;
					}

					console.log(
						"sourceIndex",
						sourceIndex,
						"destinationIndex",
						destinationIndex,
					);

					// 移动 session
					const newSessionIds = [...sessionIds];
					const [removed] = newSessionIds.splice(sourceIndex, 1);
					newSessionIds.splice(destinationIndex, 0, removed);

					// 更新 order 属性
					const updatedSessions = state.workflowSessions.map((session) => {
						if (session.workflow_group_id === groupId) {
							const newIndex = newSessionIds.indexOf(session.id);
							return { ...session, order: newIndex };
						}
						return session;
					});

					// 更新 workflowSessionsIndex
					const updatedSessionsIndex = {
						...state.workflowSessionsIndex,
						[groupId]: newSessionIds,
					};

					return {
						workflowSessions: updatedSessions,
						workflowSessionsIndex: updatedSessionsIndex,
						lastUpdateTime: Date.now(), // 确保状态总是被更新
					};
				});
			},

			deleteSessionFromGroup: (groupId: string, sessionId: string | number) => {
				set((state) => {
					const index = state.workflowGroupIndex[groupId];
					if (index === undefined) return state;

					// 在 workflowSessions 中删除对应的 session
					const updatedSessions = state.workflowSessions.filter(
						(session) =>
							session.id !== sessionId || session.workflow_group_id !== groupId,
					);

					// 更新 workflowSessionsIndex
					const updatedSessionsIndex = {
						...state.workflowSessionsIndex,
						[groupId]: updatedSessions
							.filter((session) => session.workflow_group_id === groupId)
							.map((session) => session.id),
					};

					return {
						workflowSessions: updatedSessions,
						workflowSessionsIndex: updatedSessionsIndex,
					};
				});
			},
			getWorkflowSessionId: (groupId: string) => {
				const sessions = get().workflowSessionsIndex[groupId] || [];
				return sessions;
			},
			getCurrentWorkflowGroup: (selectedId: string) => {
				const index = get().workflowGroupIndex[selectedId];
				const group = index !== undefined ? get().workflowGroups[index] : null;
				return group;
			},
		}),
		{
			name: "workflow-store",
		},
	),
);
