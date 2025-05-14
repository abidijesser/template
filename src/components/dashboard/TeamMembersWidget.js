import React, { useState, useEffect } from 'react'
import { CCard, CCardHeader, CCardBody, CRow, CCol, CFormSelect, CSpinner } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilPeople, cilUserFollow, cilTask } from '@coreui/icons'
import { Link } from 'react-router-dom'
import axios from 'axios'

const TeamMembersWidget = () => {
  const [projects, setProjects] = useState([])
  const [selectedProject, setSelectedProject] = useState('')
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMembers, setLoadingMembers] = useState(false)

  // Fetch all projects
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) {
          console.error('No authentication token found')
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

          // If there are projects, select the first one by default
          if (response.data.projects.length > 0) {
            setSelectedProject(response.data.projects[0]._id)
          }
        }
      } catch (error) {
        console.error('Error fetching projects:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProjects()
  }, [])

  // Fetch members when selected project changes
  useEffect(() => {
    const fetchProjectMembers = async () => {
      if (!selectedProject) {
        setMembers([])
        return
      }

      setLoadingMembers(true)
      try {
        const token = localStorage.getItem('token')
        if (!token) {
          console.error('No authentication token found')
          setLoadingMembers(false)
          return
        }

        // First get the project details to identify the owner
        const projectResponse = await axios.get(
          `http://localhost:3001/api/projects/${selectedProject}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        )

        if (!projectResponse.data.success || !projectResponse.data.project) {
          console.error('Failed to fetch project details')
          setLoadingMembers(false)
          setMembers([])
          return
        }

        const projectDetails = projectResponse.data.project
        const projectOwnerId = projectDetails.owner?._id || projectDetails.owner

        // Get all tasks for this project
        const tasksResponse = await axios.get(
          `http://localhost:3001/api/tasks?project=${selectedProject}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        )

        const projectTasks = tasksResponse.data.success ? tasksResponse.data.tasks : []

        // Get members details
        const membersResponse = await axios.get(
          `http://localhost:3001/api/projects/${selectedProject}/members`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        )

        if (membersResponse.data.success && membersResponse.data.members) {
          // Process members with their tasks
          const membersWithTasks = membersResponse.data.members.map((member) => {
            // Count tasks assigned to this member in this project
            const memberTasks = projectTasks.filter(
              (task) =>
                task.assignedTo &&
                (task.assignedTo._id === member._id || task.assignedTo === member._id),
            )

            // Determine status (in a real app, this would come from the user's online status)
            let statusIndex = 0 // Default: En ligne (green)

            if (
              member.name.toLowerCase().includes('rami') ||
              member.name.toLowerCase().includes('zied')
            ) {
              statusIndex = 1 // Absent (red dot)
            }

            // Check if this member is the project owner
            const isProjectOwner =
              projectOwnerId && (member._id === projectOwnerId || member._id === projectOwnerId._id)

            return {
              ...member,
              tasks: memberTasks.length,
              status: ['En ligne', 'Absent', 'Occupé'][statusIndex],
              statusColor: ['success', 'danger', 'warning'][statusIndex],
              isProjectOwner: isProjectOwner,
            }
          })

          setMembers(membersWithTasks)
        } else {
          setMembers([])
        }
      } catch (error) {
        console.error('Error fetching project members:', error)
        setMembers([])
      } finally {
        setLoadingMembers(false)
      }
    }

    fetchProjectMembers()
  }, [selectedProject])

  // Get first letter of name for avatar
  const getFirstLetter = (name) => {
    return name.charAt(0).toLowerCase()
  }

  return (
    <CCard className="dashboard-card h-100 shadow-sm">
      <CCardHeader className="dashboard-card-header d-flex align-items-center">
        <h4 className="mb-0 fs-5">
          <CIcon icon={cilPeople} className="me-2 text-primary" />
          Membres de l'équipe
        </h4>
      </CCardHeader>
      <CCardBody>
        {loading ? (
          <div className="text-center my-3">
            <CSpinner color="primary" />
            <p className="mt-2">Chargement des projets...</p>
          </div>
        ) : (
          <>
            <div className="project-selector" style={{ marginBottom: '1.25rem' }}>
              <label
                htmlFor="project-select"
                className="form-label mb-2"
                style={{
                  fontWeight: '500',
                  color: '#4a5568',
                  fontSize: '0.95rem',
                }}
              >
                Sélectionner un projet:
              </label>
              <CFormSelect
                id="project-select"
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                aria-label="Sélectionner un projet"
                className="form-select"
                style={{
                  borderRadius: '8px',
                  padding: '10px 15px',
                  fontSize: '0.95rem',
                  boxShadow: '0 2px 5px rgba(0, 0, 0, 0.05)',
                  borderColor: '#e2e8f0',
                  transition: 'all 0.3s ease',
                }}
              >
                <option value="">Tous les projets</option>
                {projects.map((project) => (
                  <option key={project._id} value={project._id}>
                    {project.projectName}{' '}
                    {project.members &&
                      project.members.length > 0 &&
                      `(${project.members.length} membres)`}
                  </option>
                ))}
              </CFormSelect>
            </div>

            {loadingMembers ? (
              <div className="members-loading">
                <CSpinner color="primary" size="sm" />
                <p className="mt-2">Chargement des membres...</p>
              </div>
            ) : (
              <div className="team-members">
                <CRow className="g-3">
                  {members.length > 0 ? (
                    members.map((member, index) => (
                      <CCol md={12} lg={6} key={index}>
                        <div
                          className={`team-member-card p-3 border rounded h-100 ${member.isProjectOwner ? 'border-primary' : ''}`}
                          style={{
                            transition: 'all 0.3s ease',
                            boxShadow: member.isProjectOwner
                              ? '0 2px 8px rgba(50, 31, 219, 0.15)'
                              : '0 2px 5px rgba(0, 0, 0, 0.05)',
                            borderRadius: '12px',
                            backgroundColor: member.isProjectOwner
                              ? 'rgba(50, 31, 219, 0.02)'
                              : 'white',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-3px)'
                            e.currentTarget.style.boxShadow = '0 8px 15px rgba(0, 0, 0, 0.1)'
                            if (!member.isProjectOwner) {
                              e.currentTarget.style.borderColor = '#d8dbe0'
                              e.currentTarget.style.backgroundColor = '#f8f9fa'
                            }
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)'
                            e.currentTarget.style.boxShadow = member.isProjectOwner
                              ? '0 2px 8px rgba(50, 31, 219, 0.15)'
                              : '0 2px 5px rgba(0, 0, 0, 0.05)'
                            if (!member.isProjectOwner) {
                              e.currentTarget.style.borderColor = '#d8dbe0'
                              e.currentTarget.style.backgroundColor = 'white'
                            }
                          }}
                        >
                          <div className="d-flex align-items-center">
                            <div
                              className="member-avatar me-3 text-white rounded-circle d-flex align-items-center justify-content-center"
                              style={{
                                width: '50px',
                                height: '50px',
                                backgroundColor: member.isProjectOwner ? '#4F46E5' : '#6366F1',
                                boxShadow: '0 4px 8px rgba(79, 70, 229, 0.25)',
                                fontSize: '1.3rem',
                                fontWeight: '600',
                                border: member.isProjectOwner ? '2px solid #4338CA' : 'none',
                              }}
                            >
                              {getFirstLetter(member.name)}
                            </div>
                            <div>
                              <h6
                                className="mb-0 d-flex align-items-center"
                                style={{ fontWeight: '600', fontSize: '1rem' }}
                              >
                                {member.name}
                                <span
                                  className="ms-2 rounded-circle"
                                  style={{
                                    width: '10px',
                                    height: '10px',
                                    backgroundColor: `var(--cui-${member.statusColor})`,
                                    display: 'inline-block',
                                    boxShadow: `0 0 0 2px white, 0 0 0 3px var(--cui-${member.statusColor}-border, #e9ecef)`,
                                  }}
                                  title={member.status}
                                ></span>
                              </h6>
                              {member.isProjectOwner ? (
                                <p className="small mb-0" style={{ marginTop: '4px' }}>
                                  <span
                                    className="badge bg-primary text-white me-1"
                                    style={{
                                      padding: '4px 8px',
                                      fontWeight: '500',
                                      borderRadius: '4px',
                                    }}
                                  >
                                    Owner
                                  </span>
                                  <span style={{ color: '#4a5568', fontSize: '0.85rem' }}>
                                    Project Owner
                                  </span>
                                </p>
                              ) : (
                                <p
                                  className="text-muted small mb-0"
                                  style={{
                                    marginTop: '4px',
                                    color: '#718096',
                                    fontSize: '0.85rem',
                                  }}
                                >
                                  Client
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="mt-3">
                            <span
                              className="badge bg-light text-dark"
                              style={{
                                padding: '6px 10px',
                                borderRadius: '6px',
                                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
                                border: '1px solid #e2e8f0',
                                fontWeight: '500',
                              }}
                            >
                              <CIcon
                                icon={cilTask}
                                size="sm"
                                className="me-1"
                                style={{ color: '#4F46E5' }}
                              />
                              {member.tasks} tâches
                            </span>
                          </div>
                        </div>
                      </CCol>
                    ))
                  ) : (
                    <CCol xs={12}>
                      <div
                        className="no-members"
                        style={{
                          padding: '2rem 1rem',
                          borderRadius: '12px',
                          backgroundColor: '#f8fafc',
                          border: '1px dashed #cbd5e0',
                          textAlign: 'center',
                        }}
                      >
                        <CIcon
                          icon={cilPeople}
                          size="xl"
                          className="text-muted mb-3"
                          style={{
                            opacity: 0.6,
                            width: '48px',
                            height: '48px',
                          }}
                        />
                        <p
                          className="mb-0"
                          style={{
                            color: '#64748b',
                            fontWeight: '500',
                            fontSize: '0.95rem',
                          }}
                        >
                          {selectedProject
                            ? 'Aucun membre trouvé pour ce projet'
                            : 'Veuillez sélectionner un projet pour voir ses membres'}
                        </p>
                      </div>
                    </CCol>
                  )}
                </CRow>
              </div>
            )}
          </>
        )}
      </CCardBody>
    </CCard>
  )
}

export default TeamMembersWidget
