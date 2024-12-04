// import React, { useState } from 'react';
import React, { useEffect, useState, useRef } from 'react';
import Select from 'react-select';
import { Button } from '@ohif/ui';
import apiClient from '../../../platform/ui/src/apis/apiClient';
import { OptionEnum } from '../../cornerstone/src/utils/OptionEnum';
import eventEmitter from '../../cornerstone/src/utils/eventEmitter';

interface RunModelProps {
  type?: (typeof OptionEnum)[keyof typeof OptionEnum];
}

const customStyles = {
  control: provided => ({
    ...provided,
    border: '2px solid #007BFF',
    borderRadius: '5px',
    boxShadow: 'none',
    '&:hover': {
      borderColor: '#0056b3',
    },
    padding: '2px',
  }),
  option: (provided, state) => ({
    ...provided,
    fontSize: 14,
    color: state.isSelected ? 'white' : 'blue',
    backgroundColor: state.isSelected ? '#007BFF' : 'white',
    cursor: 'pointer',
  }),
  menu: provided => ({
    ...provided,
    zIndex: 5,
    maxHeight: '300px',
    overflowY: 'auto',
  }),
};

const options = [
  { value: 'studies', label: 'Study' },
  { value: 'series', label: 'Series' },
  { value: 'frames', label: 'Frame' },
];

const RunModel: React.FC<RunModelProps> = ({ type = OptionEnum.Mammo }) => {
  const [toastMessage, setToastMessage] = useState('');
  const [selection, setSelection] = useState<{ value: string; label: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const searchParams = new URLSearchParams(window.location.search);
  const studyInstanceUid = searchParams.get('StudyInstanceUIDs');
  const [displaySets, setDisplaySets] = useState<any>(eventEmitter.getLastDisplaySets());
  const [currentSeriesUid, setCurrentSeriesUid] = useState(null);
  const [currentFrame, setCurrentFrame] = useState('0');

  useEffect(() => {
    // console.log('Initial displaySets on load:', displaySets);
    // console.log('Initial frameindex on load:', currentFrame);
    if (displaySets) {
      setCurrentSeriesUid(displaySets[0]['SeriesInstanceUID']);
    }

    // Handle viewportDataLoaded event
    const handleViewportDataLoaded = (data: any) => {
      if (data) {
        setCurrentSeriesUid(data[0]['SeriesInstanceUID']);
        setDisplaySets(data);
      }
    };

    // Handle frameIndexChanged event
    const handleFrameIndexChanged = (frameIndex: string) => {
      // console.log('Received frameIndex:', frameIndex);
      if (frameIndex) {
        setCurrentFrame(frameIndex);
      }
    };

    // Subscribe to events
    eventEmitter.on('viewportDataLoaded', handleViewportDataLoaded);
    eventEmitter.on('frameIndexChanged', handleFrameIndexChanged);

    // Cleanup subscriptions on component unmount
    return () => {
      eventEmitter.off('viewportDataLoaded', handleViewportDataLoaded);
      eventEmitter.off('frameIndexChanged', handleFrameIndexChanged);
    };
  }, []);

  const handleRunModelsClick = async () => {
    if (!selection) {
      setToastMessage(
        'Please select a scope (studies, series, or frames) before running the model.'
      );
      return;
    }
    let frame = currentFrame;
    let series = currentSeriesUid;
    if (selection.label === 'Study') {
      frame = 'all';
      series = 'all';
    } else if (selection.label === 'Series') {
      frame = 'all';
    }

    setIsLoading(true);

    try {
      switch (type) {
        case OptionEnum.Mammo: {
          const responseMammo = await apiClient.handleModel(
            'MAMMO',
            series,
            frame,
            studyInstanceUid,
            setToastMessage
          );
          console.log('Mammo model processing started:', responseMammo);
          break;
        }
        case OptionEnum.GBC: {
          const responseGBC = await apiClient.handleModel(
            'GBC',
            series,
            frame,
            studyInstanceUid,
            setToastMessage
          );
          console.log('GBC model processing started:', responseGBC);
          break;
        }
        case OptionEnum.XRay: {
          const responseXRay = await apiClient.handleModel(
            'XRay',
            series,
            frame,
            studyInstanceUid,
            setToastMessage
          );
          console.log('X-Ray model processing started:', responseXRay);
          break;
        }
        default: {
          console.log('Unknown model type');
          break;
        }
      }
    } catch (error) {
      console.error('Error occurred while processing the model:', error);
      setToastMessage('An error occurred while processing the model. Please try again.');
    } finally {
      setIsLoading(false); // Set loading to false when process finishes
    }
  };

  return (
    <>
      {toastMessage.length > 0 && (
        <div className="fixed top-16 right-[35%] z-50 rounded bg-gray-800 px-4 py-2 text-xl text-white shadow-lg transition-opacity">
          {toastMessage}
        </div>
      )}
      <h2
        className="mt-1 text-xl font-semibold text-white"
        style={{ marginBottom: '5px' }} // Reduced margin
      >
        Run Models
      </h2>

      <div>
        <div
          className="dropdown-container"
          style={{ marginTop: '5px' }}
        >
          <Select
            id="scopeSelect"
            options={options}
            value={selection}
            onChange={setSelection}
            styles={customStyles}
            placeholder="Run Model On"
            isClearable // Allow clearing the selection
            menuPortalTarget={document.body} // Render the menu outside the parent container
            menuPlacement="auto" // Adjust placement based on available space
          />
        </div>
        <Button
          className="m-2 ml-0"
          onClick={handleRunModelsClick}
          disabled={isLoading} // Disable button when loading
        >
          {isLoading ? 'Processing...' : 'Run'}
        </Button>
        {/* {isLoading && (
          <div
            className="loading-indicator"
            style={{ marginTop: '5px', fontSize: '14px', color: '#555' }}
          >
            Loading...
          </div>
        )}
        {toastMessage && (
          <div
            className="toast-message"
            style={{
              marginTop: '10px',
              padding: '10px',
              backgroundColor: '#f8d7da',
              color: '#721c24',
              borderRadius: '4px',
            }}
          >
            {toastMessage}
          </div>
        )} */}
      </div>
    </>
  );
};

export default RunModel;
