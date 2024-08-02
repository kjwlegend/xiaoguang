import { BuildConfig, getBuildConfig } from "./build";

export function getClientConfig() {
	if (typeof document !== "undefined") {
		// client side
		const clientConfig = queryMeta("config");
		console.log("clientConfig", clientConfig);
		return JSON.parse(clientConfig) as BuildConfig;
	}

	if (typeof process !== "undefined") {
		// server side
		return getBuildConfig();
	}
}

function queryMeta(key: string, defaultValue?: string): string {
	let ret: string;
	if (document) {
		const meta = document.head.querySelector(
			`meta[name='${key}']`,
		) as HTMLMetaElement;
		ret = meta?.content ?? "";
	} else {
		ret = defaultValue ?? "";
	}

	return ret;
}
