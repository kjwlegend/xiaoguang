import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../auth";
import AliOSS from "@/app/utils/alioss";
import { oss_base } from "@/app/constant";

async function handle(req: NextRequest) {
	if (req.method === "OPTIONS") {
		return NextResponse.json({ body: "OK" }, { status: 200 });
	}

	const authResult = await auth(req);
	if (authResult.error) {
		return NextResponse.json(authResult, {
			status: 401,
		});
	}
	try {
		const formData = await req.formData();
		const file = formData.get("file") as File; // 处理任意类型的文件
		const folderName = formData.get("folderName") as string | undefined;
		console.log(formData);
		const fileReader = file.stream().getReader();
		const fileData: number[] = [];

		while (true) {
			const { done, value } = await fileReader.read();
			if (done) break;
			fileData.push(...value);
		}

		const buffer = Buffer.from(fileData);
		const fileName = `${Date.now()}_${file.name}`; // 使用原文件名

		console.log("fileName: ", fileName);
		await AliOSS.put(fileName, buffer, folderName); // 上传文件

		return NextResponse.json(
			{
				originalFilename: file.name,
				size: file.size,
				fileName: `${folderName}/${fileName}`,
				filePath: `${oss_base}/${folderName}/${fileName}`,
				status: "done",
			},
			{
				status: 200,
			},
		);
	} catch (e) {
		return NextResponse.json(
			{
				error: true,
				msg: (e as Error).message,
			},
			{
				status: 500,
			},
		);
	}
}

export const POST = handle;

export const runtime = "nodejs";
