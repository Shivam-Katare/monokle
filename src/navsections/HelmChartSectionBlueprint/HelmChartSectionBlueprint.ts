import {HELM_CHART_SECTION_NAME, ROOT_FILE_ENTRY} from '@constants/constants';

import {HelmPreviewConfiguration} from '@models/appconfig';
import {FileMapType, HelmValuesMapType} from '@models/appstate';
import {FileEntry} from '@models/fileentry';
import {HelmChart, HelmValuesFile} from '@models/helm';
import {SectionBlueprint} from '@models/navigator';

import {selectFile, selectHelmValuesFile, selectPreviewConfiguration} from '@redux/reducers/main';

import {isDefined} from '@utils/filter';

import CollapseSectionPrefix from './CollapseSectionPrefix';
import HelmChartQuickAction from './HelmChartQuickAction';
import ItemPrefix from './ItemPrefix';
import PreviewConfigurationNameSuffix from './PreviewConfigurationNameSuffix';
import PreviewConfigurationQuickAction from './PreviewConfigurationQuickAction';

type TemplatesScopeType = {
  fileMap: FileMapType;
  isFolderOpen: boolean;
  selectedPath: string | undefined;
  [currentHelmChart: string]: HelmChart | unknown;
};

export type ValuesFilesScopeType = {
  helmValuesMap: HelmValuesMapType;
  previewValuesFileId: string | undefined;
  isInClusterMode: boolean;
  isFolderOpen: boolean;
  selectedPath: string | undefined;
  [currentHelmChart: string]: HelmChart | unknown;
};

type HelmChartScopeType = {
  selectedPath: string | undefined;
  previewValuesFileId: string | undefined;
  isInClusterMode: boolean;
  [currentHelmChart: string]: HelmChart | unknown;
};

type PreviewConfigurationScopeType = {
  previewConfigurationMap: Record<string, HelmPreviewConfiguration | null> | undefined;
  selectedPreviewConfigurationId: string | undefined;
  [currentHelmChart: string]: HelmChart | unknown;
};

export function makeHelmChartSectionBlueprint(helmChart: HelmChart) {
  const previewConfigurationsSectionBlueprint: SectionBlueprint<
    HelmPreviewConfiguration,
    PreviewConfigurationScopeType
  > = {
    name: 'Preview Configurations',
    id: `${helmChart.id}-configurations`,
    rootSectionId: HELM_CHART_SECTION_NAME,
    getScope: state => {
      return {
        previewConfigurationMap: state.config.projectConfig?.helm?.previewConfigurationMap,
        selectedPreviewConfigurationId: state.main.selectedPreviewConfigurationId,
        [helmChart.id]: state.main.helmChartMap[helmChart.id],
      };
    },
    builder: {
      getRawItems: scope => {
        const currentHelmChart = scope[helmChart.id] as HelmChart | undefined;
        if (!currentHelmChart) {
          return [];
        }
        return scope.previewConfigurationMap
          ? Object.values(scope.previewConfigurationMap).filter((pc): pc is HelmPreviewConfiguration =>
              Boolean(pc && pc.helmChartFilePath === currentHelmChart.filePath)
            )
          : [];
      },
      isInitialized: () => true,
      isVisible: () => true,
    },
    itemBlueprint: {
      getInstanceId: rawItem => rawItem.id,
      getName: rawItem => rawItem.name,
      rowBuilder: {
        indentation: 12,
        height: 23,
        marginBottom: instance => (instance.isLast ? 12 : 0),
      },
      builder: {
        getMeta: () => {
          return {
            itemPrefixStyle: {
              paddingLeft: 10,
            },
            itemPrefixIcon: 'preview',
          };
        },
        isSelected: (item, scope) => {
          return item.id === scope.selectedPreviewConfigurationId;
        },
      },
      instanceHandler: {
        onClick: (itemInstance, dispatch) => {
          dispatch(selectPreviewConfiguration(itemInstance.id));
        },
      },
      customization: {
        quickAction: {
          component: PreviewConfigurationQuickAction,
          isVisibleOnHover: true,
        },
        prefix: {
          component: ItemPrefix,
        },
      },
    },
    rowBuilder: {
      indentation: 10,
      fontSize: 14,
      marginBottom: instance => (instance.isCollapsed || instance.isEmpty || !instance.visibleItemIds?.length ? 12 : 0),
    },
    customization: {
      counter: {type: 'items'},
      prefix: {
        component: CollapseSectionPrefix,
      },
      suffix: {
        component: PreviewConfigurationNameSuffix,
        isVisibleOnHover: true,
      },
    },
  };

  const templateFilesSectionBlueprint: SectionBlueprint<FileEntry, TemplatesScopeType> = {
    name: 'Templates',
    id: `${helmChart.id}-templates`,
    rootSectionId: HELM_CHART_SECTION_NAME,
    getScope: state => {
      return {
        isFolderOpen: Boolean(state.main.fileMap[ROOT_FILE_ENTRY]),
        fileMap: state.main.fileMap,
        selectedPath: state.main.selectedPath,
        [helmChart.id]: state.main.helmChartMap[helmChart.id],
      };
    },
    builder: {
      getRawItems: scope => {
        const currentHelmChart = scope[helmChart.id] as HelmChart | undefined;
        if (!currentHelmChart) {
          return [];
        }
        return currentHelmChart.templateFilePaths.map(filePath => scope.fileMap[filePath.filePath]).filter(isDefined);
      },
      isInitialized: scope => {
        return scope.isFolderOpen;
      },
      isEmpty: (scope, rawItems) => {
        return scope.isFolderOpen && rawItems.length === 0;
      },
    },
    rowBuilder: {
      indentation: 10,
      fontSize: 14,
    },
    customization: {
      counter: {type: 'items'},
      prefix: {
        component: CollapseSectionPrefix,
      },
    },
    itemBlueprint: {
      getName: rawItem => rawItem.name,
      getInstanceId: rawItem => rawItem.filePath,
      rowBuilder: {
        indentation: 12,
        height: 23,
      },
      builder: {
        isSelected: (rawItem, scope) => {
          return rawItem.filePath === scope.selectedPath;
        },
        getMeta: () => {
          return {
            itemPrefixStyle: {
              paddingLeft: 10,
            },
            itemPrefixIcon: 'file',
          };
        },
      },
      instanceHandler: {
        onClick: (itemInstance, dispatch) => {
          dispatch(selectFile({filePath: itemInstance.id}));
        },
      },
      customization: {
        prefix: {
          component: ItemPrefix,
        },
      },
    },
  };

  const valuesFilesSectionBlueprint: SectionBlueprint<HelmValuesFile, ValuesFilesScopeType> = {
    name: 'Values Files',
    id: `${helmChart.id}-values`,
    rootSectionId: HELM_CHART_SECTION_NAME,
    getScope: state => {
      const kubeConfigPath = state.config.projectConfig?.kubeConfig?.path || state.config.kubeConfig.path;
      return {
        helmValuesMap: state.main.helmValuesMap,
        isInClusterMode: kubeConfigPath
          ? Boolean(state.main.previewResourceId && state.main.previewResourceId.endsWith(kubeConfigPath))
          : false,
        previewValuesFileId: state.main.previewValuesFileId,
        isFolderOpen: Boolean(state.main.fileMap[ROOT_FILE_ENTRY]),
        selectedPath: state.main.selectedPath,
        [helmChart.id]: state.main.helmChartMap[helmChart.id],
      };
    },
    builder: {
      getRawItems: scope => {
        const currentHelmChart = scope[helmChart.id] as HelmChart | undefined;
        if (!currentHelmChart) {
          return [];
        }
        return currentHelmChart.valueFileIds
          .map(id => scope.helmValuesMap[id])
          .filter((v): v is HelmValuesFile => v !== undefined);
      },
      isInitialized: scope => {
        return scope.isFolderOpen;
      },
      isEmpty: (scope, rawItems) => {
        return scope.isFolderOpen && rawItems.length === 0;
      },
    },
    rowBuilder: {
      indentation: 10,
      fontSize: 14,
    },
    customization: {
      counter: {
        type: 'items',
      },
      prefix: {
        component: CollapseSectionPrefix,
      },
    },
    itemBlueprint: {
      getName: rawItem => rawItem.name,
      getInstanceId: rawItem => rawItem.id,
      rowBuilder: {
        indentation: 12,
        height: 23,
      },
      builder: {
        isSelected: (rawItem, scope) => {
          return rawItem.filePath === scope.selectedPath;
        },
        isDisabled: (rawItem, scope) =>
          Boolean((scope.previewValuesFileId && scope.previewValuesFileId !== rawItem.id) || scope.isInClusterMode),
        getMeta: () => {
          return {
            itemPrefixStyle: {
              paddingLeft: 10,
            },
            itemPrefixIcon: 'file',
          };
        },
      },
      instanceHandler: {
        onClick: (itemInstance, dispatch) => {
          dispatch(selectHelmValuesFile({valuesFileId: itemInstance.id}));
        },
      },
      customization: {
        quickAction: {
          component: HelmChartQuickAction,
          isVisibleOnHover: true,
        },
        prefix: {
          component: ItemPrefix,
        },
      },
    },
  };

  const helmChartSectionBlueprint: SectionBlueprint<HelmChart, HelmChartScopeType> = {
    id: helmChart.id,
    name: helmChart.name,
    rootSectionId: HELM_CHART_SECTION_NAME,
    childSectionIds: [
      valuesFilesSectionBlueprint.id,
      templateFilesSectionBlueprint.id,
      previewConfigurationsSectionBlueprint.id,
    ],
    getScope: state => {
      const kubeConfigPath = state.config.projectConfig?.kubeConfig?.path || state.config.kubeConfig.path;
      return {
        isInClusterMode: kubeConfigPath
          ? Boolean(state.main.previewResourceId && state.main.previewResourceId.endsWith(kubeConfigPath))
          : false,
        previewValuesFileId: state.main.previewValuesFileId,
        selectedPath: state.main.selectedPath,
        [helmChart.id]: state.main.helmChartMap[helmChart.id],
      };
    },
    builder: {
      transformName: (_, scope) => {
        const currentHelmChart = scope[helmChart.id] as HelmChart | undefined;
        if (!currentHelmChart) {
          return 'Unnamed';
        }
        return currentHelmChart.name;
      },
      getRawItems: scope => {
        const currentHelmChart = scope[helmChart.id] as HelmChart | undefined;
        if (!currentHelmChart) {
          return [];
        }
        return [currentHelmChart];
      },
    },
    itemBlueprint: {
      getName: () => 'Chart.yaml',
      getInstanceId: chart => chart.id,
      rowBuilder: {
        indentation: 0,
        height: 23,
      },
      builder: {
        getMeta: chart => ({
          filePath: chart.filePath,
          itemPrefixIcon: 'file',
        }),
        isSelected: (chart, scope) => {
          return scope.selectedPath === chart.filePath;
        },
        isDisabled: (rawItem, scope) =>
          Boolean((scope.previewValuesFileId && scope.previewValuesFileId !== rawItem.id) || scope.isInClusterMode),
      },
      instanceHandler: {
        onClick: (instance, dispatch) => {
          const filePath: string | undefined = instance.meta?.filePath;
          if (!filePath) {
            return;
          }
          dispatch(selectFile({filePath}));
        },
      },
      customization: {
        prefix: {component: ItemPrefix},
      },
    },
    rowBuilder: {
      indentation: 0,
      fontSize: 14,
    },
    customization: {
      counter: {
        type: 'none',
      },
    },
  };

  return {
    helmChartSectionBlueprint,
    valuesFilesSectionBlueprint,
    previewConfigurationsSectionBlueprint,
    templateFilesSectionBlueprint,
  };
}
