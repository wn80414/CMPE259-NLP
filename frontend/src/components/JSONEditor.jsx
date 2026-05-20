import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Stack, Typography, Button, TextField, Divider, Grid, Chip, Autocomplete
} from '@mui/material';

// Common SWE skill banks
const COMMON_SKILLS = {
  languages: ['Python', 'JavaScript', 'TypeScript', 'Java', 'C++', 'Go', 'Rust', 'SQL', 'Kotlin', 'Swift'],
  cloud: ['AWS', 'GCP', 'Azure', 'Docker', 'Kubernetes', 'Terraform', 'CI/CD', 'Linux'],
  ml_ai: ['TensorFlow', 'PyTorch', 'scikit-learn', 'NLP', 'Computer Vision', 'LangChain', 'Hugging Face'],
  tools: ['Git', 'VS Code', 'Jira', 'Figma', 'Postman', 'Node.js', 'React', 'Next.js', 'MongoDB', 'PostgreSQL']
};

// Helper: recursively replace old_text with new_text in any string inside the resume
function replaceTextInResume(obj, oldText, newText) {
  if (typeof obj === 'string') {
    return obj.replace(oldText, newText);
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => replaceTextInResume(item, oldText, newText));
  }
  if (obj && typeof obj === 'object') {
    const updated = {};
    for (const key in obj) {
      updated[key] = replaceTextInResume(obj[key], oldText, newText);
    }
    return updated;
  }
  return obj;
}

const JSONEditor = ({
  resume,
  setResume,
  suggestions: propSuggestions = [],
  summary = '',
  mode = '',
}) => {
  const [activeSkillCat, setActiveSkillCat] = useState('');
  const [localSuggestions, setLocalSuggestions] = useState(propSuggestions);

  // Sync when parent passes new suggestions
  useEffect(() => {
    setLocalSuggestions(propSuggestions);
  }, [propSuggestions]);

  // Editor helpers
  const updateField = (path, value) => setResume(prev => ({ ...prev, [path]: value }));
  const updateNestedField = (category, value) => setResume(prev => ({
    ...prev,
    skills: { ...prev.skills, [category]: value }
  }));
  const addArrayItem = (field, defaultValue) => setResume(prev => ({
    ...prev,
    [field]: [...(prev[field] || []), defaultValue]
  }));
  const removeArrayItem = (field, index) => setResume(prev => ({
    ...prev,
    [field]: prev[field].filter((_, i) => i !== index)
  }));
  const updateArrayItem = (field, index, key, value) => {
    const updatedArray = [...(resume[field] || [])];
    updatedArray[index] = { ...updatedArray[index], [key]: value };
    setResume(prev => ({ ...prev, [field]: updatedArray }));
  };

  // Accept/Reject handlers
  const handleAcceptChange = (change) => {
    const { old_text, new_text } = change;
    if (!old_text || !new_text) return;
    setResume((prev) => replaceTextInResume(prev, old_text, new_text));
    setLocalSuggestions((prev) => prev.filter((_, i) => i !== change._idx));
  };

  const handleRejectChange = (change) => {
    setLocalSuggestions((prev) => prev.filter((_, i) => i !== change._idx));
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <Stack spacing={5} sx={{ maxWidth: '900px', margin: '0 auto', pb: 10 }}>
        {/* Title */}
        <Typography variant="h4" fontWeight="800">Resume Builder</Typography>

        {/* BASIC INFO */}
        <Paper sx={{ p: 3, borderRadius: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <Typography variant="h6" fontWeight="600" mb={4}>General Information</Typography>
          <br></br>
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Full Name" value={resume.name || ''} onChange={(e) => updateField('name', e.target.value)} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Email" value={resume.email || ''} onChange={(e) => updateField('email', e.target.value)} />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField fullWidth label="Phone" value={resume.phone || ''} onChange={(e) => updateField('phone', e.target.value)} />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField fullWidth label="LinkedIn (URL)" value={resume.linkedin || ''} onChange={(e) => updateField('linkedin', e.target.value)} />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField fullWidth label="GitHub (URL)" value={resume.github || ''} onChange={(e) => updateField('github', e.target.value)} />
            </Grid>
          </Grid>
        </Paper>

        {/* EDUCATION */}
        <Paper sx={{ p: 3, borderRadius: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
            <Typography variant="h6" fontWeight="600">Education</Typography>
            <Button variant="outlined" size="small" onClick={() => addArrayItem('education', {
              school: '',
              degree: '',
              location: '',
              graduation_date: '',
              gpa: '',
              coursework: []
            })}>
              + Add Education
            </Button>
          </Box>

          <Stack spacing={5} divider={<Divider />}>
            {(resume.education || []).map((edu, idx) => (
              <Box key={idx} id={`education.${idx}`}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
                  <Button color="error" size="small" onClick={() => removeArrayItem('education', idx)}>Delete</Button>
                </Box>
                <Grid container spacing={4} sx={{ mb: 2 }}>
                  <Grid item xs={12} md={6}>
                    <TextField fullWidth size="small" label="School" value={edu.school || ''}
                      onChange={(e) => updateArrayItem('education', idx, 'school', e.target.value)} />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField fullWidth size="small" label="Degree" value={edu.degree || ''}
                      onChange={(e) => updateArrayItem('education', idx, 'degree', e.target.value)} />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField fullWidth size="small" label="Location" value={edu.location || ''}
                      onChange={(e) => updateArrayItem('education', idx, 'location', e.target.value)} />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField fullWidth size="small" label="Graduation Date" value={edu.graduation_date || ''}
                      onChange={(e) => updateArrayItem('education', idx, 'graduation_date', e.target.value)} />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField fullWidth size="small" label="GPA" value={edu.gpa || ''}
                      onChange={(e) => updateArrayItem('education', idx, 'gpa', e.target.value)} />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField fullWidth size="small" label="Coursework (comma separated)" 
                      value={edu.coursework?.join(', ') || ''}
                      onChange={(e) => updateArrayItem('education', idx, 'coursework', e.target.value.split(',').map(s => s.trim()))}
                    />
                  </Grid>
                </Grid>
              </Box>
            ))}
            {(!resume.education || resume.education.length === 0) && (
              <Box sx={{ py: 4, border: '2px dashed #e2e8f0', borderRadius: 2, textAlign: 'center' }}>
                <Typography color="text.secondary">No education entries yet.</Typography>
              </Box>
            )}
          </Stack>
        </Paper>

        {/* EXPERIENCE */}
        <Paper sx={{ p: 3, borderRadius: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
            <Typography variant="h6" fontWeight="600">Work Experience</Typography>
            <Button variant="outlined" size="small" onClick={() => addArrayItem('experience', {
              company: '',
              role: '',
              location: '',
              start_date: '',
              end_date: '',
              bullets: []
            })}>
              + Add Role
            </Button>
          </Box>

          <Stack spacing={5} divider={<Divider />}>
            {(resume.experience || []).map((exp, idx) => (
              <Box key={idx} id={`experience.${idx}`}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
                  <Button color="error" size="small" onClick={() => removeArrayItem('experience', idx)}>Delete</Button>
                </Box>
                <Grid container spacing={4} sx={{ mb: 2 }}>
                  <Grid item xs={12} md={6}>
                    <TextField fullWidth size="small" label="Company" value={exp.company || ''}
                      onChange={(e) => updateArrayItem('experience', idx, 'company', e.target.value)} />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField fullWidth size="small" label="Role" value={exp.role || ''}
                      onChange={(e) => updateArrayItem('experience', idx, 'role', e.target.value)} />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField fullWidth size="small" label="Location" value={exp.location || ''}
                      onChange={(e) => updateArrayItem('experience', idx, 'location', e.target.value)} />
                  </Grid>
                  <Grid item xs={6} md={4}>
                    <TextField fullWidth size="small" label="Start Date" value={exp.start_date || ''}
                      onChange={(e) => updateArrayItem('experience', idx, 'start_date', e.target.value)} />
                  </Grid>
                  <Grid item xs={6} md={4}>
                    <TextField fullWidth size="small" label="End Date" value={exp.end_date || ''}
                      onChange={(e) => updateArrayItem('experience', idx, 'end_date', e.target.value)} />
                  </Grid>
                </Grid>
                <TextField
                  fullWidth
                  multiline
                  minRows={4}
                  maxRows={10}
                  placeholder={"– Led development of...\n– Reduced latency by..."}
                  value={exp.bullets?.join('\n') || ''}
                  onChange={(e) => updateArrayItem('experience', idx, 'bullets', e.target.value.split('\n'))}
                />
              </Box>
            ))}
            {(!resume.experience || resume.experience.length === 0) && (
              <Box sx={{ py: 4, border: '2px dashed #e2e8f0', borderRadius: 2, textAlign: 'center' }}>
                <Typography color="text.secondary">No experience entries yet.</Typography>
              </Box>
            )}
          </Stack>
        </Paper>

        {/* PROJECTS */}
        <Paper sx={{ p: 3, borderRadius: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', minHeight: '200px' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
            <Typography variant="h6" fontWeight="600">Technical Projects</Typography>
            <Button variant="contained" size="small" onClick={() => addArrayItem('projects', { name: '', tech_stack: [], bullets: [] })}>
              + Add Project
            </Button>
          </Box>
          <Stack spacing={5} divider={<Divider />}>
            {(resume.projects || []).map((proj, idx) => (
              <Box key={idx} id={`projects.${idx}`}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
                  <Button color="error" size="small" onClick={() => removeArrayItem('projects', idx)}>Delete</Button>
                </Box>
                <Grid container spacing={4} sx={{ mb: 2 }}>
                  <Grid item xs={12} md={6}>
                    <TextField fullWidth size="small" label="Name" value={proj.name || ''} onChange={(e) => updateArrayItem('projects', idx, 'name', e.target.value)} />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField fullWidth size="small" label="Tech Stack" value={proj.tech_stack?.join(', ') || ''} onChange={(e) => updateArrayItem('projects', idx, 'tech_stack', e.target.value.split(',').map(s => s.trim()))} />
                  </Grid>
                </Grid>
                <TextField
                  fullWidth
                  multiline
                  minRows={4}
                  maxRows={10}
                  placeholder={"– Implemented feature X\n– Improved performance by Y%"}
                  value={proj.bullets?.join('\n') || ''}
                  onChange={(e) => updateArrayItem('projects', idx, 'bullets', e.target.value.split('\n'))}
                />
              </Box>
            ))}
            {(!resume.projects || resume.projects.length === 0) && (
              <Box sx={{ py: 4, border: '2px dashed #e2e8f0', borderRadius: 2, textAlign: 'center' }}>
                <Typography color="text.secondary">No projects added yet.</Typography>
              </Box>
            )}
          </Stack>
        </Paper>

        {/* TECHNICAL SKILLS */}
        <Paper sx={{ p: 3, borderRadius: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <Typography variant="h6" fontWeight="600" mb={4}>Technical Skills</Typography>

          {/* Category toggle buttons */}
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
            {['languages', 'cloud', 'ml_ai', 'tools'].map((cat) => {
              const label = cat.toUpperCase().replace('_', ' / ');
              return (
                <Button
                  key={cat}
                  variant={activeSkillCat === cat ? 'contained' : 'outlined'}
                  size="small"
                  onClick={() => setActiveSkillCat(activeSkillCat === cat ? '' : cat)}
                  sx={{ textTransform: 'none' }}
                >
                  {label}
                </Button>
              );
            })}
          </Box>

          {/* Expanded Autocomplete for selected category */}
          {activeSkillCat && (
            <Box sx={{ mb: 4 }}>
              <Autocomplete
                multiple
                freeSolo
                options={COMMON_SKILLS[activeSkillCat] || []}
                value={resume.skills?.[activeSkillCat] || []}
                onChange={(_, newValue) => updateNestedField(activeSkillCat, newValue)}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip label={option} {...getTagProps({ index })} />
                  ))
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    size="small"
                    label={`Add ${activeSkillCat.toUpperCase().replace('_', ' / ')} skills`}
                    placeholder="Type and press Enter"
                  />
                )}
              />
            </Box>
          )}

          {/* Overview chips */}
          <Divider sx={{ mb: 2 }} />
          <Typography variant="subtitle2" fontWeight="600" gutterBottom sx={{ mb: 1 }}>
            Current Skills Overview
          </Typography>
          <Box>
            {['languages', 'cloud', 'ml_ai', 'tools'].map((cat) => {
              const skills = resume.skills?.[cat] || [];
              if (!skills.length) return null;

              return (
                <Box key={cat} id={`skills.${cat}`} sx={{ mb: 2 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                    {cat.toUpperCase().replace('_', ' / ')}
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {skills.map((skill, idx) => (
                      <Chip
                        key={idx}
                        label={skill}
                        size="small"
                        onDelete={() => {
                          const newSkills = skills.filter((_, i) => i !== idx);
                          updateNestedField(cat, newSkills);
                        }}
                      />
                    ))}
                  </Box>
                </Box>
              );
            })}
          </Box>
        </Paper>

        {/* AWARDS */}
        <Paper sx={{ p: 3, borderRadius: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
            <Typography variant="h6" fontWeight="600">Awards & Honors</Typography>
            <Button variant="contained" size="small" onClick={() => addArrayItem('awards', { title: '', date: '', description: '' })}>
              + Add Award
            </Button>
          </Box>
          <Stack spacing={5} divider={<Divider />}>
            {(resume.awards || []).map((award, idx) => (
              <Box key={idx}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
                  <Button color="error" size="small" onClick={() => removeArrayItem('awards', idx)}>Delete</Button>
                </Box>
                <Grid container spacing={4} sx={{ mb: 2 }}>
                  <Grid item xs={12} md={6}><TextField fullWidth size="small" label="Title" value={award.title || ''} onChange={(e) => updateArrayItem('awards', idx, 'title', e.target.value)} /></Grid>
                  <Grid item xs={12} md={3}><TextField fullWidth size="small" label="Date" value={award.date || ''} onChange={(e) => updateArrayItem('awards', idx, 'date', e.target.value)} /></Grid>
                  <Grid item xs={12} md={3}>
                    <TextField fullWidth size="small" label="Description" value={award.description || ''} onChange={(e) => updateArrayItem('awards', idx, 'description', e.target.value)} />
                  </Grid>
                </Grid>
              </Box>
            ))}
            {(!resume.awards || resume.awards.length === 0) && (
              <Box sx={{ py: 4, border: '2px dashed #e2e8f0', borderRadius: 2, textAlign: 'center' }}>
                <Typography color="text.secondary">No awards added yet.</Typography>
              </Box>
            )}
          </Stack>
        </Paper>

        {/* AI SUGGESTIONS */}
        {(localSuggestions.length > 0 || summary) && (
          <Paper sx={{ p: 3, borderRadius: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <Typography variant="h6" fontWeight="600" mb={2}>
              AI Suggestions
              {mode && (
                <Chip label={mode} size="small" color="primary" sx={{ ml: 1, fontWeight: 500 }} />
              )}
            </Typography>

            {summary && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2, whiteSpace: 'pre-wrap' }}>
                {summary}
              </Typography>
            )}

            {localSuggestions.length > 0 && (
              <Stack spacing={2} divider={<Divider />}>
                {localSuggestions.map((change, idx) => (
                  <Box key={idx}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="subtitle2" fontWeight="600">
                        {change.category || 'Improvement'}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Chip
                          label="Accept"
                          color="success"
                          size="small"
                          onClick={() => handleAcceptChange(change)}
                        />
                        <Chip
                          label="Reject"
                          color="default"
                          size="small"
                          onClick={() => handleRejectChange(change)}
                        />
                      </Box>
                    </Box>

                    <Grid container spacing={1}>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">Before</Typography>
                        <Paper variant="outlined" sx={{ p: 1, bgcolor: '#f9f9f9', fontSize: 13 }}>
                          {change.old_text}
                        </Paper>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">After</Typography>
                        <Paper variant="outlined" sx={{ p: 1, bgcolor: '#e8f5e9', fontSize: 13 }}>
                          {change.new_text}
                        </Paper>
                      </Grid>
                    </Grid>

                    {change.reason && (
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                        Why: {change.reason}
                      </Typography>
                    )}
                  </Box>
                ))}
              </Stack>
            )}
          </Paper>
        )}
      </Stack>
    </Box>
  );
};

export default JSONEditor;