import React, { useState, useEffect } from 'react'
import { Tabs, Card, Typography, Divider, message } from 'antd'
import { CloudOutlined, UploadOutlined, FileOutlined } from '@ant-design/icons'
import DriveAuth from './DriveAuth'
import DriveFileUpload from './DriveFileUpload'
import DriveFileList from './DriveFileList'
import axios from '../../utils/axios'

const { Title, Text } = Typography
const { TabPane } = Tabs

const DriveManager = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    setLoading(true)
    try {
      const response = await axios.get('/api/projects')
      console.log('Projects response:', response.data)

      if (response.data.success) {
        // The API returns projects in response.data.projects, not response.data.data
        const projectsData = response.data.projects || []
        console.log('Projects data structure:', projectsData)

        // Check if projects have the expected structure
        if (projectsData.length > 0) {
          console.log('First project structure:', JSON.stringify(projectsData[0], null, 2))
        }

        setProjects(projectsData)
      } else {
        message.error('Erreur lors de la récupération des projets')
      }
    } catch (error) {
      console.error('Error fetching projects:', error)
      message.error('Erreur lors de la récupération des projets')
    } finally {
      setLoading(false)
    }
  }

  const handleAuthStatusChange = (status) => {
    setIsAuthenticated(status)
  }

  const handleUploadSuccess = () => {
    message.success('Fichier téléchargé avec succès')
    // Refresh file list
  }

  return (
    <Card>
      <Title level={3}>
        <CloudOutlined /> Google Drive
      </Title>
      <Text type="secondary">
        Gérez vos fichiers dans Google Drive directement depuis l'application.
      </Text>

      <Divider />

      <DriveAuth onAuthStatusChange={handleAuthStatusChange} />

      <Tabs defaultActiveKey="files">
        <TabPane
          tab={
            <span>
              <FileOutlined />
              Mes fichiers
            </span>
          }
          key="files"
        >
          <DriveFileList isAuthenticated={isAuthenticated} projects={projects} />
        </TabPane>
        <TabPane
          tab={
            <span>
              <UploadOutlined />
              Télécharger
            </span>
          }
          key="upload"
        >
          <DriveFileUpload
            projects={projects}
            onUploadSuccess={handleUploadSuccess}
            isAuthenticated={isAuthenticated}
          />
        </TabPane>
      </Tabs>
    </Card>
  )
}

export default DriveManager
