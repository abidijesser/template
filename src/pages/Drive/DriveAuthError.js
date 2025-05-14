import React from 'react';
import { Result, Button } from 'antd';
import { useNavigate } from 'react-router-dom';

const DriveAuthError = () => {
  const navigate = useNavigate();

  return (
    <Result
      status="error"
      title="Erreur de connexion à Google Drive"
      subTitle="Une erreur s'est produite lors de la connexion à Google Drive. Veuillez réessayer."
      extra={[
        <Button type="primary" key="drive" onClick={() => navigate('/drive')}>
          Réessayer
        </Button>,
        <Button key="dashboard" onClick={() => navigate('/dashboard/default')}>
          Retour au tableau de bord
        </Button>,
      ]}
    />
  );
};

export default DriveAuthError;
