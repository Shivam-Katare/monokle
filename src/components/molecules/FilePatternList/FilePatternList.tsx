import {useEffect, useRef, useState} from 'react';

import {Button, Input, InputRef, Tooltip} from 'antd';

import styled from 'styled-components';

import {TOOLTIP_DELAY} from '@constants/constants';

import {useOnClickOutside} from '@hooks/useOnClickOutside';

import {useFocus} from '@utils/hooks';

import FilePatternListItem from './FilePatternListItem';

type FilePatternListProps = {
  value: string[];
  onChange: (patterns: string[]) => void;
  tooltip: string;
  isSettingsOpened?: boolean;
  showButtonLabel?: string;
  showApplyButton?: boolean;
  onApplyClick?: () => void;
};

const StyledUl = styled.ul`
  padding-left: 20px;
`;

const StyledButton = styled(Button)`
  margin-top: 10px;
  margin-right: 5px;
  margin-bottom: 10px;
`;

const FilePatternList = (props: FilePatternListProps) => {
  const {value, onChange, tooltip, isSettingsOpened, showButtonLabel, showApplyButton, onApplyClick} = props;

  const [isAddingPattern, setIsAddingPattern] = useState<Boolean>(false);
  const [patternInput, setPatternInput] = useState<string>('');
  const [inputRef, focusInput] = useFocus<InputRef>();
  const filePatternInputRef = useRef<any>();

  useOnClickOutside(filePatternInputRef, () => {
    setIsAddingPattern(false);
    setPatternInput('');
  });

  const isPatternUnique = (patternStr: string) => {
    return !value.includes(patternStr);
  };

  const addPattern = () => {
    if (value.includes(patternInput)) {
      return;
    }
    onChange([...value, patternInput]);
    setIsAddingPattern(false);
    setPatternInput('');
  };

  const removePattern = (pattern: string) => {
    onChange(value.filter(p => p !== pattern));
  };

  const updatePattern = (oldPattern: string, newPattern: string) => {
    const index = value.indexOf(oldPattern);
    const left = value.slice(0, index);
    const right = value.slice(index + 1);
    onChange([...left, newPattern, ...right]);
  };

  const onClickCancel = () => {
    setIsAddingPattern(false);
    setPatternInput('');
  };

  useEffect(() => {
    if (isAddingPattern) {
      focusInput();
    }
  }, [isAddingPattern, focusInput]);

  useEffect(() => {
    if (!isSettingsOpened) {
      setIsAddingPattern(false);
      setPatternInput('');
    }
  }, [isSettingsOpened]);

  return (
    <div>
      <StyledUl>
        {value.map(pattern => (
          <FilePatternListItem
            key={pattern}
            pattern={pattern}
            validateInput={isPatternUnique}
            onChange={(oldPattern, newPattern) => updatePattern(oldPattern, newPattern)}
            onRemove={() => removePattern(pattern)}
          />
        ))}
      </StyledUl>
      {isAddingPattern ? (
        <div ref={filePatternInputRef}>
          <Input
            ref={inputRef}
            defaultValue={patternInput}
            onChange={e => setPatternInput(e.target.value)}
            onPressEnter={addPattern}
          />
          <div>
            <StyledButton onClick={addPattern}>OK</StyledButton>
            <StyledButton onClick={onClickCancel}>Cancel</StyledButton>
          </div>
        </div>
      ) : (
        <>
          <Tooltip title={tooltip} mouseEnterDelay={TOOLTIP_DELAY}>
            <Button onClick={() => setIsAddingPattern(true)} style={{marginRight: 10}}>
              {showButtonLabel || 'Add Pattern'}
            </Button>
          </Tooltip>
          {showApplyButton && <Button onClick={onApplyClick}>Apply changes</Button>}
        </>
      )}
    </div>
  );
};

export default FilePatternList;
