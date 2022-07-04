import fs from 'fs';
import path from 'path';
import {promisify} from 'util';
import {v4 as uuidv4} from 'uuid';

import {AppDispatch} from '@models/appdispatch';
import {K8sResource} from '@models/k8sresource';

import {extractObjectsFromYaml} from '@redux/services/manifest-utils';
import {interpolateTemplate} from '@redux/services/templates';
import {createUnsavedResource} from '@redux/services/unsavedResource';

import {CommandOptions, runCommandInMainThread} from '@utils/commands';

const fsWriteFilePromise = promisify(fs.writeFile);
const fsReadFilePromise = promisify(fs.readFile);

/**
 * Thunk to preview a Helm Chart
 */

export const previewReferencedHelmChart = async (
  chartName: string,
  chartVersion: string,
  chartRepo: string,
  valuesFilePath: string,
  formsData: any[],
  kubeconfigPath: string,
  kubeconfigContext: string,
  userTempDir: string,
  dispatch: AppDispatch
) => {
  const valuesFileContent = await fsReadFilePromise(valuesFilePath, 'utf8');
  const newTempValuesFilePath = path.join(userTempDir, uuidv4());
  const parsedValuesFileContent: string = await interpolateTemplate(valuesFileContent, formsData);
  await fsWriteFilePromise(newTempValuesFilePath, parsedValuesFileContent);

  const options: CommandOptions = {
    commandId: uuidv4(),
    cmd: 'helm',
    args: [
      'install',
      '--kube-context',
      kubeconfigContext,
      '-f',
      `"${newTempValuesFilePath}"`,
      '--repo',
      chartRepo,
      chartName,
      '--version',
      chartVersion,
      '--generate-name',
      '--dry-run',
    ],
    env: {KUBECONFIG: kubeconfigPath},
  };

  const result = await runCommandInMainThread(options);

  if (result.error) {
    throw new Error(result.error);
  }

  const createdResources: K8sResource[] = [];
  const {stdout} = result;
  if (typeof stdout === 'string') {
    const [yamlOutput, notes] = stdout.split('NOTES:');
    const objects = extractObjectsFromYaml(yamlOutput);
    objects.forEach(obj => {
      const resource = createUnsavedResource(
        {
          name: obj.metadata.name,
          kind: obj.kind,
          apiVersion: obj.apiVersion,
        },
        dispatch,
        obj
      );
      createdResources.push(resource);
    });

    return {message: notes.length > 0 ? notes : 'Done.', resources: createdResources};
  }

  return {message: 'Done.', resources: createdResources};
};
