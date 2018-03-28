import React, { PureComponent } from 'react';
import {
  Button, Input, Modal, Form, Radio,
} from 'antd';

const FormItem = Form.Item;
const RadioGroup = Radio.Group;
// const { Option } = Select;
// const { TextArea } = Input;

export default class Modalconfig extends PureComponent {
  handleSubmit = (e) => {
    e.preventDefault();
    this.props.form.validateFields((err, fieldsValue) => {
      if (!err.vehicle_model_name && !err.enable) {
        const { dispatch } = this.props;
        dispatch({
          type: 'car/addCarType',
          payload: fieldsValue,
        });
        this.props.cancelTypeModal();
      }
    });
  }
  render() {
    const { getFieldDecorator } = this.props.form;
    const { cancelTypeModal, carTypeVisible } = this.props;
    return (
      <Modal
        visible={carTypeVisible}
        width={1000}
        footer={null}
        title="添加车型"
        maskClosable={false}
        onCancel={cancelTypeModal}
      >
        <Form
          onSubmit={this.handleSubmit}
        >
          <FormItem
            label="车型号"
          >
            {getFieldDecorator('vehicle_model_name', {
              rules: [{ required: true, message: '请输入车型号 ' }],
            })(
              <Input
                placeholder="车型号"
              />
            )}
          </FormItem>
          <FormItem
            label="可用状态"
          >
            {getFieldDecorator('enable', {
              rules: [{ required: true, message: '请选择可用状态' }],
            })(
              <RadioGroup>
                <Radio value>是</Radio>
                <Radio value={false}>否</Radio>
              </RadioGroup>
            )}
          </FormItem>
          <div className="btns">
            <Button type="primary" htmlType="submit">添加</Button>
            <Button
              type="primary"
              onClick={cancelTypeModal}
            >
              取消
            </Button>
          </div>
        </Form>
      </Modal>
    );
  }
}
