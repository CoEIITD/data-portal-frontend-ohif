import classnames from 'classnames';
import PropTypes from 'prop-types';
import React, { useCallback, useEffect, useState } from 'react';
import Select from 'react-select';
import { OptionEnum } from '../../../../../extensions/cornerstone/src/utils/OptionEnum';

type StyleMap = {
  open: {
    left: { marginLeft: string };
    right: { marginRight: string };
  };
  closed: {
    left: { marginLeft: string };
    right: { marginRight: string };
  };
};
const borderSize = 4;
const collapsedWidth = 25;
const closeIconWidth = 30;

const baseClasses =
  'transition-all duration-300 ease-in-out bg-black border-black justify-start box-content flex flex-col';

const classesMap = {
  open: {
    left: `mr-1`,
    right: `ml-1`,
  },
  closed: {
    left: `mr-2 items-end`,
    right: `ml-2 items-start`,
  },
};

const createStyleMap = (
  expandedWidth: number,
  borderSize: number,
  collapsedWidth: number
): StyleMap => {
  const collapsedHideWidth = expandedWidth - collapsedWidth - borderSize;

  return {
    open: {
      left: { marginLeft: '0px' },
      right: { marginRight: '0px' },
    },
    closed: {
      left: { marginLeft: `-${collapsedHideWidth}px` },
      right: { marginRight: `-${collapsedHideWidth}px` },
    },
  };
};

const createBaseStyle = (expandedWidth: number) => {
  return {
    maxWidth: `${expandedWidth}px`,
    width: `${expandedWidth}px`,
    // To align the top of the side panel with the top of the viewport grid, use position relative and offset the
    // top by the same top offset as the viewport grid. Also adjust the height so that there is no overflow.
    position: 'relative',
    top: '0.2%',
    height: '99.8%',
  };
};
const SidePanelModified = ({
  side,
  className,
  activeTabIndex: activeTabIndexProp = null,
  tabs,
  onOpen,
  expandedWidth = 248,
  onActiveTabIndexChange,
}) => {
  const [panelOpen, setPanelOpen] = useState(activeTabIndexProp !== null);
  const [activeTabIndex, setActiveTabIndex] = useState(0);

  const styleMap = createStyleMap(expandedWidth, borderSize, collapsedWidth);
  const baseStyle = createBaseStyle(expandedWidth);
  const openStatus = 'open';
  const style = Object.assign({}, styleMap[openStatus][side], baseStyle);

  const updatePanelOpen = useCallback(
    (panelOpen: boolean) => {
      setPanelOpen(panelOpen);
      if (panelOpen && onOpen) {
        onOpen();
      }
    },
    [onOpen]
  );

  const updateActiveTabIndex = useCallback(
    (activeTabIndex: number) => {
      if (activeTabIndex === null) {
        updatePanelOpen(false);
        return;
      }

      setActiveTabIndex(activeTabIndex);
      updatePanelOpen(true);

      if (onActiveTabIndexChange) {
        onActiveTabIndexChange({ activeTabIndex });
      }
    },
    [onActiveTabIndexChange, updatePanelOpen]
  );

  useEffect(() => {
    updateActiveTabIndex(activeTabIndexProp);
  }, [activeTabIndexProp, updateActiveTabIndex]);

  const getOneTabComponent = () => {
    return (
      <div
        className={classnames(
          'text-primary-active flex grow cursor-pointer select-none justify-center self-center text-[13px]'
        )}
        style={{
          ...(side === 'left'
            ? { marginLeft: `${closeIconWidth}px` }
            : { marginRight: `${closeIconWidth}px` }),
        }}
        data-cy={`${tabs[0].name}-btn`}
        onClick={() => updatePanelOpen(!panelOpen)}
      ></div>
    );
  };

  const getOpenStateComponent = () => {
    return (
      <div className="bg-primary-dark flex select-none rounded-t pt-1.5 pb-[2px]">
        {getOneTabComponent()}
      </div>
    );
  };

  const customStyles = {
    option: (provided, state) => ({
      ...provided,
      fontSize: 14,
      color: 'blue',
      backgroundColor: state.isSelected ? 'lightblue' : 'white',
    }),
    control: provided => ({
      ...provided,
      border: '2px solid #007BFF',
      borderRadius: '5px',
      boxShadow: 'none',
      '&:hover': {
        borderColor: '#0056b3',
      },
    }),
  };
  const [selectedOption, setSelectedOption] = useState(null);
  useEffect(() => {
    const storedOption = localStorage.getItem('selectedOption');
    if (storedOption) {
      const parsedOption = JSON.parse(storedOption);
      setSelectedOption(parsedOption);
      // Update the active tab index based on the stored option
      handleSelectChange(parsedOption);
    }
  }, []);

  const handleSelectChange = selected => {
    setSelectedOption(selected);
    localStorage.setItem('selectedOption', JSON.stringify(selected));
    switch (selected?.value) {
      case OptionEnum.Mammo:
        updateActiveTabIndex(0);
        break;
      case OptionEnum.GBC:
        updateActiveTabIndex(1);
        break;
      case OptionEnum.XRay:
        updateActiveTabIndex(2);
        break;
      default:
        updateActiveTabIndex(2);
        break;
    }
  };

  return (
    <div
      className={classnames(className, baseClasses, classesMap[openStatus][side])}
      style={style}
    >
      {/* Always render left panel content if side is 'left' */}
      {side === 'left' && (
        <>
          {getOpenStateComponent()}
          {tabs[0] && React.createElement(tabs[0].content)}
        </>
      )}

      {/* Render the right side with Select component */}
      {side === 'right' && (
        <>
          <Select
            options={[
              { value: 'Mammo', label: 'Mammo' },
              { value: 'GBC', label: 'GBC' },
              { value: 'X-Ray', label: 'X-Ray' },
            ]}
            styles={customStyles}
            onChange={handleSelectChange}
            value={selectedOption}
          />
          {selectedOption && (
            <>
              {getOpenStateComponent()}
              {tabs.map((tab, tabIndex) =>
                tabIndex === activeTabIndex ? <tab.content key={tabIndex} /> : null
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};

SidePanelModified.propTypes = {
  side: PropTypes.oneOf(['left', 'right']).isRequired,
  className: PropTypes.string,
  activeTabIndex: PropTypes.number,
  tabs: PropTypes.oneOfType([
    PropTypes.arrayOf(
      PropTypes.shape({
        iconName: PropTypes.string.isRequired,
        iconLabel: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
        label: PropTypes.string.isRequired,
        content: PropTypes.func, // TODO: Should be node, but it keeps complaining?
      })
    ),
  ]),
  onOpen: PropTypes.func,
  onActiveTabIndexChange: PropTypes.func,
  expandedWidth: PropTypes.number,
};

export default SidePanelModified;
