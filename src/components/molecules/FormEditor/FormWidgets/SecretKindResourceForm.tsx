import React, {useEffect, useState} from 'react';
import {useDebounce} from 'react-use';

import {Button, Input, Select} from 'antd';

import {DeleteOutlined} from '@ant-design/icons';

import _ from 'lodash';
import {v4 as uuidv4} from 'uuid';

import {DEFAULT_EDITOR_DEBOUNCE} from '@constants/constants';

import * as S from './SecretKindResourceForm.styled';

import {SelectStyled} from './styled';

const Option = Select.Option;
const {TextArea} = Input;

const secretTypes = [
  'Opaque',
  'kubernetes.io/service-account-token',
  'kubernetes.io/dockercfg',
  'kubernetes.io/dockerconfigjson',
  'kubernetes.io/basic-auth',
  'kubernetes.io/ssh-auth',
  'kubernetes.io/tls',
  'bootstrap.kubernetes.io/token',
];

export const SecretKindResourceForm = ({onChange, formData, disabled}: any) => {
  const [dataKeyValuePairs, setDataKeyValuePairs] = useState<{id: string; key: string; value: string}[]>([]);
  const [stringDataKeyValuePairs, setStringDataKeyValuePairs] = useState<{id: string; key: string; value: string}[]>(
    []
  );
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const handleTypeChange = (value: any) => {
    if (formData.type !== value) {
      onChange({...formData, type: value, data: undefined, stringData: undefined});
      setDataKeyValuePairs([]);
      setStringDataKeyValuePairs([]);
    }
  };

  useEffect(() => {
    if (formData.data && _.isObject(formData.data)) {
      const newDataKeyValuePairs = Object.keys(formData.data).map(key => ({
        key,
        value: formData.data[key],
      }));

      if (
        !_.isEqual(
          _.sortBy(
            dataKeyValuePairs.map(p => ({key: p.key, value: p.value})),
            'key'
          ),
          _.sortBy(newDataKeyValuePairs, 'key')
        )
      ) {
        setDataKeyValuePairs(newDataKeyValuePairs.map(p => ({...p, id: uuidv4()})));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.data, formData.metadata?.name]);

  useEffect(() => {
    if (formData.stringData && _.isObject(formData.stringData)) {
      const newStringDataKeyValuePairs = Object.keys(formData.stringData).map(key => ({
        key,
        value: formData.stringData[key],
      }));

      if (
        !_.isEqual(
          _.sortBy(
            stringDataKeyValuePairs.map(p => ({key: p.key, value: p.value})),
            'key'
          ),
          _.sortBy(newStringDataKeyValuePairs, 'key')
        )
      ) {
        setStringDataKeyValuePairs(newStringDataKeyValuePairs.map(p => ({...p, id: uuidv4()})));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.stringData, formData.metadata?.name]);

  useEffect(() => {
    const emptyObject: any = {};

    if (!isInitialLoad) {
      const data = dataKeyValuePairs.reduce((object, value) => {
        object[value.key] = value.value;
        return object;
      }, emptyObject);
      if (!_.isEqual(formData.data, data)) {
        onChange({
          ...formData,
          stringData: undefined,
          data: data || undefined,
        });
      }
    }
    setIsInitialLoad(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataKeyValuePairs]);

  useEffect(() => {
    const emptyObject: any = {};

    if (!isInitialLoad) {
      const stringData = stringDataKeyValuePairs.reduce((object, value) => {
        object[value.key] = value.value;
        return object;
      }, emptyObject);
      if (!_.isEqual(formData.stringData, stringData)) {
        onChange({
          ...formData,
          data: undefined,
          stringData: stringData || undefined,
        });
      }
    }
    setIsInitialLoad(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stringDataKeyValuePairs]);

  const handleKeyValuePairFormChange = (key: string, value: {id: string; key: string; value: string}) => {
    if (key === 'stringData') {
      const keyValuePairIndex = stringDataKeyValuePairs.findIndex(pair => pair.id === value.id);
      if (keyValuePairIndex > -1) {
        stringDataKeyValuePairs[keyValuePairIndex].key = value.key;
        stringDataKeyValuePairs[keyValuePairIndex].value = value.value;
        setStringDataKeyValuePairs([...stringDataKeyValuePairs]);
      } else {
        setStringDataKeyValuePairs([...stringDataKeyValuePairs, {id: value.id, key: value.key, value: value.value}]);
      }
    }
    if (key === 'data') {
      const keyValuePairIndex = dataKeyValuePairs.findIndex(pair => pair.id === value.id);
      if (keyValuePairIndex > -1) {
        dataKeyValuePairs[keyValuePairIndex].key = value.key;
        dataKeyValuePairs[keyValuePairIndex].value = value.value;
        setDataKeyValuePairs([...dataKeyValuePairs]);
      } else {
        setDataKeyValuePairs([...dataKeyValuePairs, {id: value.id, key: value.key, value: value.value}]);
      }
    }
  };

  const handleKeyValuePairFormDelete = (key: string, value: {id: string; key: string; value: string}) => {
    if (key === 'stringData') {
      setStringDataKeyValuePairs(stringDataKeyValuePairs.filter(pair => pair.id !== value.id));
    }
    if (key === 'data') {
      setDataKeyValuePairs(dataKeyValuePairs.filter(pair => pair.id !== value.id));
    }
  };

  const handleTextAreaFormChange = (key: string, value: string) => {
    onChange({...formData, data: {[key]: value}, stringData: undefined});
  };

  const handleTokenFormChange = (key: string, value: string) => {
    onChange({...formData, data: {...formData.data, [key]: value}, stringData: undefined});
  };

  const handleTLSFormChange = (key: string, value: string) => {
    onChange({...formData, data: {...formData.data, [key]: value}, stringData: undefined});
  };

  return (
    <S.FormContainer>
      <div>
        <S.StyledSpanTitle>Type</S.StyledSpanTitle>
        <SelectStyled value={formData.type} style={{width: '100%'}} onChange={handleTypeChange} disabled={disabled}>
          {secretTypes.map(secretType => (
            <Option key={secretType} value={secretType}>
              {secretType}
            </Option>
          ))}
        </SelectStyled>
      </div>
      <div>
        {formData.type === 'Opaque' && (
          <KeyValuePairForm
            values={dataKeyValuePairs}
            onChange={(value: {id: string; key: string; value: string}) => handleKeyValuePairFormChange('data', value)}
            onDelete={(value: {id: string; key: string; value: string}) => handleKeyValuePairFormDelete('data', value)}
            disabled={disabled}
          />
        )}
        {formData.type === 'kubernetes.io/service-account-token' && (
          <TextAreaForm
            value={formData.data && formData.data['extra']}
            onChange={(value: string) => handleTextAreaFormChange('extra', value)}
            disabled={disabled}
          />
        )}
        {formData.type === 'kubernetes.io/dockercfg' && (
          <TextAreaForm
            value={formData.data && formData.data['.dockercfg']}
            onChange={(value: string) => handleTextAreaFormChange('.dockercfg', value)}
            disabled={disabled}
          />
        )}
        {formData.type === 'kubernetes.io/dockerconfigjson' && (
          <TextAreaForm
            value={formData.data && formData.data['.dockerconfigjson']}
            onChange={(value: string) => handleTextAreaFormChange('.dockerconfigjson', value)}
            disabled={disabled}
          />
        )}
        {formData.type === 'kubernetes.io/basic-auth' && (
          <KeyValuePairForm
            values={stringDataKeyValuePairs}
            onChange={(value: {id: string; key: string; value: string}) =>
              handleKeyValuePairFormChange('stringData', value)
            }
            onDelete={(value: {id: string; key: string; value: string}) =>
              handleKeyValuePairFormDelete('stringData', value)
            }
            disabled={disabled}
          />
        )}
        {formData.type === 'kubernetes.io/ssh-auth' && (
          <TextAreaForm
            value={formData.data && formData.data['ssh-privatekey']}
            onChange={(value: string) => handleTextAreaFormChange('ssh-privatekey', value)}
            disabled={disabled}
          />
        )}
        {formData.type === 'kubernetes.io/tls' && (
          <TLSForm
            tlscrt={formData.data && formData.data['tls.crt']}
            tlskey={formData.data && formData.data['tls.key']}
            onChange={(key: string, value: string) => handleTLSFormChange(key, value)}
            disabled={disabled}
          />
        )}
        {formData.type === 'bootstrap.kubernetes.io/token' && (
          <TokenForm
            authExtraGroups={formData.data && formData.data['auth-extra-groups']}
            expiration={formData.data && formData.data['expiration']}
            tokenId={formData.data && formData.data['token-id']}
            tokenSecret={formData.data && formData.data['token-secret']}
            usageBootstrapAuthentication={formData.data && formData.data['usage-bootstrap-authentication']}
            usageBootstrapSigning={formData.data && formData.data['usage-bootstrap-signing']}
            onChange={(key: string, value: string) => handleTokenFormChange(key, value)}
            disabled={disabled}
          />
        )}
      </div>
    </S.FormContainer>
  );
};

const KeyValuePairForm = ({
  values,
  onChange,
  onDelete,
  disabled,
}: {
  values: {id: string; key: string; value: string}[];
  disabled: boolean;
  onChange: Function;
  onDelete: Function;
}) => {
  const [localValues, setLocalValues] = useState(values);

  useEffect(() => {
    setLocalValues(values);
  }, [values]);

  const handleDynamicValueChange = (keyValuePair: {key: string; value: string}) => {
    if (onChange) {
      onChange(keyValuePair);
    }
  };

  const handleDynamicValueDelete = (keyValuePair: {key: string; value: string}) => {
    if (onDelete) {
      onDelete(keyValuePair);
    }
  };

  const handleAddNewValue = () => {
    setLocalValues([...values, {id: 'NEW_ITEM', key: '', value: ''}]);
  };

  return (
    <S.FormContainer>
      <S.StyledSpanTitle>Data</S.StyledSpanTitle>
      {localValues.map(value => (
        <DynamicKeyValue
          key={value.id}
          value={value}
          onChange={handleDynamicValueChange}
          onDelete={handleDynamicValueDelete}
          disabled={disabled}
        />
      ))}
      <div style={{marginTop: '12px'}}>
        <Button onClick={handleAddNewValue} disabled={disabled}>
          Add New
        </Button>
      </div>
    </S.FormContainer>
  );
};

const TextAreaForm = ({value, onChange, disabled}: {value: string; onChange: Function; disabled: boolean}) => {
  const [localValue, setLocalValue] = useState<string | undefined>(value);

  const handleValueChange = (propertyValue: string) => {
    setLocalValue(propertyValue || undefined);
  };

  useEffect(() => {
    if (_.isEqual(localValue, value)) {
      return;
    }

    if (onChange) {
      onChange(localValue);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localValue]);

  return (
    <S.FormContainer>
      <S.StyledSpanTitle>Data</S.StyledSpanTitle>
      <Base64Input
        type="TEXT_AREA"
        value={localValue}
        onChange={(emittedValue: string) => handleValueChange(emittedValue)}
        disabled={disabled}
      />
    </S.FormContainer>
  );
};

const TLSForm = ({
  tlscrt,
  tlskey,
  onChange,
  disabled,
}: {
  tlscrt: string;
  tlskey: string;
  onChange: Function;
  disabled: boolean;
}) => {
  const handleValueChange = (key: string, value: string) => {
    if (onChange) {
      onChange(key, value);
    }
  };

  return (
    <S.FormContainer>
      <S.StyledSpanTitle>Data</S.StyledSpanTitle>
      <div>
        <S.StyledSpanTitle>CRT</S.StyledSpanTitle>
        <Base64Input
          type="TEXT_AREA"
          value={tlscrt}
          onChange={(emittedValue: string) => handleValueChange('tls.crt', emittedValue)}
          disabled={disabled}
        />
      </div>
      <div>
        <S.StyledSpanTitle>Key</S.StyledSpanTitle>
        <Base64Input
          type="TEXT_AREA"
          value={tlskey}
          onChange={(emittedValue: string) => handleValueChange('tls.key', emittedValue)}
          disabled={disabled}
        />
      </div>
    </S.FormContainer>
  );
};

const TokenForm = ({
  authExtraGroups,
  expiration,
  tokenId,
  tokenSecret,
  usageBootstrapAuthentication,
  usageBootstrapSigning,
  onChange,
  disabled,
}: {
  authExtraGroups: string;
  expiration: string;
  tokenId: string;
  tokenSecret: string;
  usageBootstrapAuthentication: string;
  usageBootstrapSigning: string;
  disabled: boolean;
  onChange: Function;
}) => {
  const handleValueChange = (key: string, value: string) => {
    if (onChange) {
      onChange(key, value);
    }
  };

  return (
    <S.FormContainer>
      <S.StyledSpanTitle>Data</S.StyledSpanTitle>
      <div>
        <S.StyledSpanTitle>Auth Extra Groups</S.StyledSpanTitle>
        <Base64Input
          value={authExtraGroups}
          onChange={(emittedValue: string) => handleValueChange('auth-extra-groups', emittedValue)}
          disabled={disabled}
        />
      </div>
      <div>
        <S.StyledSpanTitle>Expiration</S.StyledSpanTitle>
        <Base64Input
          value={expiration}
          onChange={(emittedValue: string) => handleValueChange('expiration', emittedValue)}
          disabled={disabled}
        />
      </div>
      <div>
        <S.StyledSpanTitle>Token Id</S.StyledSpanTitle>
        <Base64Input
          value={tokenId}
          onChange={(emittedValue: string) => handleValueChange('token-id', emittedValue)}
          disabled={disabled}
        />
      </div>
      <div>
        <S.StyledSpanTitle>Token Secret</S.StyledSpanTitle>
        <Base64Input
          value={tokenSecret}
          onChange={(emittedValue: string) => handleValueChange('token-secret', emittedValue)}
          disabled={disabled}
        />
      </div>
      <div>
        <S.StyledSpanTitle>Usage Bootstrap Authentication</S.StyledSpanTitle>
        <Base64Input
          value={usageBootstrapAuthentication}
          onChange={(emittedValue: string) => handleValueChange('usage-bootstrap-authentication', emittedValue)}
          disabled={disabled}
        />
      </div>
      <div>
        <S.StyledSpanTitle>Usage Bootstrap Signing</S.StyledSpanTitle>
        <Base64Input
          value={usageBootstrapSigning}
          onChange={(emittedValue: string) => handleValueChange('usage-bootstrap-signing', emittedValue)}
          disabled={disabled}
        />
      </div>
    </S.FormContainer>
  );
};

const DynamicKeyValue = ({value, onChange, onDelete, disabled}: any) => {
  const [localValue, setLocalValue] = useState<{
    id: string | undefined;
    key?: string | undefined;
    value?: string | undefined;
  }>({
    id: undefined,
    key: undefined,
    value: undefined,
  });

  useEffect(() => {
    if (value && value.id === 'NEW_ITEM') {
      setLocalValue({id: uuidv4(), key: undefined, value: undefined});
    } else {
      setLocalValue({id: value.id, key: value.key, value: value.value});
    }
  }, [value]);

  const handleValueChange = (property: string, propertyValue: string) => {
    if (property === 'KEY') {
      setLocalValue({...localValue, key: propertyValue || undefined});
    }

    if (property === 'VALUE') {
      setLocalValue({...localValue, value: propertyValue || undefined});
    }
  };

  const handleDeleteValue = () => {
    if (onDelete) {
      onDelete(localValue);
    }
  };

  useDebounce(
    () => {
      if (_.isEqual(localValue, value)) {
        return;
      }

      if (onChange && localValue.key && localValue.value) {
        onChange(localValue);
      }
    },
    DEFAULT_EDITOR_DEBOUNCE,
    [localValue]
  );

  return (
    <S.DynamicKeyValueContainer>
      <S.DynamicKeyValueItem>
        <S.StyledSpanTitle>Key</S.StyledSpanTitle>
        <Input
          value={localValue.key}
          onChange={event => handleValueChange('KEY', event.target.value)}
          disabled={disabled}
        />
      </S.DynamicKeyValueItem>
      <S.DynamicKeyValueItem>
        <S.StyledSpanTitle>Value</S.StyledSpanTitle>
        <Base64Input
          value={localValue.value}
          onChange={(emittedValue: string) => handleValueChange('VALUE', emittedValue)}
          disabled={disabled}
        />
      </S.DynamicKeyValueItem>
      <S.DynamicKeyValueActionItem>
        <S.StyledSpanTitle>&nbsp;</S.StyledSpanTitle>
        <S.ButtonContainer>
          <Button onClick={handleDeleteValue} disabled={disabled}>
            <DeleteOutlined />
          </Button>
        </S.ButtonContainer>
      </S.DynamicKeyValueActionItem>
    </S.DynamicKeyValueContainer>
  );
};

export const Base64Input = ({value, onChange, type = 'INPUT', disabled}: any) => {
  const [inputValue, setInputValue] = useState<string | undefined>(
    value && isBase64(value) ? Buffer.from(value, 'base64').toString('utf-8') : value
  );
  const [debouncedValue, setDebouncedValue] = useState<string | undefined>(
    value && !isBase64(value) ? Buffer.from(value).toString('base64') : value
  );
  const [isEncoded, setIsEncoded] = useState(isBase64(inputValue));

  useEffect(() => {
    if (!value) {
      setInputValue(value);
      return;
    }
    if (isEncoded) {
      setInputValue(isBase64(value) ? value : Buffer.from(value).toString('base64'));
    } else {
      setInputValue(isBase64(value) ? Buffer.from(value, 'base64').toString('utf-8') : value);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  useDebounce(
    () => {
      if (inputValue) {
        const encoded = isBase64(inputValue);
        setIsEncoded(encoded);
        if (encoded) {
          setDebouncedValue(inputValue);
        } else {
          setDebouncedValue(Buffer.from(inputValue).toString('base64'));
        }
      } else {
        setDebouncedValue(undefined);
      }
    },
    DEFAULT_EDITOR_DEBOUNCE,
    [inputValue]
  );

  const encode = () => {
    setInputValue(inputValue ? Buffer.from(inputValue).toString('base64') : undefined);
    setIsEncoded(true);
  };
  const decode = () => {
    setInputValue(inputValue ? Buffer.from(inputValue, 'base64').toString('utf-8') : undefined);
    setIsEncoded(false);
  };

  useEffect(() => {
    if (_.isEqual(debouncedValue, value)) {
      return;
    }

    if (onChange) {
      onChange(debouncedValue);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedValue]);

  return (
    <>
      {type === 'INPUT' ? (
        <Input
          value={inputValue}
          onChange={e => setInputValue(e.target.value || undefined)}
          onPaste={(e: any) => setInputValue(e.target.value || undefined)}
          disabled={disabled}
        />
      ) : (
        <TextArea
          rows={6}
          value={inputValue}
          onChange={e => setInputValue(e.target.value || undefined)}
          onPaste={(e: any) => setInputValue(e.target.value || undefined)}
          disabled={disabled}
        />
      )}

      {!isEncoded ? (
        <S.StyledSpanToggler onClick={() => encode()}>Encode</S.StyledSpanToggler>
      ) : (
        <S.StyledSpanToggler onClick={() => decode()}>Decode</S.StyledSpanToggler>
      )}
    </>
  );
};

export const isBase64 = (str?: string | null) => {
  if (!str) {
    return false;
  }
  try {
    return Buffer.from(Buffer.from(str, 'base64').toString('utf-8')).toString('base64') === str;
  } catch (err) {
    return false;
  }
};
