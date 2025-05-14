import React, { useEffect, useRef, useState } from 'react'
import { CChartLine } from '@coreui/react-chartjs'
import { getStyle } from '@coreui/utils'
import { CFormSelect, CSpinner, CButtonGroup, CButton } from '@coreui/react'
import axios from 'axios'

const MainChart = () => {
  const chartRef = useRef(null)
  const [projects, setProjects] = useState([])
  const [selectedProject, setSelectedProject] = useState('')
  const [viewType, setViewType] = useState('month') // 'month' or 'day'
  const [activityData, setActivityData] = useState({
    labels: [],
    datasets: [
      {
        label: 'Tâches créées',
        data: [],
        borderColor: getStyle('--cui-info'),
        backgroundColor: `rgba(${getStyle('--cui-info-rgb')}, .1)`,
        fill: true,
      },
      {
        label: 'Tâches terminées',
        data: [],
        borderColor: getStyle('--cui-success'),
        backgroundColor: 'transparent',
      },
      {
        label: 'Commentaires',
        data: [],
        borderColor: getStyle('--cui-warning'),
        backgroundColor: 'transparent',
      },
    ],
  })
  const [tasksData, setTasksData] = useState([]) // Store raw tasks data
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Fetch projects on component mount
  useEffect(() => {
    fetchProjects()
  }, [])

  // Fetch activity data when selected project or view type changes
  useEffect(() => {
    if (selectedProject) {
      fetchProjectActivity(selectedProject)
    } else {
      // Generate aggregate data for all projects
      fetchAllProjectsActivity()
    }
  }, [selectedProject])

  // Process data when view type changes or when we get new tasks data
  useEffect(() => {
    if (tasksData.length > 0) {
      processTasksDataByViewType(tasksData)
    }
  }, [viewType, tasksData])

  // Fetch activity data for all projects
  const fetchAllProjectsActivity = async () => {
    try {
      setLoading(true)
      setError(null)

      const token = localStorage.getItem('token')
      if (!token) {
        setError('No authentication token found')
        setLoading(false)
        return
      }

      try {
        // Fetch all tasks directly
        const tasksResponse = await axios.get(`http://localhost:3001/api/tasks`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        // Check if we got tasks data
        if (tasksResponse.data && (tasksResponse.data.tasks || Array.isArray(tasksResponse.data))) {
          const tasks = tasksResponse.data.tasks || tasksResponse.data
          if (tasks.length > 0) {
            // Store the raw tasks data
            setTasksData(tasks)
            return
          }
        }

        // If no tasks found, set empty data
        setTasksData([])
        setActivityData({
          labels: [],
          datasets: [
            {
              label: 'Tâches créées',
              data: [],
              borderColor: getStyle('--cui-info'),
              backgroundColor: `rgba(${getStyle('--cui-info-rgb')}, .1)`,
              fill: true,
            },
            {
              label: 'Tâches terminées',
              data: [],
              borderColor: getStyle('--cui-success'),
              backgroundColor: 'transparent',
            },
            {
              label: 'Commentaires',
              data: [],
              borderColor: getStyle('--cui-warning'),
              backgroundColor: 'transparent',
            },
          ],
        })
      } catch (apiError) {
        console.log('API error fetching tasks:', apiError)
        setError('Failed to fetch tasks data')
        setTasksData([])
      }
    } catch (error) {
      console.error('Error fetching all projects activity data:', error)
      setError('Failed to fetch activity data')
    } finally {
      setLoading(false)
    }
  }

  // Update chart colors when theme changes
  useEffect(() => {
    document.documentElement.addEventListener('ColorSchemeChange', () => {
      if (chartRef.current) {
        setTimeout(() => {
          chartRef.current.options.scales.x.grid.borderColor = getStyle(
            '--cui-border-color-translucent',
          )
          chartRef.current.options.scales.x.grid.color = getStyle('--cui-border-color-translucent')
          chartRef.current.options.scales.x.ticks.color = getStyle('--cui-body-color')
          chartRef.current.options.scales.y.grid.borderColor = getStyle(
            '--cui-border-color-translucent',
          )
          chartRef.current.options.scales.y.grid.color = getStyle('--cui-border-color-translucent')
          chartRef.current.options.scales.y.ticks.color = getStyle('--cui-body-color')
          chartRef.current.update()
        })
      }
    })
  }, [chartRef])

  // Fetch all projects
  const fetchProjects = async () => {
    try {
      setLoading(true)
      setError(null)

      const token = localStorage.getItem('token')
      if (!token) {
        setError('No authentication token found')
        setLoading(false)
        return
      }

      const response = await axios.get('http://localhost:3001/api/projects', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.data.success && response.data.projects) {
        setProjects(response.data.projects)
      } else if (Array.isArray(response.data)) {
        setProjects(response.data)
      } else {
        setProjects([])
      }
    } catch (error) {
      console.error('Error fetching projects:', error)
      setError('Failed to fetch projects')
    } finally {
      setLoading(false)
    }
  }

  // Fetch activity data for a specific project
  const fetchProjectActivity = async (projectId) => {
    try {
      setLoading(true)
      setError(null)

      const token = localStorage.getItem('token')
      if (!token) {
        setError('No authentication token found')
        setLoading(false)
        return
      }

      try {
        // Fetch tasks for the project directly
        const tasksResponse = await axios.get(
          `http://localhost:3001/api/tasks?project=${projectId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        )

        // Check if we got tasks data
        if (tasksResponse.data && (tasksResponse.data.tasks || Array.isArray(tasksResponse.data))) {
          const tasks = tasksResponse.data.tasks || tasksResponse.data
          if (tasks.length > 0) {
            // Store the raw tasks data
            setTasksData(tasks)
            return
          }
        }

        // If no tasks found, set empty data
        setTasksData([])
        setActivityData({
          labels: [],
          datasets: [
            {
              label: 'Tâches créées',
              data: [],
              borderColor: getStyle('--cui-info'),
              backgroundColor: `rgba(${getStyle('--cui-info-rgb')}, .1)`,
              fill: true,
            },
            {
              label: 'Tâches terminées',
              data: [],
              borderColor: getStyle('--cui-success'),
              backgroundColor: 'transparent',
            },
            {
              label: 'Commentaires',
              data: [],
              borderColor: getStyle('--cui-warning'),
              backgroundColor: 'transparent',
            },
          ],
        })
      } catch (apiError) {
        console.log('API error fetching project tasks:', apiError)
        setError('Failed to fetch project tasks')
        setTasksData([])
      }
    } catch (error) {
      console.error('Error fetching project activity:', error)
      setError('Failed to fetch project activity')
    } finally {
      setLoading(false)
    }
  }

  // Process tasks data by view type (monthly or daily)
  const processTasksDataByViewType = (tasks) => {
    console.log('Processing tasks data by view type:', viewType, tasks)

    // Check if tasks array is valid
    if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
      console.log('No tasks to process')
      setActivityData({
        labels: [],
        datasets: [
          {
            label: 'Tâches créées',
            data: [],
            borderColor: getStyle('--cui-info'),
            backgroundColor: `rgba(${getStyle('--cui-info-rgb')}, .1)`,
            fill: true,
          },
          {
            label: 'Tâches terminées',
            data: [],
            borderColor: getStyle('--cui-success'),
            backgroundColor: 'transparent',
          },
          {
            label: 'Commentaires',
            data: [],
            borderColor: getStyle('--cui-warning'),
            backgroundColor: 'transparent',
          },
        ],
      })
      return
    }

    // Process data based on view type
    if (viewType === 'month') {
      processMonthlyData(tasks)
    } else {
      processDailyData(tasks)
    }
  }

  // Process tasks data for monthly view
  const processMonthlyData = (tasks) => {
    // Get current year
    const currentYear = new Date().getFullYear()

    // Initialize data for each month
    const months = [
      'Janvier',
      'Février',
      'Mars',
      'Avril',
      'Mai',
      'Juin',
      'Juillet',
      'Août',
      'Septembre',
      'Octobre',
      'Novembre',
      'Décembre',
    ]
    const tasksCreated = Array(12).fill(0)
    const tasksCompleted = Array(12).fill(0)
    const comments = Array(12).fill(0)

    // Process each task
    tasks.forEach((task) => {
      // Process creation date
      if (task.createdAt) {
        const createdDate = new Date(task.createdAt)
        if (createdDate.getFullYear() === currentYear) {
          const month = createdDate.getMonth()
          tasksCreated[month]++
        }
      } else {
        // If no creation date, assume it was created in the current month
        const currentMonth = new Date().getMonth()
        tasksCreated[currentMonth]++
      }

      // Process completion (tasks with status "Done")
      if (task.status === 'Done') {
        // Assume the task was completed recently if no specific completion date
        const completedDate = new Date()
        if (completedDate.getFullYear() === currentYear) {
          const month = completedDate.getMonth()
          tasksCompleted[month]++
        }
      }

      // Count comments if available
      if (task.comments && Array.isArray(task.comments)) {
        const commentCount = task.comments.length
        // Distribute comments evenly across recent months as we don't have comment dates
        const currentMonth = new Date().getMonth()
        comments[currentMonth] += commentCount
      }
    })

    // Update chart data
    setActivityData({
      labels: months,
      datasets: [
        {
          label: 'Tâches créées',
          data: tasksCreated,
          borderColor: getStyle('--cui-info'),
          backgroundColor: `rgba(${getStyle('--cui-info-rgb')}, .1)`,
          fill: true,
        },
        {
          label: 'Tâches terminées',
          data: tasksCompleted,
          borderColor: getStyle('--cui-success'),
          backgroundColor: 'transparent',
        },
        {
          label: 'Commentaires',
          data: comments,
          borderColor: getStyle('--cui-warning'),
          backgroundColor: 'transparent',
        },
      ],
    })
  }

  // Process tasks data for daily view
  const processDailyData = (tasks) => {
    // Get current date info
    const today = new Date()
    const currentMonth = today.getMonth()
    const currentYear = today.getFullYear()

    // Get number of days in current month
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()

    // Create labels for each day of the month
    const days = Array.from({ length: daysInMonth }, (_, i) => `${i + 1}`)

    // Initialize data arrays
    const tasksCreated = Array(daysInMonth).fill(0)
    const tasksCompleted = Array(daysInMonth).fill(0)
    const comments = Array(daysInMonth).fill(0)

    // Process each task
    tasks.forEach((task) => {
      // Process creation date
      if (task.createdAt) {
        const createdDate = new Date(task.createdAt)
        if (createdDate.getFullYear() === currentYear && createdDate.getMonth() === currentMonth) {
          const day = createdDate.getDate() - 1 // Adjust to 0-based index
          if (day >= 0 && day < daysInMonth) {
            tasksCreated[day]++
          }
        }
      } else {
        // If no creation date, assume it was created today
        const today = new Date().getDate() - 1 // Adjust to 0-based index
        if (today >= 0 && today < daysInMonth) {
          tasksCreated[today]++
        }
      }

      // Process completion (tasks with status "Done")
      if (task.status === 'Done') {
        // Assume the task was completed today if no specific completion date
        const today = new Date().getDate() - 1 // Adjust to 0-based index
        if (today >= 0 && today < daysInMonth) {
          tasksCompleted[today]++
        }
      }

      // Count comments if available
      if (task.comments && Array.isArray(task.comments)) {
        const commentCount = task.comments.length
        // Distribute comments to today as we don't have comment dates
        const today = new Date().getDate() - 1 // Adjust to 0-based index
        if (today >= 0 && today < daysInMonth) {
          comments[today] += commentCount
        }
      }
    })

    // Update chart data
    setActivityData({
      labels: days,
      datasets: [
        {
          label: 'Tâches créées',
          data: tasksCreated,
          borderColor: getStyle('--cui-info'),
          backgroundColor: `rgba(${getStyle('--cui-info-rgb')}, .1)`,
          fill: true,
        },
        {
          label: 'Tâches terminées',
          data: tasksCompleted,
          borderColor: getStyle('--cui-success'),
          backgroundColor: 'transparent',
        },
        {
          label: 'Commentaires',
          data: comments,
          borderColor: getStyle('--cui-warning'),
          backgroundColor: 'transparent',
        },
      ],
    })
  }

  // Handle project selection change
  const handleProjectChange = (e) => {
    setSelectedProject(e.target.value)
  }

  // Handle view type change
  const handleViewTypeChange = (type) => {
    setViewType(type)
  }

  return (
    <>
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div className="d-flex align-items-center">
          <label htmlFor="projectSelect" className="me-2 fw-bold">
            Sélectionner un projet:
          </label>
          <CFormSelect
            id="projectSelect"
            value={selectedProject}
            onChange={handleProjectChange}
            className="w-auto shadow-sm"
            style={{ minWidth: '200px' }}
          >
            <option value="">Tous les projets</option>
            {projects.map((project) => (
              <option key={project._id} value={project._id}>
                {project.projectName}
              </option>
            ))}
          </CFormSelect>
          {loading && <CSpinner size="sm" className="ms-2" />}
        </div>

        <CButtonGroup role="group" aria-label="View type" className="shadow-sm">
          <CButton
            color={viewType === 'month' ? 'primary' : 'outline-primary'}
            onClick={() => handleViewTypeChange('month')}
            active={viewType === 'month'}
            className="px-3"
          >
            Mois
          </CButton>
          <CButton
            color={viewType === 'day' ? 'primary' : 'outline-primary'}
            onClick={() => handleViewTypeChange('day')}
            active={viewType === 'day'}
            className="px-3"
          >
            Jour
          </CButton>
        </CButtonGroup>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="chart-container p-3 bg-white rounded shadow-sm">
        <h5 className="chart-title text-center mb-4 fw-bold">
          {viewType === 'month' ? 'Activité par mois' : 'Activité par jour'}
        </h5>
        <CChartLine
          ref={chartRef}
          style={{ height: '350px' }}
          data={activityData}
          options={{
            maintainAspectRatio: false,
            responsive: true,
            plugins: {
              legend: {
                display: true,
                position: 'top',
                align: 'center',
                labels: {
                  color: getStyle('--cui-body-color'),
                  usePointStyle: true,
                  padding: 20,
                  boxWidth: 10,
                  font: {
                    size: 12,
                  },
                },
              },
              tooltip: {
                mode: 'index',
                intersect: false,
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                titleFont: {
                  size: 14,
                  weight: 'bold',
                },
                bodyFont: {
                  size: 13,
                },
                padding: 10,
                callbacks: {
                  title: (context) => {
                    // Add appropriate title based on view type
                    if (viewType === 'month') {
                      return context[0].label + ' ' + new Date().getFullYear()
                    } else {
                      const currentMonth = new Date().toLocaleString('fr-FR', { month: 'long' })
                      return context[0].label + ' ' + currentMonth + ' ' + new Date().getFullYear()
                    }
                  },
                },
              },
              title: {
                display: false,
              },
            },
            scales: {
              x: {
                grid: {
                  color: getStyle('--cui-border-color-translucent'),
                  drawOnChartArea: false,
                },
                ticks: {
                  color: getStyle('--cui-body-color'),
                  maxRotation: viewType === 'day' ? 90 : 0,
                  minRotation: viewType === 'day' ? 45 : 0,
                  font: {
                    size: 11,
                  },
                },
                title: {
                  display: true,
                  text: viewType === 'month' ? 'Mois' : 'Jour',
                  color: getStyle('--cui-body-color'),
                  font: {
                    size: 13,
                    weight: 'bold',
                  },
                  padding: {
                    top: 10,
                  },
                },
              },
              y: {
                beginAtZero: true,
                border: {
                  color: getStyle('--cui-border-color-translucent'),
                },
                grid: {
                  color: getStyle('--cui-border-color-translucent'),
                },
                ticks: {
                  color: getStyle('--cui-body-color'),
                  maxTicksLimit: 6,
                  precision: 0, // Only show integer values
                  font: {
                    size: 11,
                  },
                },
                title: {
                  display: true,
                  text: 'Nombre',
                  color: getStyle('--cui-body-color'),
                  font: {
                    size: 13,
                    weight: 'bold',
                  },
                  padding: {
                    bottom: 10,
                  },
                },
              },
            },
            elements: {
              line: {
                tension: 0.4,
                borderWidth: 2,
              },
              point: {
                radius: 3,
                hitRadius: 10,
                hoverRadius: 5,
                hoverBorderWidth: 3,
              },
            },
          }}
        />
      </div>
    </>
  )
}

export default MainChart
