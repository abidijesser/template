import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import {
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CRow,
  CListGroup,
  CListGroupItem,
} from '@coreui/react';

const UserDetails = () => {
  const [user, setUser] = useState(null);
  const { id } = useParams();

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const response = await axios.get(`http://localhost:3001/admin/users/${id}`);
        setUser(response.data);
      } catch (error) {
        console.error('Erreur lors du chargement des détails:', error);
      }
    };

    fetchUserDetails();
  }, [id]);

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <CRow>
      <CCol md={8}>
        <CCard className="mb-4">
          <CCardHeader>
            <h4>User Details</h4>
          </CCardHeader>
          <CCardBody>
            <CListGroup flush>
              <CListGroupItem>
                <strong>Name:</strong> {user.name}
              </CListGroupItem>
              <CListGroupItem>
                <strong>Email:</strong> {user.email}
              </CListGroupItem>
              <CListGroupItem>
                <strong>Role:</strong> {user.role}
              </CListGroupItem>
              {/* Ajoutez d'autres détails selon vos besoins */}
            </CListGroup>
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  );
};

export default UserDetails; 