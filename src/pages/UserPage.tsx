import React, { useState, useEffect } from 'react';
// 匯入 App (為了 message Hook)
import { Table, Button, Modal, Select, Spin, Typography, App } from 'antd';
import apiClient from '../api/apiClient'; // 匯入 API 管理員

const { Title } = Typography;
const { Option } = Select;

// 1. 定義「公司」和「使用者」的資料型別
interface Company {
  id: number;
  name: string;
}
interface User {
  id: number;
  username: string;
  company: Company | null; // 使用者可能還沒有公司
}

// UserPage 元件本身
const UserPage: React.FC = () => {
  // 使用 App Hook 取得 message 實例
  const { message } = App.useApp();

  // 2. 建立各種 state
  const [users, setUsers] = useState<User[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null);
  // (新！) 加入 Modal 載入狀態，防止重複提交
  const [modalLoading, setModalLoading] = useState(false); 

  // 3. 使用 useEffect 在載入時，同時獲取「使用者」和「公司」列表
  useEffect(() => {
    fetchUsersAndCompanies();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // (暫時忽略 eslint 檢查)

  // 4. 獲取資料的函式
  const fetchUsersAndCompanies = async () => {
    setLoading(true); // 表格載入中
    try {
      const [usersResponse, companiesResponse] = await Promise.all([
        apiClient.get<User[]>('/users'), // <-- 確認路徑正確
        apiClient.get<Company[]>('/companies') // <-- 確認路徑正確
      ]);
      setUsers(usersResponse.data);
      setCompanies(companiesResponse.data);
    } catch (error) {
      console.error("獲取資料失敗:", error);
      message.error('無法載入使用者或公司列表');
    } finally {
      setLoading(false); // 表格載入完成
    }
  };

  // 5. 控制「指派公司」彈窗的函式
  const showAssignModal = (user: User) => {
    setSelectedUser(user);
    setSelectedCompanyId(user.company?.id ?? null);
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    // (新！) 如果 modal 正在載入中，禁止關閉
    if (modalLoading) return; 
    setIsModalVisible(false);
    setSelectedUser(null);
    setSelectedCompanyId(null);
  };

  // 6. 處理「指派公司」提交的函式
  const handleAssignCompany = async () => {
    if (!selectedUser || selectedCompanyId === null) {
      message.warning('請選擇要指派的公司');
      return;
    }
    
    setModalLoading(true); // 開始載入 (按鈕會轉圈)
    try {
      // 呼叫 PUT API
      await apiClient.put(`/users/${selectedUser.id}/assign-company`, {
        company_id: selectedCompanyId
      });

      message.success(`已將使用者 "${selectedUser.username}" 指派到新公司`);
      handleCancel(); // 關閉彈窗 (成功後)
      fetchUsersAndCompanies(); // 重新載入列表

    } catch (error) {
      console.error("指派公司失敗:", error);
      message.error('指派公司失敗');
    } finally {
       setModalLoading(false); // 結束載入
       // (如果失敗，handleCancel 不會被呼叫，Modal 會保持開啟)
       // (handleCancel 內部會檢查 modalLoading，防止提早關閉)
       // (我們需要在 handleCancel 中也檢查 modalLoading 狀態) - 已修正 handleCancel
    }
  };

  // 7. 定義表格的欄位
  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 80 }, // 給 ID 一個固定寬度
    { title: '使用者名稱', dataIndex: 'username', key: 'username' },
    {
      title: '所屬公司',
      dataIndex: ['company', 'name'],
      key: 'company',
      render: (companyName: string | undefined) => companyName ?? '尚未指派',
    },
    {
      title: '操作',
      key: 'action',
      width: 120, // 給操作欄一個固定寬度
      render: (_: unknown, record: User) => (
        <Button type="link" onClick={() => showAssignModal(record)}>
          指派公司
        </Button>
      ),
    },
  ];

  return (
    <div>
      <Title level={2}>使用者管理</Title>

      {/* 8. 使用者列表表格 */}
      <Spin spinning={loading}>
        {/* (新！) 加入 scroll，讓表格在欄位過多時可以水平滾動 */}
        <Table dataSource={users} columns={columns} rowKey="id" scroll={{ x: 'max-content' }} />
      </Spin>

      {/* 9. 指派公司的 Modal (彈窗) */}
      {selectedUser && (
        <Modal
          title={`指派公司給 ${selectedUser.username}`}
          open={isModalVisible} // 使用 open (Antd v5)
          onCancel={handleCancel}
          onOk={handleAssignCompany}
          okText="確認指派"
          cancelText="取消"
          // (新！) 將 OK 按鈕的載入狀態綁定到 modalLoading
          confirmLoading={modalLoading} 
        >
          <p>請選擇要將使用者指派到的公司：</p>
          <Select
            style={{ width: '100%' }}
            placeholder="選擇公司"
            value={selectedCompanyId}
            onChange={(value) => setSelectedCompanyId(value)}
            // 如果公司列表還在載入，顯示載入中
            loading={loading && companies.length === 0} 
            // (新！) 允許清除選擇 (回到 "尚未指派" 狀態)
            // allowClear 
            // onChange={(value) => setSelectedCompanyId(value ?? null)} // 如果 allowClear，需要處理 null
          >
            {/* (可以加入一個 "不指派" 的選項) */}
            {/* <Option value={null}>-- 不指派 --</Option> */}
            {companies.map(company => (
              <Option key={company.id} value={company.id}>
                {company.name}
              </Option>
            ))}
          </Select>
        </Modal>
      )}
    </div>
  );
};

// 為了讓 App.useApp() 能運作，匯出包裝過的元件
const WrappedUserPage: React.FC = () => (
  <App> {/* 用 Antd 的 App 包裹 */}
    <UserPage />
  </App>
);

export default WrappedUserPage; // 匯出包裝後的版本