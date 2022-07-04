import {ExclamationCircleOutlined} from '@ant-design/icons';

import styled from 'styled-components';

import Colors from '@styles/Colors';

export const ErrorMessageLabel = styled.div`
  color: ${Colors.redError};
  margin-top: 10px;
`;

export const HeadlineLabel = styled.div`
  margin-bottom: 16px;
`;

export const NamespaceContainer = styled.div`
  display: grid;
  grid-template-columns: max-content 1fr;
  grid-column-gap: 10px;
  align-items: center;
  margin-top: 24px;
`;

export const TitleContainer = styled.div`
  display: flex;
  align-items: center;
`;

export const TitleIcon = styled(ExclamationCircleOutlined)`
  margin-right: 10px;
  color: ${Colors.yellowWarning};
`;
