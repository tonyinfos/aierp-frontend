import React, { useState, useEffect } from 'react';
// 匯入 App (為了 message Hook)
import { App, Form, Button, Spin, Typography } from 'antd'; // 保留 App
import apiClient from '../api/apiClient';
import DynamicForm from '../components/DynamicForm';
import type { FormField } from '../components/FormMapper'; // 使用 type-only import

const { Title } = Typography;
const FORM_TEMPLATE_NAME = "leave_application";

// 定義提交給後端的資料格式
interface LeaveApplicationPayload {
    employee_name: string;
    department: string;
    leave_date: string; // 後端接收字串
}

const LeaveApplicationPage: React.FC = () => {
  const { message: messageApi } = App.useApp();
  const [form] = Form.useForm();
  const [formSchema, setFormSchema] = useState<FormField[]>([]);
  const [loadingSchema, setLoadingSchema] = useState(true);
  // (新！) 加入提交按鈕的載入狀態
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchFormSchema = async () => {
      setLoadingSchema(true);
      try {
        const response = await apiClient.get<{ schema: FormField[] }>(`/form-templates/${FORM_TEMPLATE_NAME}`);
        // (修正！) Pydantic V2 可能會把 schema_ 轉回 schema，直接讀 schema
        // 如果後端 schema Pydantic 模型用 schema_ 且沒用 alias_generator, 這裡要用 response.data.schema_
        setFormSchema(response.data.schema); // 嘗試讀取 schema 或 schema_
      } catch (error) {
        console.error("獲取表單結構失敗:", error);
        messageApi.error(`無法載入表單 "${FORM_TEMPLATE_NAME}" 的結構`);
      } finally {
        setLoadingSchema(false);
      }
    };
    fetchFormSchema();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // (暫時忽略 eslint 檢查)

  // (關鍵修改！) 升級 onFinish 函式
  const onFinish = async (values: Record<string, unknown>) => {
    setSubmitting(true); // 1. 按鈕開始轉圈

    let formattedValues: LeaveApplicationPayload;
    try {
        const leaveDateValue = values.leave_date;
        // 檢查日期格式並轉換
        if (leaveDateValue && typeof (leaveDateValue as { format?: (f?: string) => string }).format === 'function') {
            formattedValues = {
                ...values,
                leave_date: (leaveDateValue as { format: (f: string) => string }).format('YYYY-MM-DD'),
            } as unknown as LeaveApplicationPayload;
        } else {
            if (!leaveDateValue) {
                messageApi.error('請選擇請假日期');
                setSubmitting(false);
                return;
            }
            // 如果不是 dayjs 物件，嘗試直接轉換或讓後端處理
            formattedValues = {
               ...values,
               leave_date: String(leaveDateValue) // 嘗試轉換為字串
            } as unknown as LeaveApplicationPayload;
            // 或 formattedValues = values as unknown as LeaveApplicationPayload;
        }
    } catch (formatError) {
         console.error("日期格式化錯誤:", formatError);
         messageApi.error('日期格式錯誤');
         setSubmitting(false);
         return;
    }


    console.log('準備提交給後端的資料:', formattedValues);

    // 3. (關鍵！) 呼叫後端 API 儲存資料
    try {
      await apiClient.post('/leave-applications', formattedValues); // <-- 呼叫 API
      messageApi.success('請假申請已成功提交並儲存！'); // <-- 真實的成功訊息
      form.resetFields(); // 清空表單
    } catch (error) {
      console.error('提交請假申請失敗:', error);
      messageApi.error('提交失敗，請稍後再試');
    } finally {
      setSubmitting(false); // 4. 按鈕停止轉圈
    }
  };

  // (載入 Schema 畫面保持不變)
  if (loadingSchema) {
    return <Spin />;
  }

  // (渲染 DynamicForm 保持不變)
  return (
    <div>
      <Title level={2}>請假申請單 (動態表單範例)</Title>
      <DynamicForm
        form={form}
        formSchema={formSchema}
        onFinish={onFinish}
      />
      {/* (修改！) 將按鈕的 loading 狀態綁定到 submitting */}
      <Button
        type="primary"
        onClick={() => form.submit()}
        style={{ marginTop: 16 }}
        loading={submitting} // <--- 加入 loading 狀態
      >
        送出申請
      </Button>
    </div>
  );
};

// (匯出包裝過的元件保持不變)
const WrappedLeaveApplicationPage: React.FC = () => (
  <App>
    <LeaveApplicationPage />
  </App>
);
export default WrappedLeaveApplicationPage;