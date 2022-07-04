import {useMemo, useState} from 'react';
import {MonacoDiffEditor} from 'react-monaco-editor';
import {useMeasure} from 'react-use';

import {Button, Switch, Tag} from 'antd';

import {ArrowLeftOutlined, ArrowRightOutlined} from '@ant-design/icons';

import {languages} from 'monaco-editor/esm/vs/editor/editor.api';
import styled from 'styled-components';
import {parse, stringify} from 'yaml';

import {PREVIEW_PREFIX} from '@constants/constants';
import {makeApplyKustomizationText, makeApplyResourceText} from '@constants/makeApplyText';

import {K8sResource} from '@models/k8sresource';

import {useAppDispatch, useAppSelector} from '@redux/hooks';
import {currentConfigSelector, kubeConfigContextSelector} from '@redux/selectors';
import {isKustomizationResource} from '@redux/services/kustomize';
import {applyResource} from '@redux/thunks/applyResource';
import {updateResource} from '@redux/thunks/updateResource';

import {Icon} from '@atoms';

import useResourceYamlSchema from '@hooks/useResourceYamlSchema';

import {useWindowSize} from '@utils/hooks';
import {KUBESHOP_MONACO_THEME} from '@utils/monaco';
import {removeIgnoredPathsFromResourceContent} from '@utils/resources';

import Colors from '@styles/Colors';

import ModalConfirmWithNamespaceSelect from '../ModalConfirmWithNamespaceSelect';

// @ts-ignore
const {yaml} = languages || {};

const MonacoDiffContainer = styled.div<{height: string; width: string}>`
  ${props => `
    height: ${props.height};
    width: ${props.width};
  `}
  padding: 8px;
  & .monaco-editor .monaco-editor-background {
    background-color: ${Colors.grey1000} !important;
  }
  & .monaco-editor .margin {
    background-color: ${Colors.grey1000} !important;
  }
  & .diffOverview {
    background-color: ${Colors.grey1000} !important;
  }
`;

const SwitchContainer = styled.span`
  /* margin-right: 20px; */
  width: 100%;
  display: flex;
  justify-content: center;
  margin-top: 12px;
`;

const StyledSwitchLabel = styled.span`
  margin-left: 8px;
  cursor: pointer;
`;

const TagsContainer = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 8px;
  padding-bottom: 5px;
`;

const StyledTag = styled(Tag)`
  padding: 5px 10px;
  font-size: 14px;
  font-weight: 600;
`;

const ResourceDiff = (props: {localResource: K8sResource; clusterResourceText: string; onApply?: () => void}) => {
  const dispatch = useAppDispatch();
  const {localResource, clusterResourceText, onApply} = props;

  const windowSize = useWindowSize();

  const resourceMap = useAppSelector(state => state.main.resourceMap);
  const previewType = useAppSelector(state => state.main.previewType);
  const fileMap = useAppSelector(state => state.main.fileMap);
  const projectConfig = useAppSelector(currentConfigSelector);
  const kubeConfigContext = useAppSelector(kubeConfigContextSelector);
  const [shouldDiffIgnorePaths, setShouldDiffIgnorePaths] = useState<boolean>(true);

  const [containerRef, {height: containerHeight, width: containerWidth}] = useMeasure<HTMLDivElement>();

  const [isApplyModalVisible, setIsApplyModalVisible] = useState(false);
  const k8sVersion = useAppSelector(state => state.config.projectConfig?.k8sVersion);
  const userDataDir = useAppSelector(state => state.config.userDataDir);

  useResourceYamlSchema(yaml, String(userDataDir), String(k8sVersion), localResource);

  const options = {
    renderSideBySide: true,
    automaticLayoutResize: true,
    minimap: {
      enabled: false,
    },
    readOnly: true,
  };

  const confirmModalTitle = useMemo(
    () =>
      isKustomizationResource(localResource)
        ? makeApplyKustomizationText(localResource.name, kubeConfigContext)
        : makeApplyResourceText(localResource.name, kubeConfigContext),
    [localResource, kubeConfigContext]
  );

  const localResourceText = useMemo(() => {
    return stringify(localResource.content, {sortMapEntries: true});
  }, [localResource]);

  const cleanClusterResourceText = useMemo(() => {
    if (!shouldDiffIgnorePaths) {
      return clusterResourceText;
    }
    const originalClusterResourceContent = parse(clusterResourceText);
    const cleanClusterResourceContent = removeIgnoredPathsFromResourceContent(originalClusterResourceContent);

    return stringify(cleanClusterResourceContent, {sortMapEntries: true});
  }, [clusterResourceText, shouldDiffIgnorePaths]);

  const areResourcesDifferent = useMemo(() => {
    return localResourceText !== cleanClusterResourceText;
  }, [localResourceText, cleanClusterResourceText]);

  const monacoDiffContainerWidth = useMemo(() => {
    return (windowSize.width * 86.5) / 100 > 1000 ? '1000px' : '86.5vw';
  }, [windowSize.width]);

  const handleApply = () => {
    setIsApplyModalVisible(true);
  };

  const handleReplace = () => {
    if (!shouldDiffIgnorePaths) {
      return;
    }
    dispatch(
      updateResource({
        resourceId: localResource.id,
        text: cleanClusterResourceText,
        preventSelectionAndHighlightsUpdate: true,
      })
    );
  };

  const onClickApplyResource = (namespace?: {name: string; new: boolean}) => {
    if (onApply) {
      onApply();
    }

    applyResource(localResource.id, resourceMap, fileMap, dispatch, projectConfig, kubeConfigContext, namespace, {
      isClusterPreview: previewType === 'cluster',
      shouldPerformDiff: true,
    });
    setIsApplyModalVisible(false);
  };

  return (
    <>
      <MonacoDiffContainer width="100%" height="58vh" ref={containerRef}>
        <MonacoDiffEditor
          key={monacoDiffContainerWidth}
          language="yaml"
          original={localResourceText}
          value={cleanClusterResourceText}
          options={options}
          theme={KUBESHOP_MONACO_THEME}
          width={containerWidth}
          height={containerHeight}
        />
      </MonacoDiffContainer>

      <TagsContainer>
        <StyledTag>Local</StyledTag>
        <Button
          type="primary"
          ghost
          onClick={handleApply}
          icon={<Icon name="kubernetes" />}
          disabled={!areResourcesDifferent}
        >
          Deploy local resource to cluster <ArrowRightOutlined />
        </Button>
        <Button
          type="primary"
          ghost
          onClick={handleReplace}
          disabled={
            !shouldDiffIgnorePaths || !areResourcesDifferent || localResource.filePath.startsWith(PREVIEW_PREFIX)
          }
        >
          <ArrowLeftOutlined /> Replace local resource with cluster resource
        </Button>
        <StyledTag>Cluster</StyledTag>
      </TagsContainer>

      <SwitchContainer onClick={() => setShouldDiffIgnorePaths(!shouldDiffIgnorePaths)}>
        <Switch checked={shouldDiffIgnorePaths} />
        <StyledSwitchLabel>Hide ignored fields</StyledSwitchLabel>
      </SwitchContainer>

      {isApplyModalVisible && (
        <ModalConfirmWithNamespaceSelect
          isVisible={isApplyModalVisible}
          resources={[localResource]}
          title={confirmModalTitle}
          onOk={namespace => onClickApplyResource(namespace)}
          onCancel={() => setIsApplyModalVisible(false)}
        />
      )}
    </>
  );
};

export default ResourceDiff;
