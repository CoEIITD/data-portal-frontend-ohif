import React, { useState } from 'react';
import { Select, Icon, Dropdown, Tooltip } from '../../components';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { globalServicesManager as servicesManager } from '../../../../app/src/appInit';
import * as cornerstone from '@cornerstonejs/core';
import {
  Types,
  Enums,
  getEnabledElementByViewportId,
  VolumeViewport,
  utilities,
  StackViewport,
  imageLoader,
} from '@cornerstonejs/core';
import { utilities as csUtils } from '@cornerstonejs/core';
import { eventTarget, EVENTS } from '@cornerstonejs/core';
import {
  Enums as csToolsEnums,
  segmentation as cstSegmentation,
  Types as cstTypes,
  utilities as cstUtils,
} from '@cornerstonejs/tools';

// import App, { commandsManager, extensionManager, servicesManager } from '../../../../app/src/App';
function SegmentationDropDownRow({
  segmentations = [],
  activeSegmentation,
  onActiveSegmentationChange,
  disableEditing = false,
  onToggleSegmentationVisibility,
  onSegmentationEdit,
  onSegmentationDownload,
  onSegmentationDownloadRTSS,
  storeSegmentation,
  onSegmentationDelete,
  onSegmentationAdd,
  addSegmentationClassName,
}) {
  const handleChange = option => {
    onActiveSegmentationChange(option.value); // Notify the parent
  };

  const [loading, setLoading] = useState(false);
  const [forwardSlices, setForwardSlices] = useState('5');
  const [backwardSlices, setBackwardSlices] = useState('0');
  const forwardSlicesCount = forwardSlices ? parseInt(forwardSlices, 10) : 5;
  const backwardSlicesCount = backwardSlices ? parseInt(backwardSlices, 10) : 0;

  const isDisabled = (!forwardSlices && !backwardSlices) || loading;

  // const [loading2, setLoading2] = useState(false);
  const handleClick = async () => {
    setLoading(true);

    try {
      const { segmentationService, viewportGridService } = servicesManager.services;
      const { activeViewportId } = viewportGridService.getState();
      const { viewport } = getEnabledElementByViewportId(activeViewportId) || {};
      const imageId = viewport.getCurrentImageId();
      const sliceID = viewport.getCurrentImageIdIndex();
      const segmentationId = activeSegmentation.id;

      const labelmapVolume = segmentationService.getLabelmapVolume(segmentationId);
      const { dimensions } = labelmapVolume;
      const scalarData = labelmapVolume.getScalarData();
      const width = dimensions[0];
      const height = dimensions[1];
      const generalSeriesModule = cornerstone.metaData.get('generalSeriesModule', imageId);
      const studyInstanceUID = generalSeriesModule.studyInstanceUID;
      const seriesDescription =
        generalSeriesModule.seriesDescription || activeSegmentation.description;

      console.log(`Current Slice ID: ${sliceID}`);
      console.log(`Segmentation ID: ${segmentationId}`);
      console.log(`Study Instance UID : ${studyInstanceUID}`);
      console.log('GeneralSeriesModule:', generalSeriesModule);
      console.log(`Series Description : ${seriesDescription}`);

      const forwardSliceCount = forwardSlices ? parseInt(forwardSlices, 10) : 5;
      const backwardSliceCount = backwardSlices ? parseInt(backwardSlices, 10) : 0;

      const slicesPixelData = [];

      // Forward slicing (defaults to 5 if empty)
      for (let i = 0; i < forwardSliceCount; i++) {
        const currentSliceIndex = sliceID - i;
        if (currentSliceIndex < 0) break;

        const startIndex = currentSliceIndex * width * height;
        const slicePixelData = scalarData.slice(startIndex, startIndex + width * height);
        slicesPixelData.push({
          sliceIndex: currentSliceIndex,
          pixelData: Array.from(slicePixelData),
          studyInstanceUID,
          generalSeriesModule,
          seriesDescription,
          forwardSlices: forwardSlicesCount,
          backwardSlices: backwardSlicesCount,
        });
      }

      // Backward slicing
      for (let i = 1; i <= backwardSliceCount; i++) {
        const currentSliceIndex = sliceID + i;
        if (currentSliceIndex >= dimensions[2]) break;

        const startIndex = currentSliceIndex * width * height;
        const slicePixelData = scalarData.slice(startIndex, startIndex + width * height);
        slicesPixelData.push({
          sliceIndex: currentSliceIndex,
          pixelData: Array.from(slicePixelData),
          studyInstanceUID,
          generalSeriesModule,
          seriesDescription,
          forwardSlices: forwardSlicesCount - i,
          backwardSlices: backwardSlicesCount - i,
        });
      }
      const response = await mockApiCallForSegmentation(slicesPixelData);
      const segmentation_data = response.segmentation_data;

      if (!segmentation_data || !Array.isArray(segmentation_data)) {
        console.error('Invalid segmentation_data format:', segmentation_data);
        throw new Error('Invalid segmentation data');
      }

      segmentation_data.forEach(({ sliceIndex, maskData }) => {
        const startIndex = sliceIndex * width * height;
        for (let i = 0; i < maskData.length; i++) {
          scalarData[startIndex + i] = maskData[i];
        }
      });

      const eventDetail = { segmentationId };
      const event = new CustomEvent(csToolsEnums.Events.SEGMENTATION_DATA_MODIFIED, {
        detail: eventDetail,
      });
      eventTarget.dispatchEvent(event);

      const segmentation = segmentationService.getSegmentation(segmentationId);
      if (!segmentation) {
        console.error('Segmentation not found!');
        return;
      }

      segmentationService._broadcastEvent(segmentationService.EVENTS.SEGMENTATION_DATA_MODIFIED, {
        segmentation,
      });
    } catch (error) {
      console.error('Error during interactive segmentation:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClick2 = async () => {
    setLoading(true);

    if (!servicesManager || !servicesManager.services) {
      console.error('servicesManager or servicesManager.services is undefined');
      setLoading(false);
      return;
    }

    const { segmentationService, viewportGridService } = servicesManager.services;
    const { activeViewportId } = viewportGridService.getState();
    const { viewport } = getEnabledElementByViewportId(activeViewportId) || {};
    const imageId = viewport.getCurrentImageId();
    const sliceID = viewport.getCurrentImageIdIndex();

    const segmentationId = activeSegmentation.id;

    console.log(`imageID: ${imageId}  sliceID: ${sliceID}`);
    console.log(`Seg_ID: ${segmentationId}`);

    try {
      const image = await imageLoader.loadAndCacheImage(imageId);
      const pixelData = image.getPixelData();

      const pixelDataArray = Array.from(pixelData);

      const response = await fetch('http://localhost:8000/api/segment-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pixelData: pixelDataArray }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok: ' + response.statusText);
      }

      const { segmentation_data } = await response.json();
      console.log('Segmentation Data:', segmentation_data);

      const labelmapVolume = segmentationService.getLabelmapVolume(segmentationId);
      const { dimensions } = labelmapVolume;
      const scalarData = labelmapVolume.getScalarData();
      const width = dimensions[0];
      const height = dimensions[1];

      if (segmentation_data.length !== width * height) {
        console.error(
          `Segmentation data size (${segmentation_data.length}) does not match labelmap dimensions (${width * height})`
        );
        return;
      }

      const startIndex = sliceID * width * height;

      for (let i = 0; i < segmentation_data.length; i++) {
        scalarData[startIndex + i] = segmentation_data[i];
      }

      const updatedSegmentSlice = scalarData.slice(startIndex, startIndex + width * height);
      console.log('Updated Segment Slice:', updatedSegmentSlice);

      const eventDetail = { segmentationId: segmentationId };
      const event = new CustomEvent(csToolsEnums.Events.SEGMENTATION_DATA_MODIFIED, {
        detail: eventDetail,
      });
      eventTarget.dispatchEvent(event);

      const segmentation = segmentationService.getSegmentation(segmentationId);

      if (segmentation === undefined) {
        console.error('Segmentation not found!');
        return;
      }

      segmentationService._broadcastEvent(segmentationService.EVENTS.SEGMENTATION_DATA_MODIFIED, {
        segmentation,
      });
    } catch (error) {
      console.error('Error fetching segmentation data:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectOptions = segmentations.map(s => ({
    value: s.id,
    label: s.label,
  }));
  const { t } = useTranslation('SegmentationTable');

  if (!activeSegmentation) {
    return null;
  }

  return (
    <div className="mb-2">
      <div
        className="flex items-center space-x-2"
        onClick={e => {
          e.stopPropagation();
        }}
      >
        <div className="hover:bg-secondary-dark grid h-[28px] w-[28px] cursor-pointer place-items-center rounded-[4px]">
          <Dropdown
            id="segmentation-dropdown"
            showDropdownIcon={false}
            alignment="left"
            itemsClassName={`text-primary-active ${addSegmentationClassName}`}
            showBorders={false}
            maxCharactersPerLine={30}
            list={[
              ...(!disableEditing
                ? [
                    {
                      title: t('Add new segmentation'),
                      onClick: () => {
                        onSegmentationAdd();
                      },
                    },
                  ]
                : []),
              ...(!disableEditing
                ? [
                    {
                      title: t('Rename'),
                      onClick: () => {
                        onSegmentationEdit(activeSegmentation.id);
                      },
                    },
                  ]
                : []),
              {
                title: t('Delete'),
                onClick: () => {
                  onSegmentationDelete(activeSegmentation.id);
                },
              },
              ...(!disableEditing
                ? [
                    {
                      title: t('Export DICOM SEG'),
                      onClick: () => {
                        storeSegmentation(activeSegmentation.id);
                      },
                    },
                  ]
                : []),
              ...[
                {
                  title: t('Download DICOM SEG'),
                  onClick: () => {
                    onSegmentationDownload(activeSegmentation.id);
                  },
                },
                {
                  title: t('Download DICOM RTSTRUCT'),
                  onClick: () => {
                    onSegmentationDownloadRTSS(activeSegmentation.id);
                  },
                },
              ],
            ]}
          >
            <div className="hover:bg-secondary-dark grid h-[28px] w-[28px] cursor-pointer place-items-center rounded-[4px]">
              <Icon name="icon-more-menu"></Icon>
            </div>
          </Dropdown>
        </div>
        {selectOptions?.length && (
          <Select
            id="segmentation-select"
            isClearable={false}
            onChange={handleChange}
            components={{
              DropdownIndicator: () => (
                <Icon
                  name={'chevron-down-new'}
                  className="mr-2"
                />
              ),
            }}
            isSearchable={false}
            options={selectOptions}
            value={selectOptions?.find(o => o.value === activeSegmentation.id)}
            className="text-aqua-pale h-[26px] w-1/2 text-[13px]"
          />
        )}
        <div>
          <div className="mb-2 flex h-[28px] items-center space-y-2">
            <div className="flex items-center">
              <Tooltip
                position="bottom-right"
                content={
                  <div className="flex flex-col">
                    <div className="text-[13px] text-white">Series:</div>
                    <div className="text-aqua-pale text-[13px]">
                      {activeSegmentation.description}
                    </div>
                  </div>
                }
              >
                <Icon
                  name="info-action"
                  className="text-primary-active"
                />
              </Tooltip>
            </div>
            <div
              className="hover:bg-secondary-dark mr-1 grid h-[28px] w-[28px] cursor-pointer place-items-center rounded-[4px]"
              onClick={() => onToggleSegmentationVisibility(activeSegmentation.id)}
            >
              {activeSegmentation.isVisible ? (
                <Icon
                  name="row-shown"
                  className="text-primary-active"
                />
              ) : (
                <Icon
                  name="row-hidden"
                  className="text-primary-active"
                />
              )}
            </div>
            {/* New Button */}
            <div
              className={`flex h-[28px] w-[28px] items-center justify-center hover:cursor-pointer ${
                loading ? 'pointer-events-none opacity-50' : 'hover:opacity-60'
              }`}
              onClick={e => {
                e.stopPropagation();
                if (!loading) {
                  handleClick();
                }
              }}
            >
              <svg
                fill="#5ccaed"
                height="17px"
                width="17px"
                version="1.1"
                id="Icons"
                xmlns="http://www.w3.org/2000/svg"
                xmlnsXlink="http://www.w3.org/1999/xlink"
                viewBox="0 0 32 32"
                xmlSpace="preserve"
              >
                <g>
                  <path
                    d="M16.5,19.9C16.5,19.9,16.5,19.9,16.5,19.9l3.1-3.1c0,0,0,0,0,0l2.3-2.3c2.2,0.6,4.5,0,6.2-1.6c1.8-1.8,2.3-4.4,1.4-6.8
                c-0.1-0.3-0.4-0.5-0.7-0.6c-0.3-0.1-0.7,0-0.9,0.3L25.6,8l-1.3-0.3L24,6.4l2.2-2.2c0.2-0.2,0.3-0.6,0.3-0.9
                c-0.1-0.3-0.3-0.6-0.6-0.7c-2.3-0.9-5-0.4-6.8,1.4c-1.6,1.6-2.2,4-1.6,6.2l-1.6,1.6l-2.6-2.6L11,5.3c-0.1-0.1-0.2-0.3-0.3-0.3
                L6.8,2.7C6.4,2.4,5.9,2.5,5.5,2.8L2.5,5.9C2.1,6.2,2.1,6.7,2.3,7.1L4.6,11c0.1,0.1,0.2,0.3,0.3,0.3l3.7,2.2l2.6,2.6l-1.2,1.2
                c-2.2-0.6-4.5,0-6.2,1.6c-1.8,1.8-2.3,4.4-1.4,6.8c0.1,0.3,0.4,0.5,0.7,0.6c0.3,0.1,0.7,0,0.9-0.3L6.4,24l1.3,0.3L8,25.6l-2.2,2.2
                c-0.2,0.2-0.3,0.6-0.3,0.9c0.1,0.3,0.3,0.6,0.6,0.7c0.8,0.3,1.5,0.4,2.3,0.4c1.6,0,3.3-0.6,4.5-1.9c1.6-1.6,2.2-4,1.6-6.2
                L16.5,19.9z"
                  />
                  <path d="M22.5,16.8l-6,6l6.1,6.1c0.8,0.8,1.9,1.3,3,1.3s2.2-0.4,3-1.3c0.8-0.8,1.3-1.9,1.3-3c0-1.1-0.4-2.2-1.3-3L22.5,16.8z" />
                </g>
              </svg>
            </div>
            {/* New Button 2222 */}
            <div
              className={`flex h-[28px] w-[28px] items-center justify-center hover:cursor-pointer ${
                loading ? 'pointer-events-none opacity-50' : 'hover:opacity-60'
              }`}
              onClick={e => {
                e.stopPropagation();
                if (!loading) {
                  handleClick2();
                }
              }}
            >
              <svg
                fill="#5ccaed"
                height="17px"
                width="17px"
                version="1.1"
                id="Icons"
                xmlns="http://www.w3.org/2000/svg"
                xmlnsXlink="http://www.w3.org/1999/xlink"
                viewBox="0 0 32 32"
                xmlSpace="preserve"
              >
                <path
                  d="M28.7,6.7c-0.1-0.3-0.4-0.5-0.7-0.6c-0.3-0.1-0.7,0-0.9,0.3l-2,2l-1.1-0.3L23.6,7l2-2c0.2-0.2,0.3-0.6,0.3-0.9
          c-0.1-0.3-0.3-0.6-0.6-0.7C23,2.5,20.5,3,18.8,4.7c-1.5,1.5-2.1,3.7-1.5,5.8l-6.8,6.8c-2.1-0.6-4.3,0-5.8,1.5
          C3,20.5,2.5,23,3.3,25.3c0.1,0.3,0.4,0.5,0.7,0.6c0.3,0.1,0.7,0,0.9-0.3l2-2l1.1,0.3L8.4,25l-2,2c-0.2,0.2-0.3,0.6-0.3,0.9
          c0.1,0.3,0.3,0.6,0.6,0.7c0.7,0.3,1.5,0.4,2.2,0.4c1.6,0,3.1-0.6,4.2-1.8c1.5-1.5,2.1-3.7,1.5-5.8l6.8-6.8c2.1,0.6,4.3,0,5.8-1.5
          C29,11.5,29.5,9,28.7,6.7z"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-col space-y-2">
        <div>
          <label className="text-xs text-white">Forward Slice:</label>
          <input
            type="number"
            min="1"
            value={forwardSlices}
            onChange={e => setForwardSlices(Number(e.target.value))}
            className="w-full rounded border p-1 text-black"
          />
        </div>
        <div>
          <label className="text-xs text-white">Backward Slice:</label>
          <input
            type="number"
            min="1"
            value={backwardSlices}
            onChange={e => setBackwardSlices(Number(e.target.value))}
            className="w-full rounded border p-1 text-black"
          />
        </div>
      </div>
    </div>
  );
}

SegmentationDropDownRow.propTypes = {
  servicesManager: PropTypes.object,
  segmentations: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
    })
  ).isRequired,
  activeSegmentation: PropTypes.shape({
    id: PropTypes.string.isRequired,
    isVisible: PropTypes.bool.isRequired,
  }),
  onActiveSegmentationChange: PropTypes.func.isRequired,
  disableEditing: PropTypes.bool,
  onToggleSegmentationVisibility: PropTypes.func,
  onSegmentationEdit: PropTypes.func,
  onSegmentationDownload: PropTypes.func,
  onSegmentationDownloadRTSS: PropTypes.func,
  storeSegmentation: PropTypes.func,
  onSegmentationDelete: PropTypes.func,
  onSegmentationAdd: PropTypes.func,
};

const mockApiCallForSegmentation = async slicesPixelData => {
  return new Promise(resolve => {
    setTimeout(() => {
      const mockSegmentationData = slicesPixelData.map(slice => ({
        sliceIndex: slice.sliceIndex,
        maskData: Array(slice.pixelData.length).fill(1), // Mock mask data (all 1s)
      }));
      resolve({ segmentation_data: mockSegmentationData });
    }, 1000); // Simulate network delay
  });
};

export default SegmentationDropDownRow;
