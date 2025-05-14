import React, { useState } from 'react'
import axios from 'axios'
import { Form, Input, Select, Button, Upload, message } from 'antd'
import { UploadOutlined } from '@ant-design/icons'

const { Option } = Select

const AddMediaForm = ({ taskId, onSuccess }) => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [fileList, setFileList] = useState([])

  const onFinish = async (values) => {
    try {
      setLoading(true)
      const formData = new FormData()
      formData.append('taskId', taskId)
      formData.append('type', values.type)
      formData.append('name', values.name)

      if (values.type === 'comment') {
        formData.append('content', values.content)
      } else if (fileList.length > 0) {
        formData.append('file', fileList[0].originFileObj)
      }

      await axios.post('http://localhost:3001/api/media', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      message.success('Média ajouté avec succès')
      form.resetFields()
      setFileList([])
      onSuccess?.()
    } catch (error) {
      message.error("Erreur lors de l'ajout du média")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Form form={form} onFinish={onFinish} layout="vertical">
      <Form.Item name="type" label="Type" rules={[{ required: true }]}>
        <Select>
          <Option value="comment">Commentaire</Option>
          <Option value="pdf">PDF</Option>
          <Option value="video">Vidéo</Option>
        </Select>
      </Form.Item>

      <Form.Item name="name" label="Nom" rules={[{ required: true }]}>
        <Input />
      </Form.Item>

      <Form.Item
        noStyle
        shouldUpdate={(prevValues, currentValues) => prevValues.type !== currentValues.type}
      >
        {({ getFieldValue }) =>
          getFieldValue('type') === 'comment' ? (
            <Form.Item name="content" label="Contenu" rules={[{ required: true }]}>
              <Input.TextArea />
            </Form.Item>
          ) : (
            <Form.Item name="file" label="Fichier" rules={[{ required: true }]}>
              <Upload
                fileList={fileList}
                onChange={({ fileList }) => setFileList(fileList)}
                beforeUpload={() => false}
              >
                <Button icon={<UploadOutlined />}>Sélectionner un fichier</Button>
              </Upload>
            </Form.Item>
          )
        }
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit" loading={loading}>
          Ajouter
        </Button>
      </Form.Item>
    </Form>
  )
}

export default AddMediaForm
