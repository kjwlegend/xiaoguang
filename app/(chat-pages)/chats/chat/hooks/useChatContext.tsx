"use client";
import { useChatStore } from "@/app/store";
import { ChatMessage, ChatSession } from "@/app/types/chat";
import { message } from "antd";
import { children } from "cheerio/lib/api/traversing";
import React, {
	createContext,
	useContext,
	useState,
	useCallback,
	useEffect,
	useMemo,
} from "react";
import { RenderMessage } from "../chatbody/MessageList";
import { useWorkflowStore } from "@/app/store/workflow";
import { MultiAgentChatSession } from "@/app/store/multiagents";

import { workflowChatSession, sessionConfig } from "@/app/types/";
interface ActionContextType {
	setHitBottom: React.Dispatch<React.SetStateAction<boolean>>;
	setAutoScroll: React.Dispatch<React.SetStateAction<boolean>>;
	setShowPromptModal: React.Dispatch<React.SetStateAction<boolean>>;
	setEnableAutoFlow: React.Dispatch<React.SetStateAction<boolean>>;
	setSession: React.Dispatch<React.SetStateAction<any>>;
	setSubmitType: React.Dispatch<
		React.SetStateAction<"chat" | "workflow" | "multiagent">
	>;
	setMessages?: React.Dispatch<React.SetStateAction<any>>;
}

interface ChatContextValue {
	hitBottom: boolean;
	autoScroll: boolean;
	showPromptModal: boolean;
	enableAutoFlow: boolean;
	submitType: "chat" | "workflow" | "multiagent";
	currentSessionId: string;
}

const ChatActionContext = React.createContext<ActionContextType>({
	setHitBottom: () => {},
	setAutoScroll: () => {},
	setShowPromptModal: () => {},
	setEnableAutoFlow: () => {},
	setSession: () => {},
	setSubmitType: () => {},
	setMessages: () => {},
});

const ChatSessionContext = React.createContext({});
const ChatMessagesContext = React.createContext({});

const defaultChatContextValue: ChatContextValue = {
	hitBottom: true,
	autoScroll: true,
	showPromptModal: false,
	enableAutoFlow: false,
	submitType: "chat",
	currentSessionId: "0",
};

export const ChatSettingContext = React.createContext(defaultChatContextValue);

export const ChatProvider = ({
	_session,
	children,
	storeType,
}: {
	_session: ChatSession | workflowChatSession;
	children: React.ReactNode;
	storeType: string;
}) => {
	let store;
	if (storeType === "workflow") {
		store = useWorkflowStore();
	} else if (storeType === "chatstore") {
		store = useChatStore();
	}

	if (!store) {
		console.log("no store");
		return null;
	}

	// 分离 session 数据

	// 独立管理 session 的其他属性
	const [session, setSession] = useState(_session);

	// 独立管理 messages
	const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

	// 其他状态
	const [hitBottom, setHitBottom] = useState(true);
	const [autoScroll, setAutoScroll] = useState(true);
	const [showPromptModal, setShowPromptModal] = useState(false);
	const [enableAutoFlow, setEnableAutoFlow] = useState(false);
	const [submitType, setSubmitType] = useState<
		"chat" | "workflow" | "multiagent"
	>("chat");

	// const messages = session.messages || [];
	const messages = store.getMessages(session.id) || [];
	console.log("chatcontext refresh", session);

	const currentSessionId = session.id;

	useEffect(() => {
		console.log("chatcontext, props changed");
		setSession(_session);
	}, [_session]);

	return (
		<ChatActionContext.Provider
			value={{
				setHitBottom,
				setAutoScroll,
				setShowPromptModal,
				setEnableAutoFlow,
				setSession,
				setSubmitType,
			}}
		>
			<ChatSettingContext.Provider
				value={{
					hitBottom,
					autoScroll,
					showPromptModal,
					enableAutoFlow,
					submitType,
					currentSessionId,
				}}
			>
				<ChatSessionContext.Provider value={session}>
					<ChatMessagesContext.Provider value={messages}>
						{children}
					</ChatMessagesContext.Provider>
				</ChatSessionContext.Provider>
			</ChatSettingContext.Provider>
		</ChatActionContext.Provider>
	);
};

export const useSessions = () => {
	const session = useContext(ChatSessionContext) as sessionConfig;
	return session;
};
export const useMessages = () => {
	const messages = useContext(ChatMessagesContext) as ChatMessage[];
	return messages;
};

export const useChatSetting = () => {
	const {
		hitBottom,
		autoScroll,
		showPromptModal,
		enableAutoFlow,
		submitType,
		currentSessionId,
	} = useContext(ChatSettingContext);

	return {
		hitBottom,
		autoScroll,
		showPromptModal,
		enableAutoFlow,
		submitType,
		currentSessionId,
	};
};

export const useChatActions = () => {
	const {
		setHitBottom,
		setAutoScroll,
		setShowPromptModal,
		setEnableAutoFlow,
		setSession,
		setSubmitType,
	} = useContext(ChatActionContext);

	return {
		setHitBottom,
		setAutoScroll,
		setShowPromptModal,
		setEnableAutoFlow,
		setSession,
		setSubmitType,
	};
};