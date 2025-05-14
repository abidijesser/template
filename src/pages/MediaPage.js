import React, { useState } from 'react'
import { Card, Button, Modal } from 'antd'
import MediaList from '../components/MediaList'
import AddMediaForm from '../components/AddMediaForm'

const MediaPage = ({ taskId }) => {
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [mediaListKey, setMediaListKey] = useState(0)

  const handleAddSuccess = () => {
    setIsModalVisible(false)
    setMediaListKey((prev) => prev + 1)
  }

  return (
    <div style={{ padding: '24px' }}>
      <Card
        title="Médias"
        extra={
          <Button type="primary" onClick={() => setIsModalVisible(true)}>
            Ajouter un média
          </Button>
        }
      >
        <MediaList key={mediaListKey} taskId={taskId} />
      </Card>

      <Modal
        title="Ajouter un média"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
      >
        <AddMediaForm taskId={taskId} onSuccess={handleAddSuccess} />
      </Modal>
    </div>
  )
}

export default MediaPage
