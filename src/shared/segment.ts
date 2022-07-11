import Analytics from 'analytics-node';
import log from 'loglevel';

import electronStore from './electronStore';
import {ensureMainThread} from './thread';

let client: Analytics | undefined;

const disableTracking = Boolean(electronStore.get('appConfig.disableEventTracking'));

ensureMainThread();

export const getSegmentClient = () => client;

export const enableSegment = () => {
  if (process.env.SEGMENT_API_KEY && !client) {
    log.info('Enabled Segment');
    client = new Analytics(process.env.SEGMENT_API_KEY, {flushAt: 1});
  }
};

export const disableSegment = () => {
  client = undefined;
};

if (!disableTracking) {
  enableSegment();
}
