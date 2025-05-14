import React, { useState } from 'react';
import { 
  Modal, 
  Form, 
  Input, 
  Select, 
  Switch, 
  Button, 
  message, 
  Alert,
  Typography
} from 'antd';
import { ImportOutlined } from '@ant-design/icons';
import { importFileFromDrive } from '../../services/driveService';

const { Option } = Select;
const { TextArea } = Input;
const { Text } = Typography;

const DriveFileImport = ({ 
  visible, 
  onCancel, 
  onSuccess, 
  fileData, 
  projects = [] 
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Set initial form values when fileData changes
  React.useEffect(() => {
    if (fileData) {
      form.setFieldsValue({
        title: fileData.name,
        description: '',
        project: undefined,
        isPublic: false
      });
    }
  }, [fileData, form]);

  const handleImport = async (values) => {
    if (!fileData) {
      message.error('Aucun fichier sélectionné');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const importData = {
        fileId: fileData.id,
        title: values.title,
        description: values.description,
        project: values.project,
        isPublic: values.isPublic
      };

      const response = await importFileFromDrive(importData);
      
      if (response.success) {
        message.success('Fichier importé avec succès');
        form.resetFields();
        
        if (onSuccess) {
          onSuccess(response.data);
        }
        
        onCancel();
      } else {
        if (response.needsAuth) {
          setError('Vous devez vous connecter à Google Drive. Veuillez utiliser le bouton de connexion ci-dessus.');
        } else {
          setError(`Erreur lors de l'importation: ${response.error}`);
        }
      }
    } catch (err) {
      setError('Erreur lors de l\'importation du fichier');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Importer depuis Google Drive"
      open={visible}
      onCancel={onCancel}
      footer={null}
      destroyOnClose
    >
      {error && (
        <Alert
          message="Erreur"
          description={error}
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}
      
      {fileData ? (
        <>
          <div style={{ marginBottom: 16 }}>
            <Text strong>Fichier sélectionné: </Text>
            <Text>{fileData.name}</Text>
          </div>
          
          <Form
            form={form}
            layout="vertical"
            onFinish={handleImport}
            initialValues={{
              title: fileData.name,
              description: '',
              isPublic: false
            }}
          >
            <Form.Item
              name="title"
              label="Titre"
              rules={[{ required: true, message: 'Veuillez entrer un titre' }]}
            >
              <Input placeholder="Titre du fichier" />
            </Form.Item>
            
            <Form.Item
              name="description"
              label="Description"
            >
              <TextArea rows={4} placeholder="Description du fichier (optionnel)" />
            </Form.Item>
            
            <Form.Item
              name="project"
              label="Projet"
            >
              <Select placeholder="Sélectionner un projet (optionnel)" allowClear>
                {projects.map(project => (
                  <Option key={project._id} value={project._id}>{project.projectName}</Option>
                ))}
              </Select>
            </Form.Item>
            
            <Form.Item
              name="isPublic"
              label="Public"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
            
            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                icon={<ImportOutlined />}
              >
                Importer
              </Button>
            </Form.Item>
          </Form>
        </>
      ) : (
        <Alert
          message="Aucun fichier sélectionné"
          description="Veuillez sélectionner un fichier dans la liste pour l'importer."
          type="info"
          showIcon
        />
      )}
    </Modal>
  );
};

export default DriveFileImport;
