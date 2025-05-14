import { cilSpeedometer, cilUser, cilTask } from '@coreui/icons'
import CIcon from '@coreui/icons-react'
import { CNavGroup, CNavItem } from '@coreui/react'

const _nav = [
  {
    component: CNavItem,
    name: 'Dashboard',
    to: '/dashboard',
    icon: <CIcon icon={cilSpeedometer} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'Tâches',
    to: '/tasks',
    icon: <CIcon icon={cilTask} customClassName="nav-icon" />,
  },
  // ... autres éléments de navigation existants
]

export default _nav
