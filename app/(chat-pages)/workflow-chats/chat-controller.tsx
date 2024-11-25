import { useDebouncedCallback } from "use-debounce";
import React, {
	useState,
	useRef,
	useEffect,
	useMemo,
	useCallback,
	Fragment,
} from "react";

import { getISOLang, getLang } from "../../locales";
import { ChatMessage, ChatSession, Mask } from "@/app/types/";

import { SubmitKey, useAccessStore, Theme, useAppConfig } from "../../store";

import { useChatStore } from "@/app/store/chat/index";

import Locale from "../../locales";

import { IconButton } from "../../components/button";
import styles from "@/app/workflow-chats/workflow-chats.module.scss";

export function useSubmitHandler() {
	const config = useAppConfig();
	const submitKey = config.submitKey;
	const isComposing = useRef(false);

	useEffect(() => {
		const onCompositionStart = () => {
			isComposing.current = true;
		};
		const onCompositionEnd = () => {
			isComposing.current = false;
		};

		window.addEventListener("compositionstart", onCompositionStart);
		window.addEventListener("compositionend", onCompositionEnd);

		return () => {
			window.removeEventListener("compositionstart", onCompositionStart);
			window.removeEventListener("compositionend", onCompositionEnd);
		};
	}, []);

	const shouldSubmit = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (e.key !== "Enter") return false;
		if (e.key === "Enter" && (e.nativeEvent.isComposing || isComposing.current))
			return false;
		return (
			(config.submitKey === SubmitKey.AltEnter && e.altKey) ||
			(config.submitKey === SubmitKey.CtrlEnter && e.ctrlKey) ||
			(config.submitKey === SubmitKey.ShiftEnter && e.shiftKey) ||
			(config.submitKey === SubmitKey.MetaEnter && e.metaKey) ||
			(config.submitKey === SubmitKey.Enter &&
				!e.altKey &&
				!e.ctrlKey &&
				!e.shiftKey &&
				!e.metaKey)
		);
	};

	return {
		submitKey,
		shouldSubmit,
	};
}

export function ClearContextDivider(props: { sessionId: string }) {
	const chatStore = useChatStore();
	const sessionId = props.sessionId;

	return (
		<div
			className={styles["clear-context"]}
			onClick={() =>
				chatStore.updateSession(
					sessionId,
					(session) => (session.clearContextIndex = undefined),
				)
			}
		>
			<div className={styles["clear-context-tips"]}>{Locale.Context.Clear}</div>
			<div className={styles["clear-context-revert-btn"]}>
				{Locale.Context.Revert}
			</div>
		</div>
	);
}
