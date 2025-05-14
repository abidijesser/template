import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { Form, Input, Button, Upload, message } from 'antd'
import { UploadOutlined } from '@ant-design/icons'

const EditMediaForm = ({ media, onSuccess }) => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [fileList, setFileList] = useState([])

  useEffect(() => {
    if (media) {
      form.setFieldsValue({
        content: media.type === 'comment' ? media.content : undefined,
        name: media.name,
      })
    }
  }, [media, form])

  const onFinish = async (values) => {
    try {
      setLoading(true)
      const formData = new FormData()

      if (media.type === 'comment') {
        formData.append('content', values.content)
      } else if (fileList.length > 0) {
        formData.append('file', fileList[0].originFileObj)
      }

      formData.append('type', media.type)
      formData.append('name', values.name)

      await axios.put(`http://localhost:3001/api/media/${media._id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      message.success('Média modifié avec succès')
      onSuccess?.()
    } catch (error) {
      message.error('Erreur lors de la modification du média')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Form form={form} onFinish={onFinish} layout="vertical">
      <Form.Item name="name" label="Nom" rules={[{ required: true }]}>
        <Input />
      </Form.Item>

      {media?.type === 'comment' ? (
        <Form.Item name="content" label="Contenu" rules={[{ required: true }]}>
          <Input.TextArea />
        </Form.Item>
      ) : (
        <Form.Item name="file" label="Nouveau fichier">
          <Upload
            fileList={fileList}
            onChange={({ fileList }) => setFileList(fileList)}
            beforeUpload={() => false}
          >
            <Button icon={<UploadOutlined />}>Changer le fichier</Button>
          </Upload>
        </Form.Item>
      )}

      <Form.Item>
        <Button type="primary" htmlType="submit" loading={loading}>
          Modifier
        </Button>
      </Form.Item>
    </Form>
  )
}

export default EditMediaForm
