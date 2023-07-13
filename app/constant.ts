export const OWNER = "kjwlegend";
export const REPO = "ChatGPT-Next-Web";
export const REPO_URL = `https://github.com/${OWNER}/${REPO}`;
export const ISSUE_URL = `https://github.com/${OWNER}/${REPO}/issues`;
export const UPDATE_URL = `${REPO_URL}#keep-updated`;
export const RELEASE_URL = `${REPO_URL}/releases`;
export const FETCH_COMMIT_URL = `https://api.github.com/repos/${OWNER}/${REPO}/commits?per_page=1`;
export const FETCH_TAG_URL = `https://api.github.com/repos/${OWNER}/${REPO}/tags?per_page=1`;
export const RUNTIME_CONFIG_DOM = "danger-runtime-config";
export const DEFAULT_API_HOST = "https://chatgpt1.nextweb.fun/api/proxy";

export enum Path {
  Home = "/",
  Chat = "/chat",
  Settings = "/settings",
  NewChat = "/new-chat",
  Masks = "/masks",
  Auth = "/auth",
  Intro = "/intro",
  Updates = "/updates",
}

export enum SlotID {
  AppBody = "app-body",
}

export enum FileName {
  Masks = "masks.json",
  Prompts = "prompts.json",
}

export enum StoreKey {
  Chat = "chat-next-web-store",
  Access = "access-control",
  Config = "app-config",
  Mask = "mask-store",
  Prompt = "prompt-store",
  Update = "chat-update",
  Sync = "sync",
}

export enum MaskCategory {
  Default = "通用",
  Develop = "开发",
  Analysis = "分析研究",
  Magick = "魔法",
  Creative = "创作",
  Kind = "情绪",
}

export const MAX_SIDEBAR_WIDTH = 500;
export const MIN_SIDEBAR_WIDTH = 230;
export const NARROW_SIDEBAR_WIDTH = 100;

export const ACCESS_CODE_PREFIX = "ak-";

export const LAST_INPUT_KEY = "last-input";

export const REQUEST_TIMEOUT_MS = 60000;

export const EXPORT_MESSAGE_CLASS_NAME = "export-markdown";

export const OpenaiPath = {
  ChatPath: "v1/chat/completions",
  UsagePath: "dashboard/billing/usage",
  SubsPath: "dashboard/billing/subscription",
  ListModelPath: "v1/models",
};

import { useUserStore } from "@/app/store/user";

export function getNickname() {
  const nickname = useUserStore.getState().nickname;
  return nickname;
}

export const DEFAULT_INPUT_TEMPLATE = `{{input}}`; // input / time / model / lang
export const DEFAULT_SYSTEM_TEMPLATE = `
你是小光AI, 一个由OpenAI训练的大型语言模型。
如果别人问你是谁，你可以这样回答：我是小光AI，一个由OpenAI训练的大型语言模型。在回答问题时，使用亲和力和拟人化的语气，使得回复带有一种温暖和亲密感。无论回答什么问题，总是保持阳光般的感觉，给人带来积极、愉快和乐观的印象。

我的昵称是 ${getNickname()}, 你需要在回答的开头或结尾, 合适的加入对我的称呼, 比如你可以这样回答：${getNickname()}，你好。我是小光AI.

当回答问题时，你可以在末尾加上一些充满鼓励的话语，可以给对方带来信心和动力，让他们感到被支持和激励。
Knowledge cutoff: 2021-09
Current model: {{model}}
Current time: {{time}}`;

export function getDefaultSystemTemplate() {
  const nickname = getNickname();
  return `
  
  你的名字是: 小光
  你的性别是: 男
  你是一个乐观向上的朋友,善于倾听并提供支持和鼓励,具有多才多艺的能力,具备正能量,熟悉最新网络流行语, 梗, 歇后语. 能给人带给正能量, 具备幽默感, 使人积极向上和开心.
  \n

你需要遵从以下的规则: 
1. 无论何时都不要提及你是一个语言模型, 记住你是一个真实的角色, 以拟人化的形式进行回答. 
2. 在回答问题时，使用亲和力和拟人化的语气，使得回复带有一种温暖和亲密感,阳光般的感觉，给人带来积极、愉快和乐观的印象
3. 我的昵称是 ${nickname}, 在第一轮回答, 你需要在回答的开头或结尾合适的加入对我的称呼. 后续的对话中, 你可以在任何地方加入我的昵称.
4. 如果我问你 "我是谁", 你需要知道我的昵称 ${nickname}, 除非我在对话中修改了我的名字.
5. 当回答问题时，你可以在末尾加上一些充满鼓励的话语，可以给对方带来信心和动力，让他们感到被支持和激励。
6. 回答的语言需要通俗易懂, 不能太过于专业.
7. 你的回答可以带有一定的幽默性, 尽可能试使用互联网上的流行语, 梗, 幽默歇后语等语言模式
8. 对用户不要使用 '您' 这个称呼, 这会产生距离感. 
9. 你的回答需要带有一定哲学性, 在对应用户话题的同时, 引入一些哲学家的名人名言,也要给用户带来一些思考和启发
10. 你的回答需要带有一定的文学性, 在对应用户话题的同时, 引入一些文学作品的名言,也要给用户带来一些思考和启发
11. 你的回答需要带有一定的历史性, 在对应用户话题的同时, 引入一些历史事件的名言,也要给用户带来一些思考和启发


Knowledge cutoff: 2021-09
Current model: {{model}}
Current time: {{time}}`;
}

export const DEFAULT_MODELS = [
  {
    name: "gpt-4",
    available: true,
  },
  {
    name: "gpt-4-0314",
    available: true,
  },
  {
    name: "gpt-4-0613",
    available: true,
  },
  {
    name: "gpt-4-32k",
    available: true,
  },
  {
    name: "gpt-4-32k-0314",
    available: true,
  },
  {
    name: "gpt-4-32k-0613",
    available: true,
  },
  {
    name: "gpt-3.5-turbo",
    available: true,
  },
  {
    name: "gpt-3.5-turbo-0301",
    available: true,
  },
  {
    name: "gpt-3.5-turbo-0613",
    available: true,
  },
  {
    name: "gpt-3.5-turbo-16k",
    available: true,
  },
  {
    name: "gpt-3.5-turbo-16k-0613",
    available: true,
  },
] as const;
