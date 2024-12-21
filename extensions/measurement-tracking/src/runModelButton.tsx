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
    border: '2px solid #00FF7FF',
    borderRadius: '5px',
    boxShadow: 'none',
    '&:hover': {
      borderColor: '#0056b3',
    },
  }),
  option: (provided, state) => ({
    ...provided,
    fontSize: 14,
    color: 'black',
    backgroundColor: state.isSelected ? 'lightblue' : 'white',
  }),
  menu: provided => ({
    ...provided,
    zIndex: 5,
    maxHeight: '300px',
    overflowY: 'auto',
  }),
};

//Options bases on the type
const getOptionsByType = (type?: RunModelProps['type']) => {
  switch (type) {
    case OptionEnum.Mammo:
      return [
        { value: 'study', label: 'All views' },
        { value: 'series', label: 'Current View' },
      ];
    case OptionEnum.GBC:
      return [
        { value: 'study', label: 'All Frames' },
        { value: 'frame', label: 'Current Frame' },
      ];
    default:
      return [
        { value: 'study', label: 'Study' },
        { value: 'series', label: 'Series' },
        { value: 'frames', label: 'Frame' },
      ];
  }
};

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
      setToastMessage('Please select a scope (study, series, or frames) before running the model.');
      return;
    }

    let frame = currentFrame;
    let series = currentSeriesUid;

    frame = (parseInt(frame) + 1).toString();
    if (selection.value === 'study') {
      frame = 'all';
      if (type !== OptionEnum.GBC) {
        series = 'all';
      }
    } else if (selection.value === 'series') {
      frame = 'all';
    }

    setIsLoading(true);

    try {
      switch (type) {
        case OptionEnum.Mammo: {
          const response = await apiClient.handleModel(
            'MAMMO',
            series,
            frame,
            studyInstanceUid,
            setToastMessage
          );
          console.log('Mammo model processing started:', response);
          break;
        }
        case OptionEnum.GBC: {
          const response = await apiClient.handleModel(
            'GBC',
            series,
            frame,
            studyInstanceUid,
            setToastMessage
          );
          console.log('GBC model processing started:', response);
          break;
        }
        case OptionEnum.XRay: {
          const response = await apiClient.handleModel(
            'CXR',
            series,
            frame,
            studyInstanceUid,
            setToastMessage
          );
          console.log('X-Ray model processing started:', response);
          break;
        }
        default:
          console.log('Unknown model type');
      }
    } catch (error) {
      console.error('Error occurred while processing the model:', error);
      setToastMessage('An error occurred while processing the model. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {toastMessage && (
        <div className="fixed top-16 right-[35%] z-50 rounded bg-gray-800 px-4 py-2 text-xl text-white shadow-lg transition-opacity">
          {toastMessage}
        </div>
      )}
      <h2
        className="mt-1 text-xl font-semibold text-white"
        style={{ marginBottom: '5px' }}
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
            options={getOptionsByType(type)}
            value={selection}
            onChange={setSelection}
            styles={customStyles}
            placeholder="Run Model On"
            isClearable
            menuPortalTarget={document.body}
            menuPlacement="auto"
          />
        </div>
        <Button
          className="m-2 ml-0"
          onClick={handleRunModelsClick}
          disabled={isLoading}
        >
          {isLoading ? 'Processing...' : 'Run'}
        </Button>
      </div>
    </>
  );
};

export default RunModel;
