/* eslint-disable prettier/prettier */
import React, { useContext } from 'react'
import { CFooter, CContainer, CRow, CCol } from '@coreui/react'
import { UserContext } from '../../context/userContext'
import CIcon from '@coreui/icons-react'
import {
  cilEnvelopeOpen,
  cilPhone,
  cilLocationPin,
  cilUser,
  cilSpeech,
  cilPeople,
} from '@coreui/icons'

const AppFooter = () => {
  const { user } = useContext(UserContext)
  const currentYear = new Date().getFullYear()

  return (
    <CFooter className="footer-custom w-100 p-0">
      <div className="footer-main py-5 w-100">
        <CContainer fluid="lg">
          <CRow className="align-items-start">
            <CCol md={4} className="mb-4 mb-md-0">
              <h4 className="text-white mb-3 footer-title">worktrack</h4>
              <p className="text-white-50 mb-0">
                Streamline your project management with our powerful and intuitive platform.
              </p>
            </CCol>
            <CCol md={4} className="mb-4 mb-md-0">
              <h5 className="text-white mb-3 footer-subtitle">Contact Us</h5>
              <div className="d-flex align-items-center mb-3">
                <div className="footer-icon-wrapper me-3">
                  <CIcon icon={cilPhone} className="footer-icon" />
                </div>
                <span className="text-white-50">+216 72 454 227</span>
              </div>
              <div className="d-flex align-items-center mb-3">
                <div className="footer-icon-wrapper me-3">
                  <CIcon icon={cilEnvelopeOpen} className="footer-icon" />
                </div>
                <span className="text-white-50">support@worktrack.com</span>
              </div>
              <div className="d-flex align-items-center">
                <div className="footer-icon-wrapper me-3">
                  <CIcon icon={cilLocationPin} className="footer-icon" />
                </div>
                <span className="text-white-50">123 Business Ave, Tech City</span>
              </div>
            </CCol>
            <CCol md={4}>
              <h5 className="text-white mb-3 footer-subtitle">Follow Us</h5>
              <div className="d-flex gap-3">
                <a href="https://facebook.com" target="_blank" className="social-link">
                  <CIcon icon={cilUser} className="social-icon" />
                </a>
                <a href="https://twitter.com" target="_blank" className="social-link">
                  <CIcon icon={cilSpeech} className="social-icon" />
                </a>
                <a href="https://linkedin.com" target="_blank" className="social-link">
                  <CIcon icon={cilPeople} className="social-icon" />
                </a>
              </div>
            </CCol>
          </CRow>
        </CContainer>
      </div>
      <div className="footer-bottom py-3 w-100">
        <CContainer fluid="lg">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-center">
            <div className="mb-3 mb-md-0">
              <span className="text-dark">&copy; {currentYear} worktrack. All rights reserved.</span>
            </div>
            <div className="d-flex gap-4">
              <a href="#" className="footer-link-dark">
                Privacy Policy
              </a>
              <a href="#" className="footer-link-dark">
                Terms of Service
              </a>
              <a href="#" className="footer-link-dark">
                Help Center
              </a>
            </div>
          </div>
        </CContainer>
      </div>
    </CFooter>
  )
}

export default React.memo(AppFooter)
