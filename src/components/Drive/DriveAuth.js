import React, { useState, useEffect } from 'react'
import { Button, Alert, Spin, Space, Typography, message } from 'antd'
import { CloudOutlined, DisconnectOutlined } from '@ant-design/icons'
import {
  checkGoogleDriveAuth,
  getGoogleDriveAuthUrl,
  removeGoogleDriveToken,
} from '../../services/driveService'

const { Text } = Typography

const DriveAuth = ({ onAuthStatusChange }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await checkGoogleDriveAuth()

      if (response.success) {
        setIsAuthenticated(response.isAuthenticated)
        if (onAuthStatusChange) {
          onAuthStatusChange(response.isAuthenticated)
        }
      } else {
        setError("Erreur lors de la vérification de l'authentification Google Drive")
      }
    } catch (err) {
      setError("Erreur lors de la vérification de l'authentification Google Drive")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleConnect = async () => {
    setLoading(true)
    setError(null)

    try {
      console.log('Requesting Google Drive auth URL...')
      const response = await getGoogleDriveAuthUrl()
      console.log('Auth URL response:', response)

      if (response.success && response.authUrl) {
        // Log the auth URL (for debugging)
        console.log('Opening auth URL:', response.authUrl)

        // Open the auth URL in a new window
        const authWindow = window.open(response.authUrl, '_blank')

        if (!authWindow) {
          setError(
            "Le navigateur a bloqué l'ouverture de la fenêtre d'authentification. Veuillez autoriser les popups pour ce site.",
          )
          setLoading(false)
          return
        }

        // Show a message to the user
        message.info(
          "Une nouvelle fenêtre a été ouverte pour l'authentification Google Drive. Veuillez compléter le processus d'authentification.",
        )

        // Start checking auth status periodically
        const checkInterval = setInterval(async () => {
          console.log('Checking auth status...')
          const authStatus = await checkGoogleDriveAuth()
          console.log('Auth status:', authStatus)

          if (authStatus.success && authStatus.isAuthenticated) {
            clearInterval(checkInterval)
            setIsAuthenticated(true)
            if (onAuthStatusChange) {
              onAuthStatusChange(true)
            }
            message.success('Connexion à Google Drive réussie!')
          }
        }, 5000) // Check every 5 seconds

        // Clear interval after 2 minutes (timeout)
        setTimeout(() => {
          clearInterval(checkInterval)
          if (!isAuthenticated) {
            setError("Le délai d'authentification a expiré. Veuillez réessayer.")
          }
        }, 120000)
      } else {
        console.error('Error in auth URL response:', response)
        setError(response.error || "Erreur lors de la génération de l'URL d'authentification")
      }
    } catch (err) {
      console.error('Exception during auth URL request:', err)
      setError(
        "Erreur lors de la génération de l'URL d'authentification: " +
          (err.message || 'Unknown error'),
      )
    } finally {
      setLoading(false)
    }
  }

  const handleDisconnect = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await removeGoogleDriveToken()

      if (response.success) {
        setIsAuthenticated(false)
        if (onAuthStatusChange) {
          onAuthStatusChange(false)
        }
      } else {
        setError('Erreur lors de la déconnexion de Google Drive')
      }
    } catch (err) {
      setError('Erreur lors de la déconnexion de Google Drive')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <Spin tip="Chargement..." />
  }

  return (
    <div style={{ marginBottom: 16 }}>
      {error && (
        <Alert
          message="Erreur"
          description={error}
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <Space direction="vertical" style={{ width: '100%' }}>
        {isAuthenticated ? (
          <>
            <Alert
              message="Connecté à Google Drive"
              description="Vous pouvez maintenant utiliser les fonctionnalités de Google Drive."
              type="success"
              showIcon
            />
            <Button icon={<DisconnectOutlined />} onClick={handleDisconnect} danger>
              Déconnecter Google Drive
            </Button>
          </>
        ) : (
          <>
            <Alert
              message="Non connecté à Google Drive"
              description="Connectez-vous à Google Drive pour utiliser ses fonctionnalités."
              type="info"
              showIcon
            />
            <Button type="primary" icon={<CloudOutlined />} onClick={handleConnect}>
              Connecter à Google Drive
            </Button>
          </>
        )}

        <Text type="secondary">
          La connexion à Google Drive vous permet de stocker et de gérer vos fichiers dans le cloud.
        </Text>
      </Space>
    </div>
  )
}

export default DriveAuth
