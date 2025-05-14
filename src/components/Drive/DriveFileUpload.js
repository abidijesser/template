import React, { useState } from 'react'
import { Upload, Button, Form, Input, Select, Switch, message, Alert, Spin } from 'antd'
import { UploadOutlined } from '@ant-design/icons'
import { uploadFileToDrive } from '../../services/driveService'

const { Option } = Select
const { TextArea } = Input

const DriveFileUpload = ({ projects = [], onUploadSuccess, isAuthenticated }) => {
  const [form] = Form.useForm()
  const [fileList, setFileList] = useState([])
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)

  const handleUpload = async (values) => {
    if (fileList.length === 0) {
      message.error('Veuillez sélectionner un fichier')
      return
    }

    setUploading(true)
    setError(null)

    const formData = new FormData()
    formData.append('file', fileList[0].originFileObj)
    formData.append('title', values.title || fileList[0].name)
    formData.append('description', values.description || '')

    if (values.project) {
      formData.append('project', values.project)
    }

    if (values.task) {
      formData.append('task', values.task)
    }

    formData.append('isPublic', values.isPublic || false)

    try {
      const response = await uploadFileToDrive(formData)

      if (response.success) {
        message.success('Fichier téléchargé avec succès sur Google Drive')
        form.resetFields()
        setFileList([])

        if (onUploadSuccess) {
          onUploadSuccess(response.data)
        }
      } else {
        if (response.needsAuth) {
          setError(
            'Vous devez vous connecter à Google Drive. Veuillez utiliser le bouton de connexion ci-dessus.',
          )
        } else {
          setError(`Erreur lors du téléchargement: ${response.error}`)
        }
      }
    } catch (err) {
      setError('Erreur lors du téléchargement du fichier')
      console.error(err)
    } finally {
      setUploading(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <Alert
        message="Non connecté à Google Drive"
        description="Vous devez vous connecter à Google Drive pour télécharger des fichiers."
        type="warning"
        showIcon
      />
    )
  }

  return (
    <div>
      {error && (
        <Alert
          message="Erreur"
          description={error}
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <Form
        form={form}
        layout="vertical"
        onFinish={handleUpload}
        initialValues={{ isPublic: false }}
      >
        <Form.Item
          name="file"
          label="Fichier"
          rules={[{ required: true, message: 'Veuillez sélectionner un fichier' }]}
        >
          <Upload
            beforeUpload={() => false}
            fileList={fileList}
            onChange={({ fileList }) => setFileList(fileList)}
            maxCount={1}
          >
            <Button icon={<UploadOutlined />}>Sélectionner un fichier</Button>
          </Upload>
        </Form.Item>

        <Form.Item name="title" label="Titre">
          <Input placeholder="Titre du fichier (optionnel)" />
        </Form.Item>

        <Form.Item name="description" label="Description">
          <TextArea rows={4} placeholder="Description du fichier (optionnel)" />
        </Form.Item>

        <Form.Item name="project" label="Projet">
          <Select placeholder="Sélectionner un projet (optionnel)" allowClear>
            {projects.map((project) => (
              <Option key={project._id} value={project._id}>
                {project.projectName}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item name="isPublic" label="Public" valuePropName="checked">
          <Switch />
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={uploading}
            disabled={fileList.length === 0}
          >
            {uploading ? 'Téléchargement...' : 'Télécharger sur Google Drive'}
          </Button>
        </Form.Item>
      </Form>
    </div>
  )
}

export default DriveFileUpload
