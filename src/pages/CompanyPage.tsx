import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, message, Spin, Typography } from 'antd';
import apiClient from '../api/apiClient'; // 匯入我們的 API 管理員

const { Title } = Typography;

// (新！) 1. 定義「公司」的資料型別 (需要和後端 schemas.py 一致)
interface Company {
  id: number;
  name: string;
}

const CompanyPage: React.FC = () => {
  // 2. 建立 state 來存放公司列表、載入狀態、彈窗可見性、表單實例
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm(); // Antd 表單 hook

  // 3. (關鍵) 使用 useEffect 在頁面載入時，獲取公司列表
  useEffect(() => {
    fetchCompanies();
  }, []);

  // 4. 獲取公司列表的函式
  const fetchCompanies = async () => {
    setLoading(true);
    try {
      // (使用 apiClient，它會自動帶 Token)
      const response = await apiClient.get<Company[]>('/companies'); 
      setCompanies(response.data);
    } catch (error) {
      console.error("獲取公司列表失敗:", error);
      message.error('無法載入公司列表');
    } finally {
      setLoading(false);
    }
  };

  // 5. 控制「新增公司」彈窗的函式
  const showModal = () => {
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields(); // 關閉時清空表單
  };

  // 6. (關鍵) 處理「新增公司」表單提交的函式
  const handleCreateCompany = async (values: { name: string }) => {
    try {
      // (使用 apiClient 呼叫 POST API)
      const response = await apiClient.post<Company>('/companies', values);

      // 新增成功後：
      message.success(`公司 "${response.data.name}" 新增成功！`);
      setIsModalVisible(false); // 關閉彈窗
      form.resetFields(); // 清空表單
      fetchCompanies(); // (重要！) 重新載入列表，顯示新公司

    } catch (error) {
      console.error("新增公司失敗:", error);
      message.error('新增公司失敗');
    }
  };

  // 7. 定義表格的欄位
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: '公司名稱',
      dataIndex: 'name',
      key: 'name',
    },
    // (未來可以加「編輯」、「刪除」按鈕)
  ];

  return (
    <div>
      <Title level={2}>公司管理</Title>

      <Button type="primary" onClick={showModal} style={{ marginBottom: 16 }}>
        新增公司
      </Button>

      {/* 8. 公司列表表格 */}
      <Spin spinning={loading}>
        <Table dataSource={companies} columns={columns} rowKey="id" />
      </Spin>

      {/* 9. 新增公司的 Modal (彈窗) */}
      <Modal
        title="新增公司"
        visible={isModalVisible} // antd v4 使用 visible, v5 改用 open
        // open={isModalVisible} // 如果您 antd 是 v5
        onCancel={handleCancel}
        footer={null} // 我們自己做提交按鈕
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateCompany}
        >
          <Form.Item
            name="name"
            label="公司名稱"
            rules={[{ required: true, message: '請輸入公司名稱' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              建立
            </Button>
            <Button style={{ marginLeft: 8 }} onClick={handleCancel}>
              取消
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CompanyPage;