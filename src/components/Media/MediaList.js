import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { List, Card, Button, Modal, message, Space, Tag } from 'antd'
import { DeleteOutlined, EditOutlined, FileOutlined, CommentOutlined } from '@ant-design/icons'
import AddMediaForm from './AddMediaForm'
import EditMediaForm from './EditMediaForm'

const MediaList = ({ taskId }) => {
  const [medias, setMedias] = useState([])
  const [loading, setLoading] = useState(false)
  const [addModalVisible, setAddModalVisible] = useState(false)
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [selectedMedia, setSelectedMedia] = useState(null)

  const fetchMedias = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`http://localhost:3001/api/media/task/${taskId}`)
      setMedias(response.data.medias)
    } catch (error) {
      message.error('Erreur lors du chargement des médias')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMedias()
  }, [taskId])

  const handleDelete = async (mediaId) => {
    try {
      await axios.delete(`http://localhost:3001/api/media/${mediaId}`)
      message.success('Média supprimé avec succès')
      fetchMedias()
    } catch (error) {
      message.error('Erreur lors de la suppression')
    }
  }

  const handleEdit = (media) => {
    setSelectedMedia(media)
    setEditModalVisible(true)
  }

  const getMediaIcon = (type) => {
    switch (type) {
      case 'pdf':
        return <FileOutlined />
      case 'comment':
        return <CommentOutlined />
      default:
        return <FileOutlined />
    }
  }

  return (
    <>
      <div style={{ marginBottom: 16 }}>
        <Button type="primary" onClick={() => setAddModalVisible(true)}>
          Ajouter un média
        </Button>
      </div>

      <List
        grid={{ gutter: 16, column: 2 }}
        dataSource={medias}
        loading={loading}
        renderItem={(media) => (
          <List.Item>
            <Card
              title={
                <Space>
                  {getMediaIcon(media.type)}
                  {media.name}
                </Space>
              }
              extra={<Tag color={media.type === 'comment' ? 'blue' : 'green'}>{media.type}</Tag>}
              actions={[
                <Button icon={<EditOutlined />} onClick={() => handleEdit(media)} />,
                <Button icon={<DeleteOutlined />} onClick={() => handleDelete(media._id)} danger />,
              ]}
            >
              {media.type === 'comment' ? (
                <p>{media.content}</p>
              ) : (
                <a
                  href={`http://localhost:3001/${media.content}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Voir le fichier
                </a>
              )}
              <p>Par: {media.uploadedBy?.name}</p>
              <p>Date: {new Date(media.uploadedDate).toLocaleDateString()}</p>
            </Card>
          </List.Item>
        )}
      />

      <Modal
        title="Ajouter un média"
        open={addModalVisible}
        onCancel={() => setAddModalVisible(false)}
        footer={null}
      >
        <AddMediaForm
          taskId={taskId}
          onSuccess={() => {
            setAddModalVisible(false)
            fetchMedias()
          }}
        />
      </Modal>

      <Modal
        title="Modifier le média"
        open={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        footer={null}
      >
        <EditMediaForm
          media={selectedMedia}
          onSuccess={() => {
            setEditModalVisible(false)
            fetchMedias()
          }}
        />
      </Modal>
    </>
  )
}

export default MediaList
