import React from 'react';
import { 
  Box, Paper, Stack, Typography, Button, TextField, Divider, Grid 
} from '@mui/material';

const JSONEditor = ({ resume, setResume }) => {

  const updateField = (path, value) => setResume(prev => ({ ...prev, [path]: value }));
  
  const updateNestedField = (category, value) => setResume(prev => ({
    ...prev,
    skills: { ...prev.skills, [category]: value }
  }));

  const addArrayItem = (field, defaultValue) => setResume(prev => ({ 
    ...prev, [field]: [...(prev[field] || []), defaultValue] 
  }));

  const removeArrayItem = (field, index) => setResume(prev => ({
    ...prev, [field]: prev[field].filter((_, i) => i !== index)
  }));

  const updateArrayItem = (field, index, key, value) => {
    const updatedArray = [...(resume[field] || [])];
    updatedArray[index] = { ...updatedArray[index], [key]: value };
    setResume(prev => ({ ...prev, [field]: updatedArray }));
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <Stack spacing={4} sx={{ maxWidth: '850px', margin: '0 auto', pb: 10 }}>
        
        <Typography variant="h4" fontWeight="800">Resume Architect</Typography>

        {/* BASIC INFO */}
        <Paper sx={{ p: 3, borderRadius: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <Typography variant="h6" fontWeight="600" mb={3}>General Information</Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Full Name" value={resume.name || ''} onChange={(e) => updateField('name', e.target.value)} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Email" value={resume.email || ''} onChange={(e) => updateField('email', e.target.value)} />
            </Grid>
          </Grid>
        </Paper>

        {/* EDUCATION SECTION */}
        <Paper sx={{ p: 3, borderRadius: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', minHeight: '200px' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6" fontWeight="600">Education</Typography>
            <Button variant="contained" size="small" onClick={() => addArrayItem('education', { school: '', degree: '', location: '', graduation_date: '', gpa: '', coursework: [] })}>
              + Add Education
            </Button>
          </Box>
          <Stack spacing={4} divider={<Divider />}>
            {(resume.education || []).map((edu, idx) => (
              <Box key={idx}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
                  <Button color="error" size="small" onClick={() => removeArrayItem('education', idx)}>Delete</Button>
                </Box>
                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid item xs={12} md={8}>
                    <TextField fullWidth size="small" label="School" value={edu.school || ''} onChange={(e) => updateArrayItem('education', idx, 'school', e.target.value)} />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField fullWidth size="small" label="Location" value={edu.location || ''} onChange={(e) => updateArrayItem('education', idx, 'location', e.target.value)} />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField fullWidth size="small" label="Degree" value={edu.degree || ''} onChange={(e) => updateArrayItem('education', idx, 'degree', e.target.value)} />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField fullWidth size="small" label="Graduation Date" placeholder="May. 2027" value={edu.graduation_date || ''} onChange={(e) => updateArrayItem('education', idx, 'graduation_date', e.target.value)} />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField fullWidth size="small" label="GPA" value={edu.gpa || ''} onChange={(e) => updateArrayItem('education', idx, 'gpa', e.target.value)} />
                  </Grid>
                </Grid>
                <TextField 
                  fullWidth multiline rows={2} 
                  label="Coursework (comma separated)" 
                  value={edu.coursework?.join(', ') || ''} 
                  onChange={(e) => updateArrayItem('education', idx, 'coursework', e.target.value.split(',').map(s => s.trim()))} 
                />
              </Box>
            ))}
            {(!resume.education || resume.education.length === 0) && (
              <Box sx={{ py: 6, border: '2px dashed #e2e8f0', borderRadius: 2, textAlign: 'center' }}>
                <Typography color="text.secondary">No education history added yet.</Typography>
              </Box>
            )}
          </Stack>
        </Paper>

        {/* PROJECTS */}
        <Paper sx={{ p: 3, borderRadius: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', minHeight: '200px' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6" fontWeight="600">Technical Projects</Typography>
            <Button variant="contained" size="small" onClick={() => addArrayItem('projects', { name: '', tech_stack: [], bullets: [] })}>
              + Add Project
            </Button>
          </Box>
          <Stack spacing={4} divider={<Divider />}>
            {(resume.projects || []).map((proj, idx) => (
              <Box key={idx}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
                  <Button color="error" size="small" onClick={() => removeArrayItem('projects', idx)}>Delete</Button>
                </Box>
                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid item xs={12} md={6}><TextField fullWidth size="small" label="Name" value={proj.name || ''} onChange={(e) => updateArrayItem('projects', idx, 'name', e.target.value)} /></Grid>
                  <Grid item xs={12} md={6}><TextField fullWidth size="small" label="Tech Stack" value={proj.tech_stack?.join(', ') || ''} onChange={(e) => updateArrayItem('projects', idx, 'tech_stack', e.target.value.split(',').map(s => s.trim()))} /></Grid>
                </Grid>
                <TextField fullWidth multiline rows={3} label="Bullets" value={proj.bullets?.join('\n') || ''} onChange={(e) => updateArrayItem('projects', idx, 'bullets', e.target.value.split('\n'))} />
              </Box>
            ))}
          </Stack>
        </Paper>

        {/* EXPERIENCE */}
        <Paper sx={{ p: 3, borderRadius: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', minHeight: '200px' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6" fontWeight="600">Work Experience</Typography>
            <Button variant="outlined" size="small" onClick={() => addArrayItem('experience', { company: '', role: '', bullets: [] })}>+ Add Role</Button>
          </Box>
          <Stack spacing={4} divider={<Divider />}>
            {(resume.experience || []).map((exp, idx) => (
              <Box key={idx}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
                  <Button color="error" size="small" onClick={() => removeArrayItem('experience', idx)}>Delete</Button>
                </Box>
                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid item xs={12} md={6}><TextField fullWidth size="small" label="Company" value={exp.company || ''} onChange={(e) => updateArrayItem('experience', idx, 'company', e.target.value)} /></Grid>
                  <Grid item xs={12} md={6}><TextField fullWidth size="small" label="Role" value={exp.role || ''} onChange={(e) => updateArrayItem('experience', idx, 'role', e.target.value)} /></Grid>
                </Grid>
                <TextField fullWidth multiline rows={3} label="Bullets" value={exp.bullets?.join('\n') || ''} onChange={(e) => updateArrayItem('experience', idx, 'bullets', e.target.value.split('\n'))} />
              </Box>
            ))}
          </Stack>
        </Paper>

        {/* TECHNICAL SKILLS */}
        <Paper sx={{ p: 3, borderRadius: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <Typography variant="h6" fontWeight="600" mb={3}>Technical Skills</Typography>
          <Grid container spacing={3}>
            {['languages', 'cloud', 'ml_ai', 'tools'].map((cat) => (
              <Grid item xs={12} key={cat}>
                <TextField 
                  fullWidth size="small" 
                  label={cat.toUpperCase().replace('_', ' / ')} 
                  value={resume.skills?.[cat]?.join(', ') || ''} 
                  onChange={(e) => updateNestedField(cat, e.target.value.split(',').map(s => s.trim()))} 
                />
              </Grid>
            ))}
          </Grid>
        </Paper>

      </Stack>
    </Box>
  );
};

export default JSONEditor;