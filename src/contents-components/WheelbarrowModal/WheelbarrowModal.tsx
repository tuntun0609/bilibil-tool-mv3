/* eslint-disable react/react-in-jsx-scope */
import { useState } from 'react';
import { Form, Input, message, Modal, ModalProps, Switch } from 'antd';

import { API, getMessageConfig, log, Tool, TOOL_ID } from '~utils';

interface WheelbarrowModalProps extends ModalProps {
	roomid: number
}

export const WheelbarrowModal = (props: WheelbarrowModalProps) => {
	const { roomid } = props;
	const [messageApi, contextHolder] = message.useMessage(getMessageConfig(`#${TOOL_ID}`));
	const [id, setId] = useState(0);
	const [isTaskRun, setIsTaskRun] = useState(false);
	const [msg, setMsg] = useState<string>();
	const [sendTime, setSendTime] = useState<any>(6);
	const startSend = () => {
		if (!Tool.isStrNumber(sendTime)) {
			messageApi.error('时间间隔只能为数字');
			return;
		}
		if (isTaskRun) {
			messageApi.warning('正在开独轮车');
			return;
		}
		const eventId = setInterval(async () => {
			try {
				const data = await (await API.sendDanmu({
					msg: msg,
					roomid: roomid,
					csrf: Tool.getCookie('bili_jct'),
				})).json();
				if (data.code === 10031) {
					messageApi.error('发送弹幕过快, 请调低发送频率');
				} else if (data.msg === 'f') {
					messageApi.error('发送弹幕失败, 请重新编辑内容');
				}
			} catch (error) {
				messageApi.error('发送弹幕失败');
			}
		}, parseInt(sendTime, 10) * 1000);
		setId(eventId as unknown as number);
		setIsTaskRun(true);
		log('开始独轮车');
		messageApi.success('开始独轮车');
	};
	const stopSend = () => {
		clearInterval(id);
		setIsTaskRun(false);
		log('结束独轮车');
		messageApi.success('结束独轮车');
	};
	const onTaskSwitchChange = (checked: boolean) => {
		if (checked && msg) {
			startSend();
		} else if (!msg || !sendTime) {
			messageApi.error('发送内容或间隔不能为空');
		} else {
			stopSend();
		}
	};
	return (
		<>
			{contextHolder}
			<Modal
				bodyStyle={{
					width: '100%',
				}}
				{...props}
			>
				<Form
					initialValues={{
						time: sendTime,
					}}
				>
					<Form.Item
						label={'发送信息'}
						name={'msg'}
						rules={[{ required: true, message: '必须输入发送信息' }]}
					>
						<Input
							maxLength={20}
							showCount
							onChange={(e) => {
								setMsg(e.target.value);
							}}
						/>
					</Form.Item>
					<Form.Item
						label={'发送间隔(单位: 秒)'}
						name={'time'}
						rules={[
							{
								required: true,
								message: '必须输入发送间隔',
							},
							{
								validator: (_rule, value) => {
									if (Tool.isStrNumber(value)) {
										return Promise.resolve();
									}
									return Promise.reject(new Error('必须输入数字'));
								},
							},
						]}
					>
						<Input
							onChange={(e) => {
								setSendTime(e.target.value);
							}}
						/>
					</Form.Item>
				</Form>
				<Switch
					checked={isTaskRun}
					checkedChildren={'开启'}
					unCheckedChildren={'关闭'}
					onChange={onTaskSwitchChange}
				/>
			</Modal>
		</>
	);
};
