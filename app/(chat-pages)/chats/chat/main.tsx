"use client";
import React, {
	useState,
	useRef,
	useEffect,
	useMemo,
	useCallback,
	Fragment,
	memo,
	useContext,
} from "react";
import { useDebouncedCallback } from "use-debounce";
import dynamic from "next/dynamic";
import { ChatMessage, ChatSession } from "@/app/types/chat";

import {
	SubmitKey,
	useChatStore,
	BOT_HELLO,
	createMessage,
	useAccessStore,
	Theme,
	useAppConfig,
	DEFAULT_TOPIC,
	ModelType,
	useUserStore,
} from "@/app/store";
import { api } from "@/app/client/api";
import { ChatControllerPool } from "@/app/client/controller";
import { Prompt, usePromptStore } from "@/app/store/prompt";

import {
	CHAT_PAGE_SIZE,
	LAST_INPUT_KEY,
	MAX_RENDER_MSG_COUNT,
	Path,
	REQUEST_TIMEOUT_MS,
} from "@/app/constant";
import { prettyObject } from "@/app/utils/format";

import styles from "./chats.module.scss";

import { WindowHeader } from "./WindowHeader";

import { useNavigate } from "react-router-dom";
import { workflowChatSession } from "@/app/types/";
import { createContext } from "vm";
import { ChatProvider, useChatActions } from "./hooks/useChatContext";

const ChatbodyDynamic = dynamic(
	async () => (await import("./Chatbody")).Chatbody,
	{
		ssr: false,
	},
);
const InputpanelDynamic = dynamic(
	async () => (await import("./inputpanel/Inputpanel")).Inputpanel,
	{
		ssr: false,
	},
);
export type RenderPompt = Pick<Prompt, "title" | "content">;

interface ChatProps {
	_session: ChatSession | workflowChatSession | undefined;
	key?: number | string;
	index?: number;
	isworkflow: boolean;
	submitType: "chat" | "workflow" | undefined;
	storeType: string;
}

export const _Chat: React.FC<ChatProps> = memo((props) => {
	const { _session, index, isworkflow, submitType, storeType } = props;
	const chatStore = useChatStore.getState();
	const { setSession } = useChatActions();

	useEffect(() => {
		if (_session) {
			setSession(_session);
		}
	}, [_session, setSession]);

	if (!_session) return null;

	const sessionId = _session.id;

	const commonProps = useMemo(
		() => ({
			// _session,
			index,
			isworkflow,
		}),
		[_session, index, isworkflow],
	);

	return (
		<ChatProvider _session={_session} storeType={storeType}>
			<div
				className={`${styles.chat} ${isworkflow ? styles["workflow-chat"] : ""}`}
				key={sessionId}
				data-index={sessionId}
			>
				<WindowHeader {...commonProps} />
				<ChatbodyDynamic {...commonProps} />
				<InputpanelDynamic {...commonProps} submitType={submitType} />
			</div>
		</ChatProvider>
	);
});
export function useLoadData() {
	const config = useAppConfig();

	useEffect(() => {
		(async () => {
			const models = await api.llm.models();
			config.mergeModels(models);
		})();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);
}

export function Chat() {
	const chatStore = useChatStore.getState();
	const sessionIndex = chatStore.currentSessionIndex;
	const session = chatStore.currentSession();
	const navigate = useNavigate();

	useEffect(() => {}, [session]);
	if (!session) {
		navigate(Path.NewChat);
		return null;
	}
	return (
		<_Chat
			_session={session}
			key={`main-chat-${session.id}`}
			index={sessionIndex}
			isworkflow={false}
			submitType="chat"
			storeType="chatstore"
		></_Chat>
	);
}