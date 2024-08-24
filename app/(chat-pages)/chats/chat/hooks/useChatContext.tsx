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
};

export const ChatSettingContext = React.createContext(defaultChatContextValue);

export const ChatProvider = ({
	_session,
	children,
}: {
	_session: ChatSession;
	children: React.ReactNode;
}) => {
	const [hitBottom, setHitBottom] = useState(true);
	const [autoScroll, setAutoScroll] = useState(true);
	const [showPromptModal, setShowPromptModal] = useState(false);
	const [enableAutoFlow, setEnableAutoFlow] = useState(false);
	const [session, setSession] = useState<ChatSession>(_session);
	console.log("provider debug", session);
	const [submitType, setSubmitType] = useState<
		"chat" | "workflow" | "multiagent"
	>("chat");

	const messages = useChatStore(
		(state) =>
			state.sessions.find((item) => item.id == session.id)?.messages ?? [],
	);

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
	const session = useContext(ChatSessionContext) as ChatSession;
	return session;
};
export const useMessages = () => {
	const messages = useContext(ChatMessagesContext) as ChatMessage[];
	console.log("hook message", messages);
	return messages;
};

export const useChatSetting = () => {
	const { hitBottom, autoScroll, showPromptModal, enableAutoFlow, submitType } =
		useContext(ChatSettingContext);

	return {
		hitBottom,
		autoScroll,
		showPromptModal,
		enableAutoFlow,
		submitType,
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
