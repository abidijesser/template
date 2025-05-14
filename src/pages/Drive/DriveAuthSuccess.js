import React, { useEffect } from 'react';
import { Result, Button } from 'antd';
import { useNavigate } from 'react-router-dom';

const DriveAuthSuccess = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Auto-redirect after 3 seconds
    const timer = setTimeout(() => {
      navigate('/drive');
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <Result
      status="success"
      title="Connexion à Google Drive réussie!"
      subTitle="Vous avez été authentifié avec succès. Vous allez être redirigé vers la page Google Drive."
      extra={[
        <Button type="primary" key="drive" onClick={() => navigate('/drive')}>
          Aller à Google Drive
        </Button>,
        <Button key="dashboard" onClick={() => navigate('/dashboard/default')}>
          Retour au tableau de bord
        </Button>,
      ]}
    />
  );
};

export default DriveAuthSuccess;
