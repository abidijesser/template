import React, { useState, useEffect } from 'react'
import {
  Table,
  Button,
  Space,
  Typography,
  Input,
  Spin,
  Alert,
  Empty,
  Tag,
  Tooltip,
  message,
} from 'antd'
import {
  FileOutlined,
  FileImageOutlined,
  FileWordOutlined,
  FilePdfOutlined,
  FileExcelOutlined,
  FilePptOutlined,
  FileZipOutlined,
  FileUnknownOutlined,
  SearchOutlined,
  ReloadOutlined,
  EyeOutlined,
  DownloadOutlined,
  ImportOutlined,
} from '@ant-design/icons'
import { listDriveFiles } from '../../services/driveService'
import DriveFileImport from './DriveFileImport'

const { Title, Text } = Typography
const { Search } = Input

const DriveFileList = ({ isAuthenticated, projects = [] }) => {
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [nextPageToken, setNextPageToken] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [importModalVisible, setImportModalVisible] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)

  useEffect(() => {
    if (isAuthenticated) {
      fetchFiles()
    }
  }, [isAuthenticated])

  const fetchFiles = async (query = '') => {
    if (!isAuthenticated) return

    setLoading(true)
    setError(null)

    try {
      const options = {
        pageSize: 20,
        query: query || searchQuery,
      }

      const response = await listDriveFiles(options)

      if (response.success) {
        setFiles(response.files)
        setNextPageToken(response.nextPageToken)
      } else {
        if (response.needsAuth) {
          setError('Vous devez vous reconnecter à Google Drive')
        } else {
          setError(`Erreur lors de la récupération des fichiers: ${response.error}`)
        }
        setFiles([])
      }
    } catch (err) {
      setError('Erreur lors de la récupération des fichiers')
      console.error(err)
      setFiles([])
    } finally {
      setLoading(false)
    }
  }

  const loadMoreFiles = async () => {
    if (!isAuthenticated || !nextPageToken) return

    setLoading(true)

    try {
      const options = {
        pageSize: 20,
        pageToken: nextPageToken,
        query: searchQuery,
      }

      const response = await listDriveFiles(options)

      if (response.success) {
        setFiles([...files, ...response.files])
        setNextPageToken(response.nextPageToken)
      } else {
        if (response.needsAuth) {
          setError('Vous devez vous reconnecter à Google Drive')
        } else {
          setError(`Erreur lors de la récupération des fichiers: ${response.error}`)
        }
      }
    } catch (err) {
      setError('Erreur lors de la récupération des fichiers supplémentaires')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (value) => {
    setSearchQuery(value)
    fetchFiles(value)
  }

  const handleRefresh = () => {
    fetchFiles()
  }

  const handleImportClick = (record) => {
    setSelectedFile(record)
    setImportModalVisible(true)
  }

  const handleImportCancel = () => {
    setImportModalVisible(false)
    setSelectedFile(null)
  }

  const handleImportSuccess = (importedFile) => {
    message.success(`Fichier "${importedFile.title}" importé avec succès`)
    setImportModalVisible(false)
    setSelectedFile(null)
  }

  const getFileIcon = (mimeType) => {
    if (mimeType.includes('image/')) {
      return <FileImageOutlined style={{ fontSize: '20px', color: '#36cfc9' }} />
    } else if (mimeType.includes('application/pdf')) {
      return <FilePdfOutlined style={{ fontSize: '20px', color: '#f5222d' }} />
    } else if (
      mimeType.includes('application/msword') ||
      mimeType.includes('application/vnd.openxmlformats-officedocument.wordprocessingml')
    ) {
      return <FileWordOutlined style={{ fontSize: '20px', color: '#1890ff' }} />
    } else if (
      mimeType.includes('application/vnd.ms-excel') ||
      mimeType.includes('application/vnd.openxmlformats-officedocument.spreadsheetml')
    ) {
      return <FileExcelOutlined style={{ fontSize: '20px', color: '#52c41a' }} />
    } else if (
      mimeType.includes('application/vnd.ms-powerpoint') ||
      mimeType.includes('application/vnd.openxmlformats-officedocument.presentationml')
    ) {
      return <FilePptOutlined style={{ fontSize: '20px', color: '#fa8c16' }} />
    } else if (mimeType.includes('application/zip') || mimeType.includes('application/x-rar')) {
      return <FileZipOutlined style={{ fontSize: '20px', color: '#722ed1' }} />
    } else {
      return <FileOutlined style={{ fontSize: '20px', color: '#8c8c8c' }} />
    }
  }

  const formatFileSize = (bytes) => {
    if (!bytes) return 'N/A'

    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    if (bytes === 0) return '0 Byte'
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)))
    return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i]
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'

    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const columns = [
    {
      title: 'Type',
      dataIndex: 'mimeType',
      key: 'mimeType',
      width: 70,
      render: (mimeType) => getFileIcon(mimeType),
    },
    {
      title: 'Nom',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{text}</Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.mimeType}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Taille',
      dataIndex: 'size',
      key: 'size',
      width: 120,
      render: (size) => formatFileSize(size),
    },
    {
      title: 'Modifié le',
      dataIndex: 'modifiedTime',
      key: 'modifiedTime',
      width: 180,
      render: (date) => formatDate(date),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 200,
      render: (_, record) => (
        <Space>
          <Tooltip title="Voir">
            <Button
              type="primary"
              icon={<EyeOutlined />}
              size="small"
              onClick={() => window.open(record.webViewLink, '_blank')}
            />
          </Tooltip>
          {record.webContentLink && (
            <Tooltip title="Télécharger">
              <Button
                icon={<DownloadOutlined />}
                size="small"
                onClick={() => window.open(record.webContentLink, '_blank')}
              />
            </Tooltip>
          )}
          <Tooltip title="Importer dans l'application">
            <Button
              icon={<ImportOutlined />}
              size="small"
              type="dashed"
              onClick={() => handleImportClick(record)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ]

  if (!isAuthenticated) {
    return (
      <Alert
        message="Non connecté à Google Drive"
        description="Vous devez vous connecter à Google Drive pour voir vos fichiers."
        type="warning"
        showIcon
      />
    )
  }

  return (
    <div>
      <Space direction="vertical" style={{ width: '100%', marginBottom: 16 }}>
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Title level={4}>Mes fichiers Google Drive</Title>
          <Button icon={<ReloadOutlined />} onClick={handleRefresh} loading={loading}>
            Actualiser
          </Button>
        </Space>

        <Search
          placeholder="Rechercher des fichiers..."
          allowClear
          enterButton={<SearchOutlined />}
          size="large"
          onSearch={handleSearch}
          loading={loading}
          style={{ marginBottom: 16 }}
        />

        {error && (
          <Alert
            message="Erreur"
            description={error}
            type="error"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        {loading && files.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 24 }}>
            <Spin size="large" />
            <div style={{ marginTop: 16 }}>Chargement des fichiers...</div>
          </div>
        ) : files.length === 0 ? (
          <Empty description="Aucun fichier trouvé" />
        ) : (
          <>
            <Table
              dataSource={files}
              columns={columns}
              rowKey="id"
              pagination={false}
              loading={loading}
              size="middle"
            />

            {nextPageToken && (
              <div style={{ textAlign: 'center', marginTop: 16 }}>
                <Button onClick={loadMoreFiles} loading={loading}>
                  Charger plus de fichiers
                </Button>
              </div>
            )}
          </>
        )}
      </Space>

      {/* Import Modal */}
      <DriveFileImport
        visible={importModalVisible}
        onCancel={handleImportCancel}
        onSuccess={handleImportSuccess}
        fileData={selectedFile}
        projects={projects}
      />
    </div>
  )
}

export default DriveFileList
