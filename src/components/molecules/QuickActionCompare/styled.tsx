import {Spin as RawSpin} from 'antd';

import {LoadingOutlined} from '@ant-design/icons';

import styled from 'styled-components';

import Colors from '@styles/Colors';

export const PreviewLoadingIcon = <LoadingOutlined style={{fontSize: 16}} spin />;

export const PreviewSpan = styled.span<{isItemSelected: boolean}>`
  font-weight: 500;
  font-size: 12px;
  cursor: pointer;
  color: ${props => (props.isItemSelected ? Colors.blackPure : Colors.blue6)};
  margin-left: 5px;
  margin-right: 15px;
`;

export const ReloadSpan = styled.span<{isItemSelected: boolean}>`
  margin-right: 15px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  color: ${props => (props.isItemSelected ? Colors.blackPure : Colors.blue6)};
`;

export const Container = styled.span`
  display: flex;
  align-items: center;
`;

export const Spin = styled(RawSpin)`
  margin-right: 15px;
`;
