import { ChatSession } from "./chat";
import { workflowChatSession } from "./workflow";
// create a type that called sessionconfig exclue messages from (workflowChatSession | ChatSession )
export type sessionConfig =
	| Omit<ChatSession, "messages">
	| Omit<workflowChatSession, "messages">;
