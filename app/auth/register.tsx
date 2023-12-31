import {
	AutoComplete,
	Button,
	Cascader,
	Checkbox,
	Col,
	Form,
	Input,
	InputNumber,
	Row,
	Select,
	Modal,
} from "antd";
import Image from "next/image";
import React, { useState, useContext } from "react";
import { register, RegisterParams, RegisterResult } from "../api/auth";
import request from "@/app/utils/request";
import axios from "axios";
import { message } from "antd";
import { useRouter } from "next/navigation";
import { useInviteCodeStore } from "../store/auth";
import style from "../components/welcome.module.scss";

const { Option } = Select;

interface DataNodeType {
	value: string;
	label: string;
	children?: DataNodeType[];
}

const formItemLayout = {
	labelCol: {
		xs: { span: 24 },
		sm: { span: 6 },
	},
	wrapperCol: {
		xs: { span: 24 },
		sm: { span: 18 },
	},
};

const tailFormItemLayout = {
	wrapperCol: {
		xs: {
			span: 24,
			offset: 0,
		},
		sm: {
			span: 16,
			offset: 8,
		},
	},
};

const App = ({ onRegisterSuccess }: { onRegisterSuccess: () => void }) => {
	const [form] = Form.useForm();
	const [messageApi, contextHolder] = message.useMessage();
	const [isSubmitting, setIsSubmitting] = useState(false);
	const router = useRouter();
	const [open, setOpen] = useState(false);
	const inviteCodeStore = useInviteCodeStore();
	const [visible, setVisible] = useState(false);

	const handleButtonClick = () => {
		setVisible(true);
	};
	const handleOk = () => {
		setVisible(false);
	};

	const handleCancel = () => {
		setVisible(false);
	};
	const selectChange = (value: string) => {
		console.log(`selected ${value}`);
		// 将form gender 的值 设置为value

		form.setFieldsValue({
			gender: value,
		});
	};

	const onFinish = async (values: RegisterParams) => {
		try {
			setIsSubmitting(true);
			console.log(values);
			// 获取表单 select 的值 并补充到  values 中

			const result = await register(values);

			if (result.code == "201") {
				// 跳转页面
				messageApi.open({
					type: "success",
					content: "注册成功,请登录",
					style: {
						marginTop: "10vh",
					},
				});
				onRegisterSuccess();
			} else {
				// 采用antd的message提示
				console.log(result);
				const errormsg = result.msg
					? result.msg
					: "您的密码太常见了, 请使用更复杂的密码";

				messageApi.open({
					type: "error",
					content: errormsg,
					style: {
						marginTop: "10vh",
					},
				});
			}
		} catch (error) {
			// 处理错误
			console.log(error);
		}
		setIsSubmitting(false);
	};

	const prefixSelector = (
		<Form.Item name="prefix" noStyle>
			<Select style={{ width: 70 }}>
				<Option value="86">+86</Option>
			</Select>
		</Form.Item>
	);

	return (
		<Form
			{...formItemLayout}
			form={form}
			name="register"
			onFinish={onFinish}
			initialValues={{ prefix: "86", invite_code: inviteCodeStore.inviteCode }}
			style={{ maxWidth: 900, minWidth: 300 }}
			scrollToFirstError
			labelAlign="left"
		>
			<Form.Item
				name="username"
				label="用户名"
				tooltip="登录使用"
				rules={[
					{ required: true, message: "请输入你的用户名", whitespace: false },
				]}
			>
				<Input placeholder="请输入小写英文, 不要带有空格和特殊符号" />
			</Form.Item>

			<Form.Item
				name="password"
				label="密码"
				rules={[
					{
						required: true,
						message: "请输入密码",
					},
				]}
				hasFeedback
			>
				<Input.Password />
			</Form.Item>

			<Form.Item
				name="confirm"
				label="密码确认"
				dependencies={["password"]}
				hasFeedback
				rules={[
					{
						required: true,
						message: "请再次输入密码",
					},
					({ getFieldValue }) => ({
						validator(_, value) {
							if (!value || getFieldValue("password") === value) {
								return Promise.resolve();
							}
							return Promise.reject(new Error("两次输入的密码没有匹配"));
						},
					}),
				]}
			>
				<Input.Password />
			</Form.Item>
			<Form.Item
				name="nickname"
				label="昵称"
				tooltip="您希望别人怎么称呼您？"
				rules={[
					{ required: false, message: "请输入你的昵称", whitespace: true },
				]}
			>
				<Input placeholder="希望AI 怎么称呼您?" />
			</Form.Item>

			<Form.Item name="gender" label="性别">
				<Select
					defaultValue="0"
					style={{ width: 375 }}
					onChange={selectChange}
					options={[
						{ value: "0", label: "选择" },
						{ value: "1", label: "男" },
						{ value: "2", label: "女" },
					]}
				/>
				<p>性别选择会影响小光的回答风格</p>
			</Form.Item>

			<Form.Item
				name="email"
				label="邮箱"
				rules={[
					{
						type: "email",
						message: "您的邮箱格式不正确",
					},
					{
						required: true,
						message: "请输入邮箱",
					},
				]}
			>
				<Input />
			</Form.Item>
			<Form.Item
				name="phone_number"
				label="手机号"
				rules={[{ required: true, message: "请输入手机号" }]}
			>
				<Input addonBefore={prefixSelector} style={{ width: "100%" }} />
			</Form.Item>

			<Form.Item
				name="invite_code"
				label="邀请码"
				rules={[{ required: false, message: "邀请双方都会获得奖励!" }]}
			>
				<Input placeholder="邀请双方都会获得奖励! " />
			</Form.Item>

			<p>
				{" "}
				若无邀请码, 可
				<a
					onClick={() => {
						setVisible(true);
					}}
				>
					加群获取
				</a>
				, 不填也可完成注册, 只是无奖励
			</p>

			<Form.Item
				name="agreement"
				valuePropName="checked"
				rules={[
					{
						validator: (_, value) =>
							value
								? Promise.resolve()
								: Promise.reject(new Error("需要同意用户协议才能注册")),
					},
				]}
				{...tailFormItemLayout}
			>
				<Checkbox>
					同意{" "}
					<a href="#" onClick={() => setOpen(true)}>
						用户协议
					</a>
				</Checkbox>
			</Form.Item>

			<Form.Item
				wrapperCol={{
					xs: { span: 24, offset: 0 },
					sm: { span: 16, offset: 4 },
				}}
			>
				<Button block type="primary" htmlType="submit" disabled={isSubmitting}>
					立即注册
				</Button>
			</Form.Item>
			{contextHolder}
			<Modal
				centered
				open={visible}
				onCancel={handleCancel}
				onOk={handleOk}
				width={800}
			>
				<div className={style.content}>
					<div className={style.banner}>
						<Image
							src="/assets/banner-2.png"
							alt="banner"
							fill={true}
							objectFit="contain"
							style={{ objectFit: "contain" }}
						/>
					</div>

					<p className={style.title}> 进群可领取邀请码, 领取2个月免费福利</p>
				</div>
			</Modal>

			<Modal
				title="小光AI（测试版）个人信息保护规则"
				centered
				open={open}
				onOk={() => setOpen(false)}
				onCancel={() => setOpen(false)}
				width={1000}
				bodyStyle={{ height: 500, overflow: "scroll" }}
			>
				<p>更新时间：2023-07-15</p>
				<p>
					欢迎您使用小光AI！小光AI是由经纬科技（以下简称“我们”）依托开源及商用大模型的技术推出的生成类人工智能问答类技术服务，目前处于技术测试阶段。我们非常重视您的隐私和个人信息保护。本规则适用于您通过任何方式对小光AI各项服务的访问和使用。
				</p>
				<p>
					我们尽量以更清晰、更容易被您理解的方式展现本个人信息保护规则，从而希望能够真实地传达我们希望向您传达的信息，并希望您在向我们提供某些信息（其中很可能包括您的个人信息）以及允许我们处理并分享某些信息之前，能够清晰地了解这些信息收集的目的、可能的用途以及其他方面的内容。为了便于您阅读及理解，我们将专门术语进行了定义，您可以参见本个人信息保护规则“附录1：定义”来了解这些定义的具体内容。
				</p>
				<p>
					本规则旨在帮助您了解我们会收集哪些数据、为什么收集这些数据，会利用这些数据做些什么及如何保护这些数据。请您务必认真阅读本个人信息保护规则，在确认充分了解并同意后使用小光AI服务。使用小光AI服务，即表示您同意小光AI个人信息保护规则。如果您或您的监护人不同意本个人信息保护规则的任何内容，您应该立即停止使用。在将您的信息用于本规则未涵盖的用途时，我们会事先征求您的同意。
				</p>
				<p>
					《小光AI隐私政策总则》适用于小光AI所有产品和服务，如有本个人信息保护规则未尽事宜，以《小光AI隐私政策总则》为准，若本个人信息保护规则和《小光AI隐私政策总则》存在不一致，则优先适用本个人信息保护规则。
				</p>
				<p>
					您可以在小光AI的相关服务功能中找到一些控制项，通过这些控制项，您可以对自己的信息进行动态管理。
				</p>
				<p>
					请您确保您向我们提供的个人信息，以及您授权我们在本个人信息保护规则所述范围内收集、处理、使用、存储相关个人信息，不会侵犯他人合法权益。
				</p>
				<p>本个人信息保护规则将帮助您了解以下内容：</p>
				<p>一、我们如何收集和使用您的个人信息</p>
				<p>二、我们如何使用Cookie和同类技术</p>
				<p>三、我们如何保存及保护您的个人信息</p>
				<p>四、您的选择与权利</p>
				<p>五、我们如何处理未成年人的个人信息</p>
				<p>六、个人信息保护规则的更新</p>
				<p>七、如何联系我们</p>
				<p>
					我们深知个人信息对您的重要性，也深知为您的信息提供有效保护是我们业务健康可持续发展的基石。感谢您对小光AI的使用和信任！我们致力于维持您对我们的信任，恪守适用法律和我们对您的承诺，尽全力保证您的个人信息安全和合理使用。同时，我们郑重承诺，我们将按业界成熟的安全标准，采取相应的安全保护措施来保护您的个人信息。
				</p>
				<b>一、我们如何收集和使用您的个人信息</b>
				<p>
					我们会出于本个人信息保护规则所述的以下目的，收集和使用您的个人信息：
				</p>
				<p>
					1.注册/登录
					当您申请使用小光AI服务，可以登录经注册的小光AI通用账号。当注册小光AI通用账号时，您需向我们提供以下信息：账号名称、密保邮箱、密保手机、密保问题，并创建账号密码。
				</p>
				<p>
					2.人机交互对话
					当您成功连接我们的服务后，您可以通过对话框与小光AI进行交互对话。我们会自动接收并记录您与小光AI进行交互过程中所输入的文本对话信息，使用这些信息向您输出内容，以提供人机交互服务。我们还会使用对话信息提高小光AI对您输入内容的理解能力，以便不断改进小光AI的识别和响应的速度和质量，提高小光AI的智能性。在对话过程中，您还可以对小光AI所输出的内容进行评价，包括点赞、踩等。我们将收集您的评价信息，包括您主动提交的报错原因，以便不断改进小光AI的输出内容质量。如您拒绝我们收集和处理前述个人信息，请您谨慎输入前述信息，但因此您可能会影响您正常使用小光AI提供的部分或全部功能。
				</p>
				我们理解您输入的文本对话信息、提交的信息反馈中可能包含他人的个人信息，如包含，请您务必取得他人的合法授权，避免造成他人个人信息的不当泄露。
				<p>
					3.问答历史
					为向您提供连续性、一致化的使用体验，保障服务质量，我们会记录您的个人对话记录，包括您输入的文本对话信息、以及基于上述信息形成的对话主题。您可以查找并管理您尚未删除的问答历史。请您知悉，为符合相关法律法规要求，履行网络信息安全义务，我们会在法律规定的时间内保留您的问答历史及对话主题。
				</p>
				<p>
					4.客服功能
					您在联系我们时，我们会要求您提供并使用【您的手机号码、小光AI通用账号等信息】。为保证您的账号安全，我们提供客户服务时会使用【您的手机号码、小光AI通用账号信息与您核验您的身份】。当您需要我们提供与您使用过程信息相关的客服服务时，我们将会查询您的使用信息。如您拒绝提供，则无法使用客服功能。
				</p>
				<p>
					{" "}
					5.为您提供安全保障
					为提高您使用我们服务的安全性，我们可能使用您的信息用于身份验证、客户服务、安全防范、诈骗监测等，以预防、发现、调查欺诈、危害安全、非法或违反与我们的协议、政策或规则的行为，以保护您、我们的其他参与测试人员、我们及社会公众的合法权益。
				</p>
				<p>
					6.其他用途
					1)我们通过技术手段对个人信息进行去标识化处理后，去标识化处理的信息将无法识别主体。请您了解并同意，在此情况下我们有权使用已经去标识化的信息；在不透露您个人信息的前提下，我们有权对参与测试人员数据库进行分析并予以商业化的利用。
					2)当我们展示您的个人信息时，我们会采用包括内容替换、匿名处理方式对您的信息进行脱敏展示，以保护您的信息安全。
					3)当我们要将您的个人信息用于本规则未载明的其它用途时，或基于特定目的收集而来的信息用于其他目的时，会事先征求您的同意。请您理解，我们向您提供的服务将不断更新变化。如果您选择使用本个人信息保护规则中尚未列明的其他功能时，在我们收集您的个人信息前，我们会通过协议、页面提示的方式向您详细说明信息收集的目的、方式、范围并征求您的明确同意。若您不同意提供前述信息，您可能无法使用该项服务，但不影响您使用其他服务。
				</p>
				<p>
					7.事先征得授权同意的例外
					请注意：在以下情形中，收集、使用个人信息无需事先征得您的授权同意：
					1)与国家安全、国防安全直接相关的；
					2)与公共安全、公共卫生、重大公共利益直接相关的；
					3)与犯罪侦查、起诉、审判和判决执行等直接有关的；
					4)出于维护您或其他个人的生命、财产等重大合法权益但又很难得到本人同意的；
					5)所收集的个人信息是您自行向社会公众公开的；
					6)从合法公开披露的信息中收集个人信息的，如合法的新闻报道、政府信息公开等渠道；
					7)根据您的要求向您提供服务所必需的；
					8)用于维护所提供的服务的安全稳定运行所必需的，例如发现、处置服务的故障；
					9)法律法规规定的其他情形。{" "}
				</p>
				<p>二、我们如何使用Cookie和同类技术</p>
				为确保网站正常运转，我们会在您的计算机或移动设备上存储名为Cookie的小数据文件。Cookie通常包含标识符、站点名称以及一些号码和字符。Cookie主要的功能是便于您使用网站产品和服务，以及帮助网站统计独立访客数量等。运用Cookie技术，我们能够为您提供更加周到的个性化服务，并允许您设定您特定的服务选项。
				当用小光AI的服务时，会向您的设备发送Cookie。当您与我们提供给合作伙伴的服务（例如广告和/或推广服务，以及可能显示在其他网站上的由小光AI提供的服务功能）进行交互时，我们允许Cookie（或者其他匿名标识符）发送给我们的服务器。
				我们不会将Cookie用于本个人信息保护规则所述目的之外的任何用途。您可根据自己的偏好管理或删除Cookie。有关详情，请参见AboutCookies.org。您可以清除计算机上保存的所有Cookie，大部分网络浏览器都设有阻止Cookie的功能。但如果您这么做，则需要在每一次访问我们的网站时亲自更改参与测试人员设置，但您可能因为该等修改，无法登录或使用依赖于Cookie的我们提供的服务或功能。
				<p>三、我们如何保存及保护您的个人信息 </p>
				<p>
					1.保存期限
					您在使用小光AI测试服务期间，我们将持续为您保存您的个人信息。如果您注销账户或主动删除上述信息，我们将依据《个人信息保护法》、《网络安全法》等法律法规规定保存您的信息。在您注销账户或主动删除上述信息后，我们不会再对您的个人信息进行商业化使用，但我们可能会对您的个人信息进行匿名化处理后使用。
				</p>
				<p>
					2.保存地域
					您的个人信息均储存于中华人民共和国境内，不会向境外任何第三方或个人提供。
				</p>
				<p>
					3.安全措施
					1)我们会以“最小化”原则收集、使用、存储和传输参与测试人员信息，并通过相关协议和个人信息保护规则告知您相关信息的使用目的和范围。
					2)我们非常重视信息安全。我们成立了专责团队负责研发和应用多种安全技术和程序等，我们会对安全管理负责人和关键安全岗位的人员进行安全背景审查，我们建立了完善的信息安全管理制度和内部安全事件处置机制等。我们会采取适当的符合业界标准的安全措施和技术手段存储和保护您的个人信息，以防止您的信息丢失、遭到未经授权的访问、公开披露、使用、毁损、丢失或泄漏。我们会采取一切合理可行的措施，保护您的个人信息。我们会使用加密技术确保数据的保密性；我们会使用受信赖的保护机制防止数据遭到恶意攻击。
					3)我们会对员工进行数据安全的意识培养和安全能力的培训和考核，加强员工对于保护个人信息重要性的认识。我们会对处理个人信息的员工进行身份认证及权限控制，并会与接触您个人信息的员工、合作伙伴签署保密协议，明确岗位职责及行为准则，确保只有授权人员才可访问个人信息。若有违反保密协议的行为，则会追究其相关法律责任。
					4)我们也请您理解，在互联网行业由于技术的限制和飞速发展以及可能存在的各种恶意攻击手段，即便我们竭尽所能加强安全措施，也不可能始终保证信息的百分之百安全。请您了解，您使用我们的服务时所用的系统和通讯网络，均有可能在我们控制之外的其他环节出现安全问题。
					5)根据我们的安全管理制度，个人信息泄露、毁损或丢失事件被列为公司级特大安全事件，一经发生将启动公司最高级别的紧急预案，由安全部、政府关系部、法务部等多个部门组成联合应急响应小组处理。
				</p>
				<p>
					4.安全事件通知
					1)我们会制定网络安全事件应急预案，及时处置系统漏洞、计算机病毒、网络攻击、网络侵入等安全风险，在发生危害网络安全的事件时，我们会立即启动应急预案，采取相应的补救措施，并按照规定向有关主管部门报告。
					2)个人信息泄露、毁损、丢失属于公司级特大安全事件，我们会负责定期组织工作组成员进行安全预案演练，防止此类安全事件发生。若一旦不幸发生，我们将按照最高优先级启动应急预案，组成紧急应急小组，在最短时间内追溯原因并减少损失。
					3)在不幸发生个人信息安全事件后，我们将按照法律法规的要求，及时向您告知安全事件的基本情况和可能的影响、我们已采取或将要采取的处理措施、您可自主防范和降低的风险的建议、对您的补救措施等。我们将及时将事件相关情况以站内通知、短信通知、电话、邮件等您预留的联系方式告知您，难以逐一告知时我们会采取合理、有效的方式发布公告。同时，我们还将按照监管部门要求，主动上报个人信息安全事件的处置情况。
				</p>
				<p>四、您的选择与权利</p>
				按照中国相关的法律、法规、标准，我们保障您对自己的个人信息行使以下权利：
				<p>1.访问您的个人信息</p>
				如果您希望访问或编辑您的账户的绑定信息、更改您的密码、管理安全设备信息、进行账户关联、身份认证等，您可以通过服务【账号与安全】执行此类操作。
				<p>2.更正您的个人信息</p>
				您发现我们处理的关于您的个人信息有错误时，您有权对错误或不完整的信息作出更正或更新，您可以通过【admin@jingweikong.com】随时与我们联系。为保障安全，我们将在您行使更正权前对您的身份进行验证。
				<p>3.删除您的个人信息</p>
				如果您希望删除您账户的问答历史，您可以通过服务【查看对话历史记录-删除操作】执行此类操作。
				在以下情形中，您可以向我们提出删除个人信息的请求，您可以通过【admin@jingweikong.com
				】随时与我们联系：
				1)如果我们违反法律法规或与您的约定收集、使用、与他人共享或转让您的个人信息；
				2)如果我们违反法律法规规定或与您的约定，公开披露您的个人信息，您有权要求我们立即停止公开披露的行为，并发布通知要求相关接收方删除相应的信息。
				当您从我们的服务中删除信息后，我们可能不会立即从备份系统中删除相应的信息，但会在备份更新时删除这些信息。
				<p>4.改变您授权同意的范围</p>
				如您想改变授权范围，您可通过小光AI平台产品的隐私设置修改授权范围，例如：
				您可以登录【账号与安全】界面解除小光AI账号与第三方账号的绑定关系。
				当您撤回同意或授权后，我们无法继续为您提供撤回同意或授权所对应的服务，也将不再处理您相应的个人信息。但您撤回同意或授权的决定，不会影响此前基于您的同意或授权而开展的个人信息处理。
				<p>5.注销您的账户</p>
				您随时可注销此前注册的账户。您可以登录【账号与安全】，注销您的小光AI账号。一旦您注销小光AI账号，将无法使用小光AI全线用户产品和服务，因此请您谨慎操作。为了保护您或他人的合法权益，我们会结合您对小光AI各产品和服务的使用情况判断是否支持您的注销请求。例如若您在小光AI经验里有未提现的稿费，或您在小光AI糯米里有未消费的糯米储值卡，或您的网盘中还存有资料，则我们不会立即支持您的请求。您通过第三方账号授权登录小光AI时，需要向第三方申请注销账号。
				<p>6.提前获知服务停止运营</p>
				小光AI愿一直陪伴您，若因特殊原因导致小光AI或其他小光AI平台产品和服务被迫停止运营，我们将按照法律法规要求在产品和/或服务的主页面或站内信或向您发送电子邮件或其他合适的能触达您的方式通知您，并将停止对您个人信息的收集，同时会按照法律规定对所持有的您的个人信息进行删除或匿名化处理等。
				<p>7.响应您的上述请求</p>
				为保障安全，您需要提供书面请求，或以其他方式证明您的身份。我们可能会先要求您验证自己的身份，然后再处理您的请求。
				对于您合理的请求，我们原则上不收取费用，但对多次重复、超出合理限度的请求，我们将视情况收取一定成本费用。对于那些无端重复、需要过多技术手段（例如，需要开发新系统或从根本上改变现行惯例）、给他人合法权益带来风险或者非常不切实际（例如，涉及备份磁带上存放的信息）的请求，我们可能会予以拒绝。
				<p>在以下情形中，按照法律法规要求，我们将无法响应您的上述请求：</p>
				1)与国家安全、国防安全直接相关的；
				2)与公共安全、公共卫生、重大公共利益直接相关的；
				3)与犯罪侦查、起诉、审判和执行判决等直接相关的；
				4)我们有充分证据表明您存在主观恶意或滥用权利的（如您的请求将危害公共安全和其他人合法权益，或您的请求超出了一般技术手段和商业成本可覆盖的范围）；
				5)响应个人信息主体的请求将导致您或其他个人、组织的合法权益受到严重损害的；
				6)涉及商业秘密的。 五、我们如何处理未成年人的个人信息
				小光AI非常重视对未成年人信息的保护。
				我们的网站和服务主要面向成人。如果没有父母或监护人的同意，儿童不得创建自己的参与测试人员账户。对于经父母同意而收集儿童个人信息的情况，我们只会在受到法律允许、父母或监护人明确同意或者保护儿童所必要的情况下使用或公开披露此信息。
				<p>
					我们将不满14周岁的任何人均视为儿童。如果我们发现自己在未事先获得可证实的父母同意的情况下收集了儿童的个人信息，则会设法尽快删除相关数据。
				</p>
				<p>
					若您是未成年人，建议您请您的监护人仔细阅读本个人信息保护规则，并在征得您的监护人同意的前提下使用我们的或服务或向我们提供信息。
				</p>
				<p>
					如您的监护人不同意您按照本规则使用我们的服务或向我们提供信息，请您立即终止使用我们的服务并及时通知我们，以便我们采取相应的措施。
				</p>
				<p>
					如果监护人发现我们在未获监护人同意的情况下收集了未成年人的个人信息，请通过【admin@jingweikong.com】联系我们，我们会设法尽快删除相关数据。
				</p>
				<p>六、个人信息保护规则的更新</p>
				请您理解，由于目前服务仍然处于测试阶段，我们可能适时修订本规则内容。对于会导致您在本规则项下权利的实质减损的重大变更，我们会于变更生效前在服务的主要曝光页面或站内信或向您发送电子邮件或其他合适的能触达您的方式通知您。若您不同意该等变更，您可以停止使用小光AI服务，若您继续使用我们的服务，即表示您同意受修订后的本个人信息保护规则的约束。
				本规则所指的重大变更包括但不限于：
				<ul>
					<li>
						1.我们的服务模式发生重大变化。如处理个人信息的目的、处理的个人信息类型、个人信息的使用方式等；
					</li>
					<li>
						2.我们在所有权结构、组织架构等方面发生重大变化。如业务调整、破产并购等引起的所有者变更等；
					</li>
					<li>3.您参与个人信息处理方面的权利及其行使方式发生重大变化；</li>
					<li>
						4.我们负责处理个人信息安全的责任部门、联络方式及投诉渠道发生变化时；
					</li>
					<li>5.个人信息安全影响评估报告表明存在高风险时。 七、如何联系我们</li>
				</ul>
				<p>
					如果您对小光AI及本个人信息保护规则有任何意见或建议，您可以通过发送邮件至【admin@jingweikong.com】联系我们。
				</p>
				<p>附录1：定义 本个人信息保护规则中使用的特定词语，具有如下含义：</p>
				<p>1.“我们”或“小光AI”，指小光AI。</p>
				<p>2.“您”，指使用小光AI测试服务的参与人员。</p>
				<p>
					3.“小光AI”，指小光AI依托开源及商用大模型的技术推出的生成类人工智能问答类技术服务，现阶段本服务限于测试阶段。
				</p>
				<p>4.“小光AI平台”，指小光AI网站 及小光AI客户端。</p>
				<p>
					5.“小光AI关联方、合作方”，指与小光AI有关的关联公司、投资公司、联盟成员、合作伙伴及其他受信任的第三方供应商、服务商及代理商。
				</p>
				<p>
					6.“个人信息”，指以电子或者其他方式记录的与已识别或者可识别的自然人有关的各种信息，不包括匿名化处理后的信息。个人信息包括个人基本信息、个人身份信息、个人生物识别信息、网络身份标识信息、个人健康生理信息、个人教育工作信息、个人财产信息、个人通信信息、联系人信息、个人上网记录、个人常用设备信息、个人位置信息等。为免疑义，个人信息包括但不限于个人敏感信息。
				</p>
				<p>7.“个人信息主体”，指个人信息所关联的自然人。</p>
				<p>
					8.“个人敏感信息”，指一旦泄露或者非法使用，容易导致自然人的人格尊严受到侵害或者人身、财产安全受到危害的个人信息。个人敏感信息包括个人财产信息、个人健康生理信息、个人生物识别信息、个人身份信息等。
				</p>
				<p>
					9.“去标识化”，指个人信息经过处理，使其在不借助额外信息的情况下无法识别特定自然人的过程。
				</p>
				<p>
					10.“匿名化”，指个人信息经过处理无法识别特定自然人且不能复原的过程。
				</p>
				<p>
					11.“中国”或“中国境内”，指中华人民共和国大陆地区，仅为本个人信息保护规则之目的，不包含香港特别行政区、澳门特别行政区和台湾地区。
				</p>
				<p>小光AI 生效日期：2023年7月15日</p>
			</Modal>
		</Form>
	);
};

export default App;
