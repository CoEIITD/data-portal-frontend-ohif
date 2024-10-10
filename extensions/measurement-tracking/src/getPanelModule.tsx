import { Types } from '@ohif/core';
import {
  PanelMeasurementTableTracking,
  PanelStudyBrowserTracking,
  GbcPanel,
  MammoPanel,
  XRayPanel,
} from './panels';
import i18n from 'i18next';
import React from 'react';

// TODO:
// - No loading UI exists yet
// - cancel promises when component is destroyed
// - show errors in UI for thumbnails if promise fails

function getPanelModule({ commandsManager, extensionManager, servicesManager }): Types.Panel[] {
  return [
    {
      name: 'seriesList',
      iconName: 'tab-studies',
      iconLabel: 'Studies',
      label: i18n.t('SidePanel:Studies'),
      component: props => (
        <PanelStudyBrowserTracking
          {...props}
          commandsManager={commandsManager}
          extensionManager={extensionManager}
          servicesManager={servicesManager}
        />
      ),
    },

    {
      name: 'trackedMeasurements',
      iconName: 'tab-linear',
      iconLabel: 'Measure',
      label: i18n.t('SidePanel:Measurements'),
      component: props => (
        <PanelMeasurementTableTracking
          {...props}
          commandsManager={commandsManager}
          extensionManager={extensionManager}
          servicesManager={servicesManager}
        />
      ),
    },
    {
      name: 'gbcPanel',
      iconName: 'tab-linear',
      iconLabel: 'Measure',
      label: i18n.t('SidePanel:Measurements'),
      component: GbcPanel.bind(null, {
        commandsManager,
        extensionManager,
        servicesManager,
      }),
    },
    {
      name: 'MammoPanel',
      iconName: 'tab-linear',
      iconLabel: 'Measure',
      label: i18n.t('SidePanel:Measurements'),
      component: MammoPanel.bind(null, {
        commandsManager,
        extensionManager,
        servicesManager,
      }),
    },
    {
      name: 'XRayPanel',
      iconName: 'tab-linear',
      iconLabel: 'Measure',
      label: i18n.t('SidePanel:Measurements'),
      component: XRayPanel.bind(null, {
        commandsManager,
        extensionManager,
        servicesManager,
      }),
    },
  ];
}

export default getPanelModule;
