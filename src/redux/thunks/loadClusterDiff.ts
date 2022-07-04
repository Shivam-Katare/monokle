import {createAsyncThunk} from '@reduxjs/toolkit';

import {flatten} from 'lodash';

import {CLUSTER_DIFF_PREFIX, YAML_DOCUMENT_DELIMITER_NEW_LINE} from '@constants/constants';

import {AlertEnum, AlertType} from '@models/alert';
import {AppDispatch} from '@models/appdispatch';
import {ResourceMapType} from '@models/appstate';
import {RootState} from '@models/rootstate';

import {currentKubeContext, kubeConfigPathSelector} from '@redux/selectors';
import getClusterObjects from '@redux/services/getClusterObjects';
import {extractK8sResources} from '@redux/services/resource';

import {createKubeClient} from '@utils/kubeclient';
import {CLUSTER_COMPARE, trackEvent} from '@utils/telemetry';

import {createRejectionWithAlert} from './utils';

export type LoadClusterDiffPayload = {
  resourceMap?: ResourceMapType;
  alert?: AlertType;
};

const CLUSTER_DIFF_FAILED = 'Cluster Compare Failed';

export const loadClusterDiff = createAsyncThunk<
  LoadClusterDiffPayload,
  undefined,
  {
    dispatch: AppDispatch;
    state: RootState;
  }
>('main/loadClusterDiff', async (_, thunkAPI) => {
  const state = thunkAPI.getState();
  if (!state.ui.isClusterDiffVisible) {
    return;
  }
  try {
    const kubeConfigPath = kubeConfigPathSelector(state);
    const currentContext = currentKubeContext(state.config);
    const clusterAccess = state.config.projectConfig?.clusterAccess?.filter(ca => ca.context === currentContext) || [];
    const kc = createKubeClient(kubeConfigPath, currentContext);
    try {
      const res = clusterAccess.length
        ? await Promise.all(clusterAccess.map(ca => getClusterObjects(kc, ca.namespace)))
        : await getClusterObjects(kc);
      const results = flatten(res);
      const fulfilledResults = results.filter(r => r.status === 'fulfilled' && r.value);

      if (fulfilledResults.length === 0) {
        trackEvent(CLUSTER_COMPARE, {
          // @ts-ignore
          fail: results[0].reason ? results[0].reason.toString() : JSON.stringify(results[0]),
        });
        return createRejectionWithAlert(
          thunkAPI,
          CLUSTER_DIFF_FAILED,
          // @ts-ignore
          results[0].reason ? results[0].reason.toString() : JSON.stringify(results[0])
        );
      }

      // @ts-ignore
      const allYaml = fulfilledResults.map(r => r.value).join(YAML_DOCUMENT_DELIMITER_NEW_LINE);
      const resources = extractK8sResources(allYaml, CLUSTER_DIFF_PREFIX + String(kc.currentContext));
      const resourceMap = resources.reduce((rm: ResourceMapType, r) => {
        rm[r.id] = r;
        return rm;
      }, {});

      if (fulfilledResults.length < results.length) {
        const rejectedResult = results.find(r => r.status === 'rejected');
        if (rejectedResult) {
          // @ts-ignore
          const reason = rejectedResult.reason ? rejectedResult.reason.toString() : JSON.stringify(rejectedResult);

          const alert = {
            title: 'Cluster Diff',
            message: `Failed to get all cluster resources: ${reason}`,
            type: AlertEnum.Warning,
          };

          trackEvent(CLUSTER_COMPARE, {numberOfResourcesBeingCompared: Object.keys(resourceMap).length, fail: reason});

          return {resourceMap, alert};
        }
      }
      trackEvent(CLUSTER_COMPARE, {numberOfResourcesBeingCompared: Object.keys(resourceMap).length});
      return {resourceMap};
    } catch (reason: any) {
      trackEvent(CLUSTER_COMPARE, {fail: reason.message});
      return createRejectionWithAlert(thunkAPI, CLUSTER_DIFF_FAILED, reason.message);
    }
  } catch (e: any) {
    trackEvent(CLUSTER_COMPARE, {fail: e.message});
    return createRejectionWithAlert(thunkAPI, CLUSTER_DIFF_FAILED, e.message);
  }
});
