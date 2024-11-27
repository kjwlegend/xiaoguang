import { useState } from "react";
import { useResizeObserver } from "@/app/hooks/useResizeObserver";

export function useChatDimensions(ref: React.RefObject<HTMLElement>) {
	const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

	useResizeObserver(ref, (entry: ResizeObserverEntry) => {
		const { width, height } = entry.contentRect;
		setDimensions({ width, height });
	});

	return dimensions;
}
