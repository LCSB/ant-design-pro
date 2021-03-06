import React, { PureComponent } from 'react';
import { connect } from 'dva';
import {
  Form, Input, Select, DatePicker, Button, Spin,
} from 'antd';
import moment from 'moment';
import { getUrlParams } from '../../utils/utils';
import HistoryMap from './DetailMap';
import styles from './index.less';

const FormItem = Form.Item;
const { Option } = Select;
const { RangePicker } = DatePicker;
const showDate = 'YYYY-MM-DD';
const getCarDate = 'YYYY-MM-DD HH:mm:ss';
const statusOrder = {
  1: '新建',
  2: '查看',
  3: '编辑',
};

const statusCar = {
  1: '预约成功',
  2: '执行中',
  3: '订单完成',
  4: '取消订单',
};

@connect(({ orderDetail, car, person, driver }) => ({
  carList: car.carList,
  userList: person.userList,
  detailList: orderDetail.detailList,
  detailLoading: orderDetail.detailLoading,
  reasonList: orderDetail.reasonList,
  AvailableVehicles: orderDetail.AvailableVehicles,
  AvailableDriver: orderDetail.AvailableDriver,
  driverList: driver.driverList,
}))
@Form.create()
export default class DetailOrder extends PureComponent {
  state = {
    status: 0,
    idKey: undefined,
  }
  componentWillMount() {
    this.props.form.resetFields();
    const { search } = this.props.location;
    const { id, status } = getUrlParams(search);
    this.setState({
      status: parseInt(status, 10),
    });
    if (id) {
      this.props.dispatch({
        type: 'orderDetail/getOrderList',
        payload: id,
      });
      this.setState({
        idKey: id,
      });
    }
    // this.props.dispatch({
    //   type: 'driver/getDriverList',
    // });
    this.props.dispatch({
      type: 'person/getAllList',
    });
    this.props.dispatch({
      type: 'car/getAllCarList',
    });
    this.props.dispatch({
      type: 'orderDetail/getUseCarReason',
    });
  }

  componentWillUnmount() {
    this.setState({
      idKey: undefined,
    });
    this.props.dispatch({
      type: 'orderDetail/clearOrderHistory',
    });
  }

  showUseCar = (paramsItem, data) => {
    const { getFieldValue } = this.props.form;
    const params = {
      user_id: getFieldValue('originator'),
      start_time: getFieldValue('start_time'),
      end_time: getFieldValue('end_time'),
    };
    params[paramsItem] = data;
    const { status } = this.state;
    if (!!params.user_id && !!params.start_time && !!params.end_time && status !== 2) {
      params.start_time = params.start_time.format(getCarDate);
      params.end_time = params.end_time.format(getCarDate);
      this.props.dispatch({
        type: 'orderDetail/getAvailableVehicles',
        payload: params,
      });
      this.props.dispatch({
        type: 'orderDetail/getAvailableDriver',
        payload: params,
      });
    }
  }

  submitOrder = (e) => {
    e.preventDefault();
    this.props.form.validateFields((err, fieldsValue) => {
      if (!err) {
        const { status } = this.state;
        const params = {};

        params.originator = fieldsValue.originator;
        params.start_time = fieldsValue.start_time;
        params.end_time = fieldsValue.end_time;

        params.start_place = fieldsValue.start_place;
        params.end_place = fieldsValue.end_place;
        params.prototype_id = fieldsValue.prototype_id;
        params.order_status = fieldsValue.order_status;
        if (status === 1) {
          params.vehicle_id = fieldsValue.vehicle_id;
          if (fieldsValue.driver !== '') {
            params.driver = fieldsValue.driver;
          } else {
            params.driver = 0;
          }
          this.props.dispatch({
            type: 'orderDetail/createOrder',
            payload: params,
          });
        }
        if (status === 3) {
          if (!isNaN(parseInt(fieldsValue.vehicle_id, 10))) {
            params.vehicle_id = fieldsValue.vehicle_id;
          }
          if (!isNaN(parseInt(fieldsValue.driver, 10))) {
            params.driver = fieldsValue.driver;
          }
          const { detailList } = this.props;
          params.id = detailList.vehicle_order.id;
          this.props.dispatch({
            type: 'orderDetail/reviseOrder',
            payload: params,
          });
        }
      }
    });
  }

  backToList = () => {
    this.props.history.push('/carMes/order');
  }

  changeOrderStatus = (status) => {
    const { detailList } = this.props;
    const params = {};
    params.id = detailList.vehicle_order.id;
    params.order_status = status;
    this.props.dispatch({
      type: 'orderDetail/reviseOrder',
      payload: params,
    });
  }

  render() {
    const { status } = this.state;
    const {
      detailList, form, reasonList, userList, AvailableVehicles,
      detailLoading, AvailableDriver, driverList, carList,
    } = this.props;
    // let DriverSelectData = driverList;
    // if (AvailableDriver.length > 0) {
    //   DriverSelectData = AvailableDriver;
    // }
    // console.log(DriverSelectData);
    const { getFieldDecorator, getFieldValue } = form;
    // moment(detailList.vehicle_order.end_time, showDate)
    const realityTime = [];
    if (detailList.vehicle_order) {
      realityTime.push(moment(detailList.vehicle_order.start_time, showDate));
      realityTime.push(moment(detailList.vehicle_order.fact_back_time, showDate));
    }
    let showCarList = [];
    if (AvailableVehicles && AvailableVehicles['current-user-vehicle']) {
      const AvailableMes = AvailableVehicles['current-user-vehicle'];
      if (AvailableMes.vehicle_exts instanceof Array) {
        showCarList = AvailableMes.vehicle_exts;
      }
    } else {
      showCarList = carList;
    }

    // console.log(AvailableDriver);
    // console.log(reasonList);

    // const DriverNameById = {};
    // AvailableDriver.map((val) => {
    //   DriverNameById[val.id] = DriverNameById[val.name];
    //   return val;
    // });
    // console.log(DriverNameById);

    // const reasonById = {};
    // reasonList.map((val) => {
    //   reasonById[val.id] = reasonById[val.prototype_name];
    //   return val;
    // });

    return (
      <div className={styles.detailOrder}>
        <div className={styles.orderMes}>
          <Spin spinning={detailLoading}>
            <h2>{statusOrder[status]}派车单</h2>
            <Form
              onSubmit={this.submitOrder}
            >
              {
                status !== 1 &&
                (
                  <FormItem
                    label="车单号"
                  >
                    {getFieldDecorator('serial_no', {
                      initialValue: detailList.vehicle_order ? detailList.vehicle_order.serial_no : '',
                    })(
                      <Input
                        disabled
                        placeholder="车单号"
                      />
                    )}
                  </FormItem>
                )
              }
              <div className={styles.formH}>
                <FormItem
                  label="用车人"
                >
                  {getFieldDecorator('originator', {
                    rules: [{ required: true, message: '请输入用车人' }],
                    initialValue: detailList.vehicle_order ? detailList.vehicle_order.originator : '',
                  })(
                    <Select
                      disabled={status === 2}
                      placeholder="用车人"
                      onChange={this.showUseCar.bind(this, 'user_id')}
                    >
                      {
                        userList.map((val) => {
                          return (
                            <Option
                              value={val.sys_user.id}
                              key={val.sys_user.id}
                            >
                              {val.sys_user.name}
                            </Option>
                          );
                        })
                      }
                    </Select>
                  )}
                </FormItem>
              </div>
              <div className={styles.formH}>
                <FormItem
                  label="预计出车时间"
                >
                  {getFieldDecorator('start_time', {
                    rules: [{ required: true, message: '请输入预计出车时间' }],
                    initialValue: detailList.vehicle_order ?
                    moment(detailList.vehicle_order.start_time, getCarDate) : undefined,
                  })(
                    <DatePicker
                      showTime
                      format={getCarDate}
                      disabled={status === 2}
                      onChange={this.showUseCar.bind(this, 'start_time')}
                    />
                  )}
                </FormItem>
                <FormItem
                  label="预计结束时间"
                >
                  {getFieldDecorator('end_time', {
                    rules: [{ required: true, message: '请输入预计结束时间' }],
                    initialValue: detailList.vehicle_order ?
                    moment(detailList.vehicle_order.end_time, getCarDate) : undefined,
                  })(
                    <DatePicker
                      showTime
                      format={getCarDate}
                      disabled={status === 2}
                      onChange={this.showUseCar.bind(this, 'end_time')}
                    />
                  )}
                </FormItem>
              </div>
              {
                getFieldValue('originator') !== '' &&
                getFieldValue('start_time') !== undefined &&
                getFieldValue('end_time') !== undefined &&
                (
                  <FormItem
                    label="车牌号"
                  >
                    {getFieldDecorator('vehicle_id', {
                      rules: [{ required: true, message: '请选择车牌号' }],
                      initialValue: detailList.vehicle_order ? detailList.vehicle_number : '',
                    })(
                      <Select
                        disabled={status === 2}
                      >
                        {
                          showCarList.map((val) => {
                            return (
                              <Option
                                value={val.vehicle.id}
                                key={val.vehicle.id}
                              >
                                {val.vehicle.vehicle_number}
                              </Option>
                            );
                          })
                        }
                      </Select>
                    )}
                  </FormItem>
                )
              }
              {
                getFieldValue('originator') !== '' &&
                getFieldValue('start_time') !== undefined &&
                getFieldValue('end_time') !== undefined &&
                (
                  <FormItem
                    label="司机"
                  >
                    {getFieldDecorator('driver', {
                      initialValue: detailList.vehicle_order ?
                      (detailList.vehicle_order.driver === 0 ? '' : detailList.driver_name) : '',
                    })(
                      <Select
                        disabled={status === 2}
                      >
                        {
                          AvailableDriver.length <= 0 &&
                          driverList.map((val) => {
                            return (
                              <Option
                                value={val.sys_user.id}
                                key={val.sys_user.id}
                              >
                                {val.sys_user.name}
                              </Option>
                            );
                          })
                        }
                        {
                          AvailableDriver.length > 0 &&
                          AvailableDriver.map((val) => {
                            return (
                              <Option
                                value={val.id}
                                key={val.id}
                              >
                                {val.name}
                              </Option>
                            );
                          })
                        }
                      </Select>
                    )}
                  </FormItem>
                )
              }
              {
                status !== 1 &&
                (
                  <FormItem
                    label="实际出车时间"
                  >
                    {getFieldDecorator('realityTime', {
                      initialValue: detailList.vehicle_order ? realityTime : '',
                    })(
                      <RangePicker
                        disabled
                      />
                    )}
                  </FormItem>
                )
              }
              <div className={styles.formH}>
                <FormItem
                  label="出发地"
                >
                  {getFieldDecorator('start_place', {
                    rules: [{ required: true, message: '请输入出发地' }],
                    initialValue: detailList.vehicle_order ? detailList.vehicle_order.start_place : '',
                  })(
                    <Input
                      disabled={status === 2}
                      placeholder="出发地"
                    />
                  )}
                </FormItem>
                <FormItem
                  label="目的地"
                >
                  {getFieldDecorator('end_place', {
                    rules: [{ required: true, message: '请输入目的地' }],
                    initialValue: detailList.vehicle_order ? detailList.vehicle_order.end_place : '',
                  })(
                    <Input
                      disabled={status === 2}
                      placeholder="目的地"
                    />
                  )}
                </FormItem>
              </div>
              <div className={styles.formH}>
                {/* <FormItem
                  label="司机"
                >
                  {getFieldDecorator('driver ', {
                    // rules: [{ required: true, message: '请输入司机' }],
                    // initialValue: moadlType === '添加' ? '' : record.phone,
                  })(
                    <Input
                      // disabled={moadlType !== '添加'}
                      placeholder="司机"
                    />
                  )}
                </FormItem> */}
                {/* <FormItem
                  label="目的地"
                >
                  {getFieldDecorator('Phone', {
                    rules: [{ required: true, message: '请输入目的地' }],
                    // initialValue: moadlType === '添加' ? '' : record.phone,
                  })(
                    <Input
                      // disabled={moadlType !== '添加'}
                      placeholder="目的地"
                    />
                  )}
                </FormItem> */}
              </div>
              <FormItem
                label="用车原因"
              >
                {
                  getFieldDecorator('prototype_id', {
                    rules: [{ required: true, message: '请输入用车原因' }],
                    initialValue: detailList.vehicle_order ? detailList.vehicle_order.prototype_id : '',
                  })(
                    <Select
                      disabled={status === 2}
                      // mode="combobox"
                    >
                      {
                        reasonList.map((val) => {
                          return (
                            <Option value={val.id} key={val.id}>
                              {val.prototype_name}
                            </Option>
                          );
                        })
                      }
                      {/* {reasonOption} */}
                    </Select>
                  )
                }
              </FormItem>
              {
                status !== 1 &&
                (
                  <FormItem
                    label="派车单状态"
                  >
                    {getFieldDecorator('order_status', {
                      initialValue: detailList.vehicle_order ? detailList.vehicle_order.order_status : '',
                    })(
                      <Select
                        disabled={status === 2}
                      >
                        <Option value={1} key={1}>
                          {statusCar[1]}
                        </Option>
                        <Option value={2} key={2}>
                          {statusCar[2]}
                        </Option>
                        <Option value={3} key={3}>
                          {statusCar[3]}
                        </Option>
                        <Option value={4} key={4}>
                          {statusCar[4]}
                        </Option>
                      </Select>
                    )}
                  </FormItem>
                )
              }
              <div className={styles.btns}>
                <Button
                  type="primary"
                  onClick={this.backToList}
                >
                  返回派车单列表
                </Button>
                {
                  status === 1 &&
                  <Button type="primary" htmlType="submit">拿钥匙</Button>
                }
                {
                  status === 3 &&
                  (
                    <div className={styles.Setbtns}>
                      {
                        detailList.vehicle_order &&
                        detailList.vehicle_order.order_status === 1 &&
                        (
                          <div className={styles.resOrder}>
                            <Button
                              type="primary"
                              onClick={this.changeOrderStatus.bind(this, 4)}
                            >
                              取消派车单
                            </Button>
                            <Button type="primary" htmlType="submit">修改派车单</Button>
                          </div>
                        )
                      }
                    </div>
                  )
                }
                {
                  detailList.vehicle_order &&
                  detailList.vehicle_order.order_status === 2 &&
                  (
                    <Button
                      type="primary"
                      onClick={this.changeOrderStatus.bind(this, 3)}
                    >
                      还钥匙
                    </Button>
                  )
                }
              </div>
            </Form>
          </Spin>
        </div>
        <div
          className={styles.mapMes}
          style={{ width: 'calc(100vw - 500px)' }}
        >
          <HistoryMap
            id={this.state.idKey}
          />
        </div>
      </div>
    );
  }
}
