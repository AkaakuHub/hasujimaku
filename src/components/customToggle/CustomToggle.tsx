import React, { useState } from 'react';
import { Switch, FormControlLabel } from '@mui/material';
import styled from '@emotion/styled';

interface CustomToggleProps {
  name: string;
  disabled?: boolean;
  label: string;
  checked: boolean;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const CustomFormControlLabel = styled(FormControlLabel)`
  font-family: 'Klee One', sans-serif;
`;

const CustomToggle: React.FC<CustomToggleProps> = ({ name, disabled, label, checked, onChange }) => {
  return (
    <CustomFormControlLabel
      control={
        <Switch
          checked={checked}
          onChange={onChange}
          name={name}
          color="primary"
          disabled={disabled}
        />
      }
      label={label}
      sx={{
        fontFamily: "'Klee One', sans-serif !important",
      }}
    />
  );
};

export default CustomToggle;
