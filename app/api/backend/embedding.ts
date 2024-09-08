import request from "@/app/utils/request";

export interface filemedata {
	file: File | undefined;
	filename: string;
	username: string;
	knowledge_group: string;
	knowledge_category?: string;
}

//  get docs
export async function getDocs(params?: any) {
	return request({
		url: `/gpt/docs/`,
		method: "get",
		params,
	})
		.then((res) => res.data)
		.catch((err) => {
			// console.log(err);
			return err.response.data;
		});
}

export async function getEmbedding(data: any) {
	console.log("get embedding:", data);
	return request({
		url: `/gpt/embeddings/`,
		method: "post",
		data,
	})
		.then((res) => res.data)
		.catch((err) => {
			// console.log(err);
			return err.response.data;
		});
}

// get response
export async function getResponse(data: any) {
	console.log("get response============:", data);
	const result = request({
		url: "/gpt/context-search/",
		method: "POST",
		data: data,
	})
		.then((res) => {
			console.log("知识库反馈:", res.data);
			return res.data;
		})
		.catch((err) => {
			console.log("url:", err.config.url);
			console.log("错误信息:", err);
			return err.response.data;
		});

	return result;
}

// remove embeding
export async function removeEmbedding(data: any) {
	console.log("get response============:", data);

	return request({
		url: `/gpt/embeddings/`,
		method: "delete",
		data: data,
	})
		.then((res) => {
			console.log("remove embedding:", res.data);
			return res.data;
		})
		.catch((err) => {
			// console.log(err);
			return err.response.data;
		});
}