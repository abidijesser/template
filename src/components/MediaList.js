import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { List, Card, Button, Modal, message } from 'antd'
import { DeleteOutlined, EditOutlined } from '@ant-design/icons'

const MediaList = ({ taskId }) => {
  const [medias, setMedias] = useState([])
  const [loading, setLoading] = useState(false)

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

  return (
    <List
      grid={{ gutter: 16, column: 2 }}
      dataSource={medias}
      loading={loading}
      renderItem={(media) => (
        <List.Item>
          <Card
            title={media.name}
            actions={[
              <Button icon={<DeleteOutlined />} onClick={() => handleDelete(media._id)} danger />,
            ]}
          >
            <p>Type: {media.type}</p>
            <p>Contenu: {media.content}</p>
            <p>Date: {new Date(media.uploadedDate).toLocaleDateString()}</p>
          </Card>
        </List.Item>
      )}
    />
  )
}

export default MediaList
