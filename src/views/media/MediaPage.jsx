import React, { useState, useEffect, useContext } from 'react'
import './media.css'
import {
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CRow,
  CButton,
  CFormInput,
  CFormSelect,
  CSpinner,
  CAlert,
} from '@coreui/react'
import { UserContext } from '../../context/userContext'
import mediaService from '../../services/mediaService'
import MediaList from './MediaList'
import MediaUpload from './MediaUpload'

const MediaPage = () => {
  const { user } = useContext(UserContext)
  const [media, setMedia] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showUploadForm, setShowUploadForm] = useState(false)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')
  const [fileType, setFileType] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)

  // Fetch media on component mount and when filters change
  useEffect(() => {
    fetchMedia()
  }, [page, limit, search, fileType, refreshKey])

  const fetchMedia = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await mediaService.getAllMedia(page, limit, search, fileType)

      if (response && response.success) {
        setMedia(response.data || [])
        setTotalPages(response.pagination?.pages || 1)
      } else {
        setError('Failed to fetch media files')
        setMedia([])
        setTotalPages(1)
      }
    } catch (error) {
      console.error('Error fetching media:', error)
      setError('An error occurred while fetching media files')
      setMedia([])
      setTotalPages(1)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = () => {
    setRefreshKey((prevKey) => prevKey + 1)
  }

  const handleSearch = (e) => {
    e.preventDefault()
    setPage(1) // Reset to first page when searching
    fetchMedia()
  }

  const handleUploadSuccess = () => {
    setShowUploadForm(false)
    handleRefresh()
  }

  return (
    <div className="animated fadeIn">
      <CRow>
        <CCol>
          <CCard className="mb-4">
            <CCardHeader className="d-flex justify-content-between align-items-center">
              <strong>Media Management</strong>
              <CButton color="primary" onClick={() => setShowUploadForm(!showUploadForm)}>
                {showUploadForm ? 'Cancel Upload' : 'Upload New Media'}
              </CButton>
            </CCardHeader>
            <CCardBody>
              {error && <CAlert color="danger">{error}</CAlert>}

              {showUploadForm ? (
                <MediaUpload
                  onSuccess={handleUploadSuccess}
                  onCancel={() => setShowUploadForm(false)}
                />
              ) : (
                <>
                  <CRow className="mb-4">
                    <CCol md={6} className="mb-3 mb-md-0">
                      <form onSubmit={handleSearch} className="d-flex">
                        <CFormInput
                          placeholder="Search by title, description or tags"
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                          className="me-2"
                        />
                        <CButton type="submit" color="primary">
                          Search
                        </CButton>
                      </form>
                    </CCol>
                    <CCol md={3}>
                      <CFormSelect
                        value={fileType}
                        onChange={(e) => {
                          setFileType(e.target.value)
                          setPage(1) // Reset to first page when changing filter
                        }}
                      >
                        <option value="">All File Types</option>
                        <option value="image">Images</option>
                        <option value="document">Documents</option>
                        <option value="video">Videos</option>
                        <option value="audio">Audio</option>
                        <option value="other">Other</option>
                      </CFormSelect>
                    </CCol>
                    <CCol md={3} className="d-flex justify-content-end">
                      <CFormSelect
                        value={limit}
                        onChange={(e) => {
                          setLimit(Number(e.target.value))
                          setPage(1) // Reset to first page when changing limit
                        }}
                        className="w-auto"
                      >
                        <option value={5}>5 per page</option>
                        <option value={10}>10 per page</option>
                        <option value={20}>20 per page</option>
                        <option value={50}>50 per page</option>
                      </CFormSelect>
                    </CCol>
                  </CRow>

                  {loading ? (
                    <div className="text-center my-5">
                      <CSpinner color="primary" />
                    </div>
                  ) : (
                    <MediaList
                      media={media}
                      onDelete={handleRefresh}
                      onEdit={handleRefresh}
                      page={page}
                      totalPages={totalPages}
                      onPageChange={setPage}
                    />
                  )}
                </>
              )}
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
    </div>
  )
}

export default MediaPage
