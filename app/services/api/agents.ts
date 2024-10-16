import { AppMapping, api, apiGet } from "./api";
import { ChatMessage, MJMessage, MjConfig, Mask } from "@/app/types/index";

const appnamespace = AppMapping.llm;
export const getPromptHotness = apiGet(appnamespace, "/prompt-hotness/");
export const getAgents = apiGet(appnamespace, "/agents/");
export const getTags = apiGet(appnamespace, "/tags/");