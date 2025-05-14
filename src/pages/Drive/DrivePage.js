import React from 'react';
import { Row, Col, Breadcrumb } from 'antd';
import { HomeOutlined, CloudOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import DriveManager from '../../components/Drive/DriveManager';

const DrivePage = () => {
  return (
    <div>
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Breadcrumb>
            <Breadcrumb.Item>
              <Link to="/dashboard/default">
                <HomeOutlined /> Accueil
              </Link>
            </Breadcrumb.Item>
            <Breadcrumb.Item>
              <CloudOutlined /> Google Drive
            </Breadcrumb.Item>
          </Breadcrumb>
        </Col>
        
        <Col span={24}>
          <DriveManager />
        </Col>
      </Row>
    </div>
  );
};

export default DrivePage;
