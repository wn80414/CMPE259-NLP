import React from 'react';
import { Box, Typography, Chip } from '@mui/material';

const JSONPreview = ({ data }) => {
  return (
    <Box sx={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column', 
      bgcolor: '#1e1e1e' 
    }}>
      {/* Header Label */}
      <Box sx={{ p: 1.5, bgcolor: '#2d2d2d', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="caption" sx={{ color: '#888', fontFamily: 'monospace' }}>
          LIVE_OUTPUT.JSON
        </Typography>
        <Chip label="SCHEMA VALID" size="small" color="success" sx={{ height: 18, fontSize: '10px' }} />
      </Box>

      {/* Scrollable JSON Area */}
      <Box 
        component="pre" 
        sx={{ 
          flexGrow: 1, 
          overflow: 'auto', // Independent scroll
          p: 3, 
          m: 0, 
          color: '#9cdcfe', 
          fontFamily: 'Consolas, Monaco, monospace', 
          fontSize: '13px',
          lineHeight: 1.6,
          '&::-webkit-scrollbar': { width: '8px' },
          '&::-webkit-scrollbar-thumb': { backgroundColor: '#333', borderRadius: '4px' }
        }}
      >
        {JSON.stringify(data, null, 2)}
      </Box>
    </Box>
  );
};

/*

*/
export default JSONPreview;