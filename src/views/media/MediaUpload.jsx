import React, { useState, useEffect, useContext } from 'react'
import {
  CForm,
  CFormLabel,
  CFormInput,
  CFormTextarea,
  CFormSelect,
  CFormCheck,
  CButton,
  CAlert,
  CSpinner,
  CRow,
  CCol,
  CCard,
  CCardBody,
} from '@coreui/react'
import { UserContext } from '../../context/userContext'
import mediaService from '../../services/mediaService'
import axios from 'axios'

const MediaUpload = ({ onSuccess, onCancel }) => {
  const { user } = useContext(UserContext)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    project: '',
    task: '',
    isPublic: false,
    tags: '',
  })
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [projects, setProjects] = useState([])
  const [tasks, setTasks] = useState([])

  // Fetch user's projects
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const token = localStorage.getItem('token')
        const response = await axios.get('http://localhost:3001/api/projects', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          withCredentials: true,
        })
        console.log('Projects API response:', response.data)
        if (response.data.success) {
          // The API returns projects in response.data.projects, not response.data.data
          setProjects(response.data.projects || [])
          console.log(
            'Projects loaded:',
            response.data.projects ? response.data.projects.length : 0,
          )
        } else {
          // Set empty array if request was not successful
          setProjects([])
          console.error('Failed to fetch projects:', response.data.error)
        }
      } catch (error) {
        console.error('Error fetching projects:', error)
        // Set empty array on error
        setProjects([])
      }
    }

    fetchProjects()
  }, [])

  // Fetch tasks when project changes
  useEffect(() => {
    const fetchTasks = async () => {
      if (!formData.project) {
        setTasks([])
        return
      }

      try {
        const token = localStorage.getItem('token')

        // Directly fetch tasks filtered by project ID
        console.log('Fetching tasks for project ID:', formData.project)

        // Make a direct API call to get tasks with a query parameter for the project
        const tasksResponse = await axios.get(`http://localhost:3001/api/tasks`, {
          params: {
            project: formData.project,
          },
          headers: {
            Authorization: `Bearer ${token}`,
          },
          withCredentials: true,
        })

        console.log('Tasks API response:', tasksResponse.data)

        if (tasksResponse.data.success && tasksResponse.data.tasks) {
          // Tasks are already filtered by project on the server
          const projectTasks = tasksResponse.data.tasks
          console.log('Tasks for this project:', projectTasks.length)

          // Log each task for debugging
          projectTasks.forEach((task) => {
            console.log('Task:', task.title, 'ID:', task._id)
          })

          // No need to filter tasks as they're already filtered by the server
          setTasks(projectTasks)
        } else {
          console.log('No tasks returned from API or request failed')
          setTasks([])
        }
      } catch (error) {
        console.error('Error fetching tasks:', error)
        // Set empty array on error
        setTasks([])
      }
    }

    fetchTasks()
  }, [formData.project])

  // Generate preview when file changes
  useEffect(() => {
    if (!file) {
      setPreview(null)
      return
    }

    // Create preview for image files
    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result)
      }
      reader.readAsDataURL(file)
    } else {
      setPreview(null)
    }

    return () => {
      // Clean up
      if (preview) URL.revokeObjectURL(preview)
    }
  }, [file])

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target

    // If project is changing, reset the task selection
    if (name === 'project') {
      setFormData({
        ...formData,
        [name]: type === 'checkbox' ? checked : value,
        task: '', // Reset task when project changes
      })

      // Also reset the tasks list if no project is selected
      if (!value) {
        setTasks([])
      }
    } else {
      setFormData({
        ...formData,
        [name]: type === 'checkbox' ? checked : value,
      })
    }
  }

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!file) {
      setError('Please select a file to upload')
      return
    }

    try {
      setLoading(true)
      setError(null)

      const uploadData = new FormData()
      uploadData.append('file', file)
      uploadData.append('title', formData.title)
      uploadData.append('description', formData.description || '')
      uploadData.append('project', formData.project || '')
      uploadData.append('task', formData.task || '')
      uploadData.append('isPublic', formData.isPublic)
      uploadData.append('tags', formData.tags || '')

      // Get the authentication token
      const token = localStorage.getItem('token')
      if (!token) {
        setError('Authentication token not found. Please log in again.')
        setLoading(false)
        return
      }

      const response = await mediaService.uploadMedia(uploadData)

      if (response && response.success) {
        if (onSuccess) onSuccess()
      } else {
        setError((response && response.error) || 'Failed to upload media')
      }
    } catch (error) {
      console.error('Error uploading media:', error)
      if (error.response?.status === 401) {
        setError('Authentication error. Please log in again.')
      } else {
        setError(error.response?.data?.error || 'An error occurred while uploading the file')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <CCard>
      <CCardBody>
        <h4 className="mb-4">Upload New Media</h4>

        {error && <CAlert color="danger">{error}</CAlert>}

        <CForm onSubmit={handleSubmit}>
          <CRow>
            <CCol md={preview ? 8 : 12}>
              <div className="mb-3">
                <CFormLabel htmlFor="title">Title*</CFormLabel>
                <CFormInput
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="mb-3">
                <CFormLabel htmlFor="description">Description</CFormLabel>
                <CFormTextarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                />
              </div>

              <CRow>
                <CCol md={6}>
                  <div className="mb-3">
                    <CFormLabel htmlFor="project">Project</CFormLabel>
                    <CFormSelect
                      id="project"
                      name="project"
                      value={formData.project}
                      onChange={(e) => {
                        console.log('Project selected:', e.target.value)
                        handleInputChange(e)
                      }}
                    >
                      <option value="">None</option>
                      {Array.isArray(projects) && projects.length > 0
                        ? projects.map((project) => (
                            <option key={project._id} value={project._id}>
                              {project.projectName}
                            </option>
                          ))
                        : null}
                    </CFormSelect>
                  </div>
                </CCol>

                <CCol md={6}>
                  <div className="mb-3">
                    <CFormLabel htmlFor="task">Task</CFormLabel>
                    <CFormSelect
                      id="task"
                      name="task"
                      value={formData.task}
                      onChange={handleInputChange}
                      disabled={!formData.project || !Array.isArray(tasks) || tasks.length === 0}
                    >
                      <option value="">None</option>
                      {Array.isArray(tasks) && tasks.length > 0 ? (
                        tasks.map((task) => {
                          console.log('Rendering task option:', task.title, 'ID:', task._id)
                          return (
                            <option key={task._id} value={task._id}>
                              {task.title || 'Unnamed Task'}
                            </option>
                          )
                        })
                      ) : (
                        <option value="" disabled>
                          No tasks available for this project
                        </option>
                      )}
                    </CFormSelect>
                  </div>
                </CCol>
              </CRow>

              <div className="mb-3">
                <CFormLabel htmlFor="tags">Tags (comma separated)</CFormLabel>
                <CFormInput
                  id="tags"
                  name="tags"
                  value={formData.tags}
                  onChange={handleInputChange}
                  placeholder="e.g. report, presentation, design"
                />
              </div>

              <div className="mb-3">
                <CFormCheck
                  id="isPublic"
                  name="isPublic"
                  label="Make this file public (accessible to all project members)"
                  checked={formData.isPublic}
                  onChange={handleInputChange}
                />
              </div>

              <div className="mb-4">
                <CFormLabel htmlFor="file">File*</CFormLabel>
                <CFormInput type="file" id="file" onChange={handleFileChange} required />
                <div className="form-text">Maximum file size: 50MB</div>
              </div>
            </CCol>

            {preview && (
              <CCol md={4}>
                <div className="mb-3">
                  <CFormLabel>Preview</CFormLabel>
                  <div className="preview-container border rounded p-2 d-flex align-items-center justify-content-center">
                    <img
                      src={preview}
                      alt="Preview"
                      className="img-fluid"
                      style={{ maxHeight: '200px' }}
                    />
                  </div>
                </div>
              </CCol>
            )}
          </CRow>

          <div className="d-flex justify-content-end mt-3">
            <CButton
              color="secondary"
              variant="outline"
              onClick={onCancel}
              className="me-2"
              disabled={loading}
            >
              Cancel
            </CButton>
            <CButton type="submit" color="primary" disabled={loading || !file || !formData.title}>
              {loading ? (
                <>
                  <CSpinner size="sm" className="me-2" /> Uploading...
                </>
              ) : (
                'Upload'
              )}
            </CButton>
          </div>
        </CForm>
      </CCardBody>
    </CCard>
  )
}

export default MediaUpload
