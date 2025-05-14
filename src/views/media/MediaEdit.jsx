import React, { useState, useEffect } from 'react'
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
} from '@coreui/react'
import mediaService from '../../services/mediaService'
import axios from 'axios'

const MediaEdit = ({ media, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    project: '',
    task: '',
    isPublic: false,
    tags: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [projects, setProjects] = useState([])
  const [tasks, setTasks] = useState([])

  // Initialize form data from media object
  useEffect(() => {
    if (media) {
      setFormData({
        title: media.title || '',
        description: media.description || '',
        project: media.project?._id || media.project || '',
        task: media.task?._id || media.task || '',
        isPublic: media.isPublic || false,
        tags: media.tags ? media.tags.join(', ') : '',
      })
    }
  }, [media])

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

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target

    // If project is changing, reset the task selection
    if (name === 'project') {
      console.log('Project changed to:', value)
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

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!media || !media._id) {
      setError('Media ID is missing')
      return
    }

    try {
      setLoading(true)
      setError(null)

      const updateData = {
        title: formData.title,
        description: formData.description,
        project: formData.project || null,
        task: formData.task || null,
        isPublic: formData.isPublic,
        tags: formData.tags,
      }

      const response = await mediaService.updateMedia(media._id, updateData)

      if (response.success) {
        if (onSuccess) onSuccess()
      } else {
        setError(response.error || 'Failed to update media')
      }
    } catch (error) {
      console.error('Error updating media:', error)
      setError(error.response?.data?.error || 'An error occurred while updating the media')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      {error && <CAlert color="danger">{error}</CAlert>}

      <CForm onSubmit={handleSubmit}>
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

        <div className="mb-4">
          <CFormCheck
            id="isPublic"
            name="isPublic"
            label="Make this file public (accessible to all project members)"
            checked={formData.isPublic}
            onChange={handleInputChange}
          />
        </div>

        <div className="d-flex justify-content-end">
          <CButton
            color="secondary"
            variant="outline"
            onClick={onCancel}
            className="me-2"
            disabled={loading}
          >
            Cancel
          </CButton>
          <CButton type="submit" color="primary" disabled={loading || !formData.title}>
            {loading ? (
              <>
                <CSpinner size="sm" className="me-2" /> Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </CButton>
        </div>
      </CForm>
    </div>
  )
}

export default MediaEdit
