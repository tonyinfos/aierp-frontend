// (新！) 從 antd 匯入 Rule 型別
import { Input, Select, DatePicker, Radio, Checkbox, InputNumber } from 'antd';
import type { Rule } from 'antd/es/form'; // <-- 匯入 Antd 的 Rule 型別

export interface FieldOption {
  label: string;
  value: string | number;
}

// ... (componentMap 和 FieldOption 保持不變) ...

// (新！) 定義 componentProps 可以是任何物件
type ComponentProps = Record<string, unknown>;

// 修改 FormField 介面
export interface FormField {
  name: string;
  label: string;
  fieldType: string;
  // (修正！) 使用 Antd 的 Rule 型別陣列
  rules?: Rule[];
  options?: FieldOption[];
  // (修正！) 使用我們定義的 ComponentProps 型別
  componentProps?: ComponentProps;
}

// --- 元件對應表 (保持不變) ---
// 將 fieldType 字串對應到實際的 Antd 元件
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const componentMap: { [key: string]: React.ComponentType<any> } = {
  'Input': Input,
  'Input.TextArea': Input.TextArea,
  'InputNumber': InputNumber,
  'Select': Select,
  'DatePicker': DatePicker,
  'RadioGroup': Radio.Group,
  'CheckboxGroup': Checkbox.Group,
  // 您可以隨時在這裡加入更多 Antd 元件的對應
};
// -------------------------------------------