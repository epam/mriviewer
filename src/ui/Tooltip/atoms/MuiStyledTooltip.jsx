import React from 'react';
import Tooltip, { tooltipClasses } from '@mui/material/Tooltip';
import { styled } from '@mui/material/styles';

export const MuiStyledTooltip = styled(({ className, ...props }) => <Tooltip {...props} classes={{ popper: className }} />)(() => ({
  [`& .${tooltipClasses.tooltip}`]: {
    display: 'inline-block',
    maxWidth: 500,
    zIndex: 1000,
    borderRadius: '5px',
    boxShadow: '0 0 8px 0 rgba(0, 0, 0, 0.14)',
    padding: '10px 15px',
    backgroundColor: '#46494e',
    opacity: 0.98,
    fontSize: '16px',
    lineHeight: '20px',
    color: 'white',
    whiteSpace: 'pre',
    fontFamily: "'Inter', 'sans-serif'",
  },
}));
