"use client";
import { useDebouncedCallback } from "use-debounce";
import React, {
	useState,
	useRef,
	useEffect,
	useMemo,
	useCallback,
	Fragment,
	useContext,
	use,
} from "react";

import { getISOLang, getLang } from "@/app/locales";
import Locale from "@/app/locales";

import {
	EditIcon,
	StopIcon,
	LoadingIcon,
	ResetIcon,
	DeleteIcon,
	PinIcon,
	CopyIcon,
	NextIcon,
	CheckmarkIcon,
	PlayIcon,
} from "@/app/icons"; // 假设的图标资源

import {
	useChatStore,
	BOT_HELLO,
	createMessage,
	useAccessStore,
	useAppConfig,
	DEFAULT_TOPIC,
	ModelType,
	useUserStore,
} from "@/app/store";

import { ChatContext } from "./main";

import { useMobileScreen } from "@/app/utils";

import { ChatMessage, ChatSession } from "@/app/types/chat";

import { message } from "antd";
import useAuth from "@/app/hooks/useAuth";
import { ChatData } from "@/app/api/backend/chat";
import { useRouter } from "next/navigation";
import { MJFloatButton } from "./midjourney";

import { MessageList } from "./chatbody/MessageList";
import { CHAT_PAGE_SIZE } from "@/app/constant";
import styles from "./chats.module.scss";
import { handleChatCallbacks } from "@/app/services/chatService";

type RenderMessage = ChatMessage & { preview?: boolean };

export function Chatbody(props: {
	_session?: ChatSession;
	index?: number;
	isworkflow?: boolean;
}) {
	const chatStore = useChatStore();
	const userStore = useUserStore();

	const authHook = useAuth();

	const { _session, index, isworkflow } = props;

	// if props._session is not provided, use current session
	const session = _session ?? chatStore.currentSession();

	const sessionId = session.id;

	const config = useAppConfig();
	const accessStore = useAccessStore();

	const fontSize = config.fontSize;

	const inputRef = useRef<HTMLTextAreaElement>(null);
	const isMobileScreen = useMobileScreen();

	const [messageApi, contextHolder] = message.useMessage();

	const {
		hitBottom,
		setHitBottom,
		showPromptModal,
		setShowPromptModal,
		userInput,
		setUserInput,
		enableAutoFlow,
		setEnableAutoFlow,
		scrollRef,
		userImage,
		setUserImage,
		setAutoScroll,
	} = useContext(ChatContext);

	const [messages, setMessages] = useState<RenderMessage[]>(session.messages);
	const [isLoading, setIsLoading] = useState(false);
	const [hasNextPage, setHasNextPage] = useState(true);
	const [currentPage, setCurrentPage] = useState(1);

	useEffect(() => {
		setMessages(session.messages);
	}, [session]);

	useEffect(() => {
		// 当 ChatBody 组件加载时获取第一页的消息
		getMessages(sessionId, currentPage);
	}, [sessionId]);
	// useEffect(() => {
	// 	console.log("Updated messages:", messages);
	// }, [messages]);

	const getMessages = async (sessionid: string, page: number) => {
		// setIsLoading(true);
		// if (!isAuthenticated) return;
		// try {
		// 	const param = {
		// 		chat_session: sessionid,
		// 		user: userStore.user.id,
		// 		page: page,
		// 		limit: 50,
		// 	};
		// 	const chatSessionList = await getChat(param);
		// 	if (chatSessionList.data.length == 0) {
		// 		setHasNextPage(false);
		// 	} else {
		// 		setMessages((prevMessages) => {
		// 			// 创建一个包含之前消息 ID 的集合
		// 			const existingIds = new Set(prevMessages.map((msg: any) => msg.id));
		// 			// 过滤掉已经存在的消息
		// 			const newMessages = chatSessionList.data.filter(
		// 				(msg: any) => !existingIds.has(msg.id),
		// 			);
		// 			// 返回新的消息数组，不包含重复的消息
		// 			return [...prevMessages, ...newMessages];
		// 		});
		// 		setHasNextPage(chatSessionList.is_next);
		// 		UpdateChatMessages(sessionId, chatSessionList.data);
		// 	}
		// } catch (error: any) {
		// 	// messageApi.error("Failed to load messages: " + error.toString());
		// } finally {
		// 	setIsLoading(false);
		// }
	};

	function setMsgRenderIndex(newIndex: number) {
		newIndex = Math.min(renderMessages.length - CHAT_PAGE_SIZE, newIndex);
		newIndex = Math.max(0, newIndex);
		_setMsgRenderIndex(newIndex);
	}

	const context: RenderMessage[] = useMemo(() => {
		return session.mask.hideContext ? [] : session.mask.context.slice();
	}, [session.mask.context, session.mask.hideContext]);

	if (
		context.length === 0 &&
		session.messages.at(0)?.content !== BOT_HELLO.content
	) {
		const copiedHello = Object.assign({}, BOT_HELLO);
		if (!accessStore.isAuthorized()) {
			copiedHello.content = Locale.Error.Unauthorized;
		}

		if (session.mask.intro) {
			copiedHello.content = session.mask.intro;
		}

		context.push(copiedHello);
	}

	const renderMessages = useMemo(() => {
		// 将 date 字段从字符串转换为 Date 对象
		const sortedMessages = [...session.messages].sort((a, b) => {
			const dateA = new Date(a.date);
			const dateB = new Date(b.date);
			return dateA.getTime() - dateB.getTime();
		});

		return context.concat(sortedMessages as RenderMessage[]).concat(
			isLoading
				? [
						{
							...createMessage({
								role: "assistant",
								content: "……",
								image_url: [],
							}),
							preview: true,
						},
					]
				: [],
		);
		// .concat(
		// 	userInput.length > 0 && config.sendPreviewBubble
		// 		? [
		// 				{
		// 					...createMessage({
		// 						role: "user",
		// 						content: userInput,
		// 						image_url: userImage?.fileUrl,
		// 					}),
		// 					preview: true,
		// 				},
		// 			]
		// 		: [],
		// );
	}, [
		config.sendPreviewBubble,
		context,
		isLoading,
		session.messages,
		session.lastUpdateTime,
		// userInput,
		userImage?.fileUrl,
	]);

	const [msgRenderIndex, _setMsgRenderIndex] = useState(
		Math.max(0, renderMessages.length - CHAT_PAGE_SIZE),
	);

	const messagesfinal = useMemo(() => {
		const endRenderIndex = Math.min(
			msgRenderIndex + 3 * CHAT_PAGE_SIZE,
			renderMessages.length,
		);
		return renderMessages.slice(msgRenderIndex, endRenderIndex);
	}, [msgRenderIndex, renderMessages]);

	const onChatBodyScroll = (e: HTMLElement) => {
		const { isTouchTopEdge, isTouchBottomEdge, isHitBottom } =
			checkScrollAndFetchMessages(e);

		// console.log("isTouchTopEdge", isTouchTopEdge);

		const prevPageMsgIndex = msgRenderIndex - CHAT_PAGE_SIZE;
		const nextPageMsgIndex = msgRenderIndex + CHAT_PAGE_SIZE;

		if (isTouchTopEdge && !isTouchBottomEdge) {
			// 如果触碰到顶部，可以加载前一页的消息（如果有的话）
			if (currentPage > 1) {
				// currentPage -= 1;
				setCurrentPage(currentPage - 1);
				getMessages(sessionId, currentPage);
			}
			setMsgRenderIndex(prevPageMsgIndex);
		} else if (isTouchBottomEdge && isHitBottom && hasNextPage) {
			// console.log(
			// 	"isTouchBottomEdge",
			// 	isTouchBottomEdge,
			// 	"hasNextPage",
			// 	hasNextPage,
			// );
			// 如果触碰到底部且还有下一页的消息，则加载下一页的消息
			setCurrentPage(currentPage + 1);
			// getMessages(sessionId, currentPage);
			setMsgRenderIndex(nextPageMsgIndex);
		}

		// // 更新是否触碰到底部的状态
		// setHitBottom(isHitBottom);
		// // 更新是否自动滚动到底部的状态
		setAutoScroll(isHitBottom);
	};
	const checkScrollAndFetchMessages = (e: HTMLElement) => {
		const bottomHeight = e.scrollTop + e.clientHeight;
		const edgeThreshold = e.clientHeight;

		const isTouchTopEdge = e.scrollTop <= edgeThreshold;
		const isTouchBottomEdge = bottomHeight >= e.scrollHeight - edgeThreshold;
		const isHitBottom =
			bottomHeight >= e.scrollHeight - (isMobileScreen ? 5 : 10);

		return { isTouchTopEdge, isTouchBottomEdge, isHitBottom };
	};

	//  get all messages from chatstore
	return (
		<div
			className={styles["chat-body"]}
			ref={scrollRef}
			onScroll={(e) => onChatBodyScroll(e.currentTarget)}
			onMouseDown={() => inputRef.current?.blur()}
			onTouchStart={() => {
				inputRef.current?.blur();
				setAutoScroll(false);
			}}
		>
			<MessageList
				session={session}
				messages={messagesfinal}
				isLoading={isLoading}
				hasNextPage={hasNextPage}
			/>
		</div>
	);
}
