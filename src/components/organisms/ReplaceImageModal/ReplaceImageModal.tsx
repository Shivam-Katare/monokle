import {useMemo} from 'react';

import {Form, Input, Modal} from 'antd';

import {useAppDispatch, useAppSelector} from '@redux/hooks';
import {closeReplaceImageModal} from '@redux/reducers/ui';
import {replaceImageTag} from '@redux/thunks/replaceImageTag';

const ReplaceImageModal: React.FC = () => {
  const [form] = Form.useForm();

  const dispatch = useAppDispatch();
  const imagesMap = useAppSelector(state => state.main.imagesMap);
  const resourceMap = useAppSelector(state => state.main.resourceMap);
  const uiState = useAppSelector(state => state.ui.replaceImageModal);

  const image = useMemo(() => {
    if (!uiState) {
      return null;
    }

    return imagesMap.find(im => im.id === uiState.imageId);
  }, [imagesMap, uiState]);

  if (!uiState || !image) {
    return null;
  }

  const handleCancel = () => {
    dispatch(closeReplaceImageModal());
  };

  const handleOk = () => {
    form.validateFields().then(values => {
      const {tag} = values;

      replaceImageTag(image, tag, resourceMap, dispatch);
      dispatch(closeReplaceImageModal());
    });
  };

  return (
    <Modal
      title={`Replace ${image.name}:${image.tag}`}
      visible={uiState.isOpen}
      onCancel={handleCancel}
      onOk={handleOk}
    >
      <Form form={form} layout="vertical">
        <Form.Item name="tag" label="New Image Tag" rules={[{required: true, message: 'This field is required'}]}>
          <Input id="image-tag-input" placeholder="Enter image tag" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ReplaceImageModal;
