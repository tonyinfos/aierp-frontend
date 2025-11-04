import React from 'react';
// (修正！) 從 antd 匯入 Form，並 "type-only" 匯入 FormInstance
import { Form, Select, Radio, Checkbox } from 'antd';
import type { FormInstance } from 'antd'; // <-- 使用 "import type"

// (修正！) "type-only" 匯入 Mapper 中的型別
import { componentMap } from './FormMapper';
import type { FormField, FieldOption } from './FormMapper'; // <-- 使用 "import type"

const { Option } = Select;

// 定義 DynamicForm 元件接收的屬性 (Props)
interface DynamicFormProps {
  formSchema: FormField[];
  form: FormInstance;
  // (修正！) 將 onFinish 的 values 型別從 any 改為 Record<string, unknown>
  onFinish: (values: Record<string, unknown>) => void;
  // (修正！) 將 initialValues 的型別從 any 改為 Record<string, unknown>
  initialValues?: Record<string, unknown>;
}

const DynamicForm: React.FC<DynamicFormProps> = ({
  formSchema,
  form,
  onFinish,
  initialValues
}) => {

  // --- (核心！) 動態渲染單個表單欄位的函式 ---
  const renderField = (field: FormField) => {
    const Component = componentMap[field.fieldType];
    if (!Component) {
      console.warn(`[DynamicForm] 未知的 fieldType: ${field.fieldType} for field ${field.name}`);
      return null;
    }

    let children: React.ReactNode = null;
    if (field.options && Array.isArray(field.options)) {
      if (field.fieldType === 'Select') {
        children = field.options.map((opt: FieldOption) => (
          <Option key={opt.value} value={opt.value}>
            {opt.label}
          </Option>
        ));
      } else if (field.fieldType === 'RadioGroup') {
        children = field.options.map((opt: FieldOption) => (
          <Radio key={opt.value} value={opt.value}>
            {opt.label}
          </Radio>
        ));
      } else if (field.fieldType === 'CheckboxGroup') {
        children = field.options.map((opt: FieldOption) => (
          <Checkbox key={opt.value} value={opt.value}>
            {opt.label}
          </Checkbox>
        ));
      }
    }

    return (
      <Form.Item
        key={field.name}
        name={field.name}
        label={field.label}
        rules={field.rules}
      >
        {/* (修正！) componentProps 可能是 undefined，給個預設空物件 */}
        <Component {...(field.componentProps || {})}>
          {children}
        </Component>
      </Form.Item>
    );
  };
  // --- 渲染函式結束 ---

  return (
    <Form
      form={form}
      onFinish={onFinish}
      initialValues={initialValues}
      layout="vertical"
    >
      {formSchema.map(renderField)}
    </Form>
  );
};

export default DynamicForm;