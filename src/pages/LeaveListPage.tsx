import React, { useState, useEffect } from 'react';
// (新！) 匯入 DatePicker 和 RangePicker 的型別
import { Table, Typography, App, Input, Space, DatePicker, type TableColumnsType, Tag } from 'antd';
import type { TablePaginationConfig } from 'antd/es/table';
import apiClient from '../api/apiClient';
import dayjs from 'dayjs'; // 我們需要 dayjs 來處理日期物件

const { Title } = Typography;
const { Search } = Input;
const { RangePicker } = DatePicker; // (新！) 從 DatePicker 中取出 RangePicker

// (介面定義保持不變)
interface Company { id: number; name: string; }
interface Applicant { id: number; username: string; company: Company | null; }
interface LeaveApplicationData { id: number; employee_name: string; department: string; leave_date: string; applicant_id: number; applicant: Applicant | null; created_at?: string; }

const LeaveListPage: React.FC = () => {
  const { message } = App.useApp();
  const [leaveList, setLeaveList] = useState<LeaveApplicationData[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState<TablePaginationConfig>({
      current: 1, pageSize: 5, total: 0, showSizeChanger: true, pageSizeOptions: ['5', '10', '20']
  });
  const [searchText, setSearchText] = useState<string>('');
  // (新！) 加入日期區間的 state
  // dayjs.Dayjs[] | null: 可以是包含兩個 dayjs 物件的陣列，或是 null
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);

  // (新！) fetchLeaveList 現在接收日期參數
  const fetchLeaveList = async (page: number, size: number, search: string, dates: [dayjs.Dayjs | null, dayjs.Dayjs | null] | null) => {
    setLoading(true);
    try {
      const skip = (page - 1) * size;

      // (新！) 準備日期參數 (如果 dateRange 有值，轉換成 YYYY-MM-DD 字串)
      const startDate = dates?.[0]?.format('YYYY-MM-DD');
      const endDate = dates?.[1]?.format('YYYY-MM-DD');

      const response = await apiClient.get<{ items: LeaveApplicationData[], total: number }>(
        '/leave-applications',
        {
          params: {
            skip: skip,
            limit: size,
            // (修改！) 使用 search_text 參數
            ...(search && { search_text: search }),
            // (新！) 加入日期參數 (只有在日期存在時才加入)
            ...(startDate && { start_date: startDate }),
            ...(endDate && { end_date: endDate }),
          }
        }
      );
      setLeaveList(response.data.items);
      setPagination(prev => ({ ...prev, current: page, pageSize: size, total: response.data.total }));
    } catch (error) {
      console.error("獲取請假列表失敗:", error);
      message.error('無法載入請假列表');
    } finally {
      setLoading(false);
    }
  };

  // (useEffect 保持不變，只在首次載入觸發)
  useEffect(() => {
    fetchLeaveList(pagination.current || 1, pagination.pageSize || 10, searchText, dateRange);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // (handleTableChange 保持不變，但傳遞 dateRange)
  const handleTableChange = ( newPagination: TablePaginationConfig, /* ... */ ) => {
    fetchLeaveList(
        newPagination.current || 1,
        newPagination.pageSize || 10,
        searchText,
        dateRange // <-- (新！) 傳遞當前日期範圍
    );
  };

  // (handleSearch 保持不變，但傳遞 dateRange)
  const handleSearch = (value: string) => {
     setSearchText(value);
     // 搜尋時回到第一頁
     fetchLeaveList(1, pagination.pageSize || 10, value, dateRange); // <-- (新！) 傳遞當前日期範圍
  };

  // (新！) 處理日期範圍變更的函式
  // antd RangePicker 的 onChange 會回傳 [dayjs | null, dayjs | null] 或 null
  const handleDateChange = (dates: [dayjs.Dayjs | null, dayjs.Dayjs | null] | null, dateStrings: [string, string]) => {
      console.log('Selected Date Range:', dateStrings); // 查看選擇的日期字串
      setDateRange(dates); // 更新日期 state
      // 選擇日期後，回到第一頁並觸發搜尋
      fetchLeaveList(1, pagination.pageSize || 10, searchText, dates);
  };

  // (表格欄位定義保持不變)
  // (在 LeaveListPage.tsx 中，確認這段存在且正確)
  const columns: TableColumnsType<LeaveApplicationData> = [ // (可以移除 | undefined)
    { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
    { title: '申請人', dataIndex: ['applicant', 'username'], key: 'applicant',
      render: (username: string | undefined) => username ?? 'N/A',
    },
    { title: '申請人公司', dataIndex: ['applicant', 'company', 'name'], key: 'company',
      render: (companyName: string | undefined) => companyName ?? '未指派',
    },
    { title: '表單姓名', dataIndex: 'employee_name', key: 'employee_name' },
    { title: '部門', dataIndex: 'department', key: 'department',
      render: (dept: string) => <Tag color={dept === 'rd' ? 'geekblue' : 'green'}>{dept.toUpperCase()}</Tag>
    },
    { title: '請假日期', dataIndex: 'leave_date', key: 'leave_date',
      render: (dateString: string) => dayjs(dateString).format('YYYY-MM-DD'),
    },
  ];

  return (
    <div>
      <Title level={2}>請假紀錄</Title>

      {/* (修改！) 將搜尋框和日期選擇器放在一起 */}
      <Space style={{ marginBottom: 16 }} wrap> {/* (新) wrap 允許換行 */}
         <Search
           placeholder="搜尋申請人或表單姓名" // (修改) 更新提示文字
           onSearch={handleSearch}
           enterButton
           style={{ width: 300 }}
           allowClear
           value={searchText}
           onChange={(e) => setSearchText(e.target.value)}
         />
         {/* (新！) 加入日期範圍選擇器 */}
         <RangePicker
            onChange={handleDateChange}
            // (可選) 設定預設顯示的日期格式
            format="YYYY-MM-DD"
            // (可選) 讓清除按鈕可以運作
            allowClear={true}
            // (可選) 綁定 state，雖然 onChange 已處理
            // value={dateRange}
         />
      </Space>

      {/* (Table 元件保持不變) */}
      <Table
        dataSource={leaveList}
        columns={columns}
        rowKey="id"
        scroll={{ x: 'max-content' }}
        loading={loading}
        pagination={pagination}
        onChange={handleTableChange}
      />
    </div>
  );
};

// (匯出包裝過的元件保持不變)
const WrappedLeaveListPage: React.FC = () => ( <App> <LeaveListPage /> </App> );
export default WrappedLeaveListPage;