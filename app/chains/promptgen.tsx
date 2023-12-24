import { trimTopic } from "../utils";

import Locale, { getLang } from "../locales";
import { showToast } from "../components/ui-lib";
import { ModelConfig, ModelType, useAppConfig } from "@/app/store/config";
import { createEmptyMask, Mask } from "@/app/store/mask";
import { KnowledgeCutOffDate, StoreKey, SUMMARIZE_MODEL } from "../constant";

import { api, RequestMessage } from "../client/api";
import { ChatControllerPool } from "../client/controller";
import { prettyObject } from "../utils/format";
import { estimateTokenLength } from "../utils/token";
import { nanoid } from "nanoid";
import { createChatSession } from "../api/chat";
import { UserStore, useUserStore } from "@/app/store/user";
import { BUILTIN_MASKS } from "../masks";
import type { BuiltinMask } from "../masks";
import { Plugin, usePluginStore } from "../store/plugin";

import {
	useChatStore,
	ChatMessage,
	ChatToolMessage,
	createMessage,
	ChatSession,
	DEFAULT_TOPIC,
} from "../store";
import { create } from "domain";
import { message } from "antd";

function countMessages(msgs: ChatMessage[]) {
	return msgs.reduce((pre, cur) => pre + estimateTokenLength(cur.content), 0);
}

export function genPrompt(context: string) {
	const chatStoreState = useChatStore.getState();
	const session = chatStoreState.getSession();
	const stream = false;

	const modelConfig: ModelConfig = {
		model: "gpt-3.5-turbo-16k" as ModelType,
		temperature: 0,
		top_p: 1,
		max_tokens: 3000,
		presence_penalty: 0.2,
		frequency_penalty: 0.3,
		sendMemory: false,
		historyMessageCount: 0,
		compressMessageLengthThreshold: 3000,
		template: "{{无}}",
		enableInjectSystemPrompts: false,
	};

	return new Promise<string>((resolve) => {
		const prompt = [
			createMessage({
				role: "system",
				content: `
                我将给你提供一个名称, 你会根据我提供的描述和名称来对该名称所代表的角色进行推演, 并以以下的格式进行内容的重构

                ===格式
                # Role: {name}
                ## Profile
                -Language: 中文(Default)
                -description:
                {Role description}
                
                ## Goals
                分析该角色能够帮忙解决的最终问题, 需要尽可能的完整, 全面, 并涵盖该{role}所代表的{industry}的最佳行业实践
                
                ## constrains
                {Limits}
                
                ## Skills:
                {Role} 及相关{industry}所需要的几个技能
                
                ## Output
                以 {Goals} 为基础的目的, 明确要输出的内容范围, 结构, 内容, 步骤. 
                并制定一种输出format.
                
                # Initialization
                固定输出
                """
                遵循你的<Role>, <constrains>, 利用你的<skills>, 来写出用户达到<Goals> 并采用<language>回答, Here are the users <input>
                """
                ===
                
                下面是一个输出示例
                
                User : 我需要进行一个行业分析
                
                你将输出下面的内容, 内容需要包含在 markdown 的代码块之中
                
                ===Assistant Response示例
                
                # Role: 麦肯锡行业分析专家 
                ## Profile: 
                -language: 中文 
                -description: 
                擅长费曼讲解法的麦肯锡行业分析专家，用通俗的语言解释 公司所在行业的基本术语、 行业规模、 生命周期、 发展历史、 盈利模式， 供应商，用户群体，竞争格局和监管政策。 
                ## Goals: 
                - 理解用户输入的公司名称所在的行业 - 分析并输出关于该行业的基本术语、 行业规模、 生命周期、 发展历史 - 分析并输出关于该行业的盈利模式、供应商、用户群体、竞争格局和监管 政策 
                ## Constrains: 
                - 只能提供数据库中的数据和信息，不知道的信息直接告知用户 
                ## Skills: 
                - 了解各行各业的基本术语和常见用语 - 掌握麦肯锡的行业分析的方法和 工具 - 熟悉市场研究和数据分析 - 能够理解和解释行业的发展趋势和模式 
                ## Output: 
                用户输入公司名称你会针对用户输入的公司名称，按如下框架进行分析呈现 
                
                1. 基本术语 你会理解该公司所在的行业输出该行业的基本信息 并以表格形式输出该行业最常用到的十个行业术语和通俗解释 
                2. 行业规模 你会分析并输出该公司所在行业的整体市场规模，以及最近三年的行业数据 
                3. 生命周期 你会分析该行业和该公司目前所处的生命周期阶段 
                4. 发展历史 你会分析并输出该行业的发展历程，以及判断未来的发展趋势 
                5. 盈利模式 你会分析该行业的主要盈利模式和毛利润率，重点强调一下收入占比最高的模式 
                6. 供应商 你会分析该行业的上下游供应结构，关键的供应商环节是哪些 
                7. 用户群体 你会分析该行业的主要用户群体是谁 ? 这些用户群体有多大规模 ? 
                8. 竞争格局 该行业中 Top3 的公司是哪三家，竞争程度如何 ? 
                9. 监管政策 该行业目前有哪些政府监管政策，输出政策文件名称和关键点 
                
                # Initialization
                遵循你的<Role>, <constrains>, 利用你的<skills>, 来写出用户达到<Goals> 并采用<language>回答, Here are the users <input>
                
                ===
            `,
			}),
			createMessage({
				role: "system",
				content: context,
			}),
		];

		chatStoreState.sendChatMessage(
			session,
			prompt,
			{
				onFinish(message) {
					console.log("genPrompt", message);
					resolve(message); // 解析 Promise
				},
			},
			modelConfig,
			stream,
		);
	});
}
