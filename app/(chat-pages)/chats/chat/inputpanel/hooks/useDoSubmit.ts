import { useState } from "react";
import { useRouter } from "next/router";
import { useAuthStore } from "@/app/store/auth";
import { message } from "antd";

import {
	SubmitKey,
	useChatStore,
	BOT_HELLO,
	createMessage,
	useAccessStore,
	Theme,
	useAppConfig,
	ModelType,
	useUserStore,
} from "@/app/store";
import useAuth from "@/app/hooks/useAuth";

import {
	CHAT_PAGE_SIZE,
	LAST_INPUT_KEY,
	MAX_RENDER_MSG_COUNT,
	Path,
	REQUEST_TIMEOUT_MS,
	UNFINISHED_INPUT,
	LAST_INPUT_IMAGE_KEY,
} from "@/app/constant";
import { FileInfo } from "@/app/client/platforms/utils";
import { useWorkflowStore } from "@/app/store/workflow";

export function useDoSubmit(
	session: any,
	attachImages: string[],
	attachFiles: FileInfo[],
) {
	const chatStore = useChatStore();
	const userStore = useUserStore();
	const workflowStore = useWorkflowStore()
	const authHook = useAuth();
	const [messageApi, contextHolder] = message.useMessage();
	const [isLoading, setIsLoading] = useState(false);

	const { updateUserInfo } = authHook;

	const doSubmit = async (userInput: string) => {
		if (userInput.trim() === "") return;

		setIsLoading(true);
		try {
			await workflowStore.onUserInput(
				userInput,
				attachImages,
				attachFiles,
				session,
			);
			updateUserInfo(userStore.user.id);
		} catch (error: any) {
			messageApi.error(error.message);
			if (error.message.includes("登录")) {
				setTimeout(() => {
					authHook.logoutHook();
				}, 2000);
			}
		} finally {
			setIsLoading(false);
		}

		localStorage.setItem(LAST_INPUT_KEY, userInput);
		return { isLoading };
	};

	return { doSubmit, isLoading, contextHolder };
}
