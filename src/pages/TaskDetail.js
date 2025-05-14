import React from 'react'
import { Card } from 'antd'
import MediaList from '../components/Media/MediaList'

const TaskDetail = ({ taskId }) => {
  return (
    <Card title="Détails de la tâche">
      <MediaList taskId={taskId} />
    </Card>
  )
}

export default TaskDetail
