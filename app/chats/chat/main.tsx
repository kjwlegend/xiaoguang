"use client";
import React, {
	useState,
	useRef,
	useEffect,
	useMemo,
	useCallback,
	Fragment,
} from "react";
import { useDebouncedCallback } from "use-debounce";
import dynamic from "next/dynamic";

import {
	ChatMessage,
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
import { useMaskStore } from "@/app/store/mask";
import { useChatCommand, useCommand } from "@/app/command";
import { getClientConfig } from "@/app/config/client";
import useAuth from "@/app/hooks/useAuth";
import { getISOLang, getLang } from "@/app/locales";
import {
	copyToClipboard,
	selectOrCopy,
	autoGrowTextArea,
	useMobileScreen,
} from "@/app/utils";
import {
	CHAT_PAGE_SIZE,
	LAST_INPUT_KEY,
	MAX_RENDER_MSG_COUNT,
	Path,
	REQUEST_TIMEOUT_MS,
} from "@/app/constant";
import { prettyObject } from "@/app/utils/format";

import BrainIcon from "@/app/icons/brain.svg";
import LoadingIcon from "@/app/icons/three-dots.svg";

import styles from "./chats.module.scss";

import { ChatActions, ChatAction, Inputpanel } from "./Inputpanel";

import WindowHeaer from "./WindowHeader";
import { Chatbody } from "./Chatbody";
import Upload from "@/app/components/upload";
import { ChatSession } from "@/app/store";

interface ChatContextType {
	hitBottom: boolean;
	setHitBottom: React.Dispatch<React.SetStateAction<boolean>>;
	showPromptModal: boolean;
	setShowPromptModal: React.Dispatch<React.SetStateAction<boolean>>;
	autoScroll: boolean;
	setAutoScroll: React.Dispatch<React.SetStateAction<boolean>>;
	userInput: string;
	setUserInput: React.Dispatch<React.SetStateAction<string>>;
	scrollRef: React.RefObject<HTMLDivElement>;
	enableAutoFlow: boolean;
	setEnableAutoFlow: React.Dispatch<React.SetStateAction<boolean>>;
	userImage: any;
	setUserImage: React.Dispatch<React.SetStateAction<any>>;
}

// 创建 ChatContext 上下文对象
export const ChatContext = React.createContext<ChatContextType>({
	hitBottom: true,
	setHitBottom: () => void 0,
	showPromptModal: false,
	setShowPromptModal: () => void 0,
	autoScroll: true,
	setAutoScroll: () => void 0,
	userInput: "",
	setUserInput: () => void 0,
	scrollRef: React.createRef<HTMLDivElement>(),
	enableAutoFlow: false,
	setEnableAutoFlow: () => void 0,
	userImage: "",
	setUserImage: () => void 0,
});

export type RenderPompt = Pick<Prompt, "title" | "content">;

export function _Chat(props: {
	_session?: ChatSession;
	index?: number | 0;
	isworkflow: boolean;
}) {
	const chatStore = useChatStore();

	const { _session, index } = props;

	// if props._session is not provided, use current session

	let session;
	if (_session) {
		session = _session;
	} else {
		session = chatStore.currentSession();
	}

	const sessionId = session.id;

	const [hitBottom, setHitBottom] = useState(true);
	const [showPromptModal, setShowPromptModal] = useState(false);
	const [userInput, setUserInput] = useState("");
	const [autoScroll, setAutoScroll] = useState(true);
	const [enableAutoFlow, setEnableAutoFlow] = useState(false);
	const [userImage, setUserImage] = useState<any>();

	const scrollRef = useRef<HTMLDivElement>(null);

	const config = useAppConfig();

	const inputRef = useRef<HTMLTextAreaElement>(null);

	const isMobileScreen = useMobileScreen();

	useEffect(() => {
		chatStore.updateSession(sessionId, (session) => {
			const stopTiming = Date.now() - REQUEST_TIMEOUT_MS;
			session.messages.forEach((m) => {
				// check if should stop all stale messages
				if (m.isError || new Date(m.date).getTime() < stopTiming) {
					if (m.streaming) {
						m.streaming = false;
					}

					if (m.content.length === 0) {
						m.isError = true;
						m.content = prettyObject({
							error: true,
							message: "empty response",
						});
					}
				}
			});
			// auto sync mask config from global config
			if (session.mask.syncGlobalConfig) {
				console.log("[Mask] syncing from global, name = ", session.mask.name);
				session.mask.modelConfig = { ...config.modelConfig };
			}
		});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const clientConfig = useMemo(() => getClientConfig(), []);

	return (
		<div
			className={`${styles.chat} ${
				props.isworkflow ? styles["workflow-chat"] : ""
			}`}
			key={session.id}
		>
			<ChatContext.Provider
				value={{
					hitBottom,
					setHitBottom,
					autoScroll,
					setAutoScroll,
					showPromptModal,
					setShowPromptModal,
					userInput,
					setUserInput,
					scrollRef,
					enableAutoFlow,
					setEnableAutoFlow,
					userImage,
					setUserImage,
				}}
			>
				<WindowHeaer
					session={_session}
					index={index}
					isworkflow={props.isworkflow}
				/>
				<Chatbody
					_session={_session}
					index={index}
					isworkflow={props.isworkflow}
				/>
				<Inputpanel session={_session} index={index} />
			</ChatContext.Provider>
		</div>
	);
}

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
	const chatStore = useChatStore();
	const sessionIndex = chatStore.currentSessionIndex;
	return <_Chat key={sessionIndex} isworkflow={false}></_Chat>;
}
