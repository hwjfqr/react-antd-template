import { useState, useEffect, useContext } from 'react';
import {
  Table,
  Card,
  Form,
  Input,
  Radio,
  Button,
  Space,
  message,
  Modal,
} from 'antd';
import { PageContainer } from '@ant-design/pro-layout';
import { TagSelector, ModalDetail, ModalForm } from 'ant-design-power';
import StandardFormRow from '@/components/StandardFormRow';
import Context from '@/context';
import { getListItemDetails, listCols as cols } from './data';
import {
  getList,
  addOrEditListItem,
  deleteListItem,
  ListFilterType,
  AddOrEditDataType,
} from './api';
import styles from './index.less';

function CurdTemplate() {
  const { deviceType } = useContext(Context);

  /* 列表逻辑 */
  const [list, setList] = useState({
    data: [],
    total: 0,
  });
  const [listFilter, setListFilter] = useState<ListFilterType>({
    page: 1,
    pageSize: 10,
    name: undefined,
    type: 'all',
  });
  const getListFn = async () => {
    const { data, total } = await getList(listFilter);
    setList({ data, total });
  };
  useEffect(() => {
    getListFn();
  }, [listFilter]);

  /* 详情逻辑 */
  const [listItemDetailArgs, setListItemDetailArgs] = useState<{
    visible: boolean;
    data: { label: string; value?: string }[];
  }>({
    visible: false,
    data: [],
  });

  /* 添加与删除逻辑 */
  const [listItemFormArgs, setListItemFormArgs] = useState<{
    visible: boolean;
    data?: AddOrEditDataType;
  }>({
    visible: false,
  });
  const listCols = [
    ...cols,
    {
      title: '操作',
      dataIndex: 'operate',
      width: 120,
      render: (_: any, r: any) => {
        return (
          <Space>
            <a
              onClick={() => {
                const data = getListItemDetails(r);
                setListItemDetailArgs({
                  visible: true,
                  data,
                });
              }}
            >
              详情
            </a>
            <a
              onClick={() => {
                setListItemFormArgs({
                  visible: true,
                  data: { ...r },
                });
              }}
            >
              修改
            </a>
            <a
              className="danger-text"
              onClick={() => {
                Modal.confirm({
                  title: '删除',
                  content: `确认删除吗？`,
                  maskClosable: true,
                  onOk: async () => {
                    const b = await deleteListItem(r.id as number);
                    if (b) {
                      message.success('删除成功！');
                      if (list.data.length === 1 && listFilter.page > 1) {
                        setListFilter((d) => ({
                          ...d,
                          page: listFilter.page - 1,
                        }));
                      } else {
                        getListFn();
                      }
                    }
                  },
                });
              }}
            >
              删除
            </a>
          </Space>
        );
      },
    },
  ];

  return (
    <div className={styles['curd-template']}>
      <PageContainer
        title="用户管理"
        extra={
          <Button
            type="primary"
            onClick={() => {
              setListItemFormArgs({
                visible: true,
              });
            }}
          >
            新增
          </Button>
        }
      >
        <Card
          style={{ marginBottom: deviceType === 'web' ? 16 : 0 }}
          size={deviceType === 'web' ? 'default' : 'small'}
        >
          <Form layout="inline">
            <StandardFormRow last>
              <Form.Item label="用户名">
                <Input.Search
                  style={{ width: 150 }}
                  size="small"
                  enterButton
                  allowClear
                  defaultValue={listFilter.name}
                  onSearch={(val) => {
                    setListFilter((d) => ({
                      ...d,
                      name: val || undefined,
                      page: 1,
                    }));
                  }}
                ></Input.Search>
              </Form.Item>
              <Form.Item label="用户类型">
                <TagSelector
                  type="radio"
                  tags={['管理员', '普通用户', '访客'].map((item) => ({
                    label: item,
                    value: item,
                  }))}
                  showAll
                  value={listFilter.type}
                  onChange={(val) => {
                    setListFilter((d) => ({
                      ...d,
                      type: val,
                      page: 1,
                    }));
                  }}
                ></TagSelector>
              </Form.Item>
              {deviceType === 'mobile' ? (
                <div>当前共有 {list.total} 条数据</div>
              ) : null}
            </StandardFormRow>
          </Form>
        </Card>
        <Card size={deviceType === 'web' ? 'default' : 'small'}>
          <Table
            rowKey="id"
            size="small"
            columns={listCols}
            dataSource={list.data}
            pagination={{
              total: list.total,
              showTotal:
                deviceType === 'web'
                  ? (total) => `当前共有 ${total || '-'} 条数据`
                  : undefined,
              position: ['bottomCenter'],
              current: listFilter.page,
              pageSize: listFilter.pageSize,
              showSizeChanger: true,
              onChange: (page, pageSize) => {
                setListFilter((d) => ({
                  ...d,
                  page,
                  pageSize,
                }));
              },
            }}
          ></Table>
        </Card>

        {/* 详情页面Modal */}
        <ModalDetail
          title="详情"
          descriptionsProps={{ size: 'small' }}
          visible={listItemDetailArgs.visible}
          data={listItemDetailArgs.data}
          onClose={() => setListItemDetailArgs({ visible: false, data: [] })}
          modalProps={{ footer: null }}
        >
          {/* 额外要添加的内容 */}
        </ModalDetail>

        {/* 添加与修改表单Modal */}
        <ModalForm<AddOrEditDataType>
          title={!listItemFormArgs.data ? '添加' : '修改'}
          initialValue={listItemFormArgs.data}
          visible={listItemFormArgs.visible}
          onClose={() => {
            setListItemFormArgs({
              visible: false,
            });
          }}
          onSubmit={async (value, isEdit) => {
            const b = await addOrEditListItem(value);
            if (b) {
              message.success(!isEdit ? '添加成功！' : '修改成功！');
              setListFilter((d) => ({
                ...d,
                page: 1,
              }));
            }
            return b;
          }}
        >
          <Form.Item
            label="用户名"
            name="username"
            rules={[{ required: true, message: '请填写' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item label="用户类型" name="type">
            <Radio.Group>
              {[
                { label: '管理员', value: 'admin' },
                { label: '普通用户', value: 'user' },
                { label: '访客', value: 'guest' },
              ].map(({ label, value }) => (
                <Radio value={value} key={value}>
                  {label || '-'}
                </Radio>
              ))}
            </Radio.Group>
          </Form.Item>
          <Form.Item label="状态" name="status">
            <Radio.Group>
              {[
                { label: '启用', value: 1 },
                { label: '禁用', value: 0 },
              ].map(({ label, value }) => (
                <Radio value={value} key={value}>
                  {label || '-'}
                </Radio>
              ))}
            </Radio.Group>
          </Form.Item>
        </ModalForm>
      </PageContainer>
    </div>
  );
}

export default CurdTemplate;
