// filepath: c:\Users\Lenovo\Desktop\pi1\MERN-Project-Manager\Client\src\routes.js
import React from 'react'
import Profile from './views/pages/profile/Profile'
import TaskList from './views/tasks/TaskList'
import TaskForm from './views/tasks/TaskForm'
import TaskDetail from './views/tasks/TaskDetail'
import TaskStatusForm from './views/tasks/TaskStatusForm'
import ProjectsList from './views/projects/ProjectsList'
import CreateProject from './views/projects/CreateProject'
import ProjectDetails from './views/projects/ProjectDetails'
import EditProject from './views/projects/EditProject'
import Collaboration from './views/Collaboration/Collaboration'
import MeetingRoomNative from './views/meetings/MeetingRoomNative'
import MediaPage from './views/media/MediaPage'
import Resources from './views/resources/Resources'
import CalendarPage from './views/calendar/CalendarPage'
import Activity from './views/activity/Activity'
import DrivePage from './pages/Drive/DrivePage'
import DriveAuthSuccess from './pages/Drive/DriveAuthSuccess'
import DriveAuthError from './pages/Drive/DriveAuthError'

const Dashboard = React.lazy(() => import('./views/dashboard/Dashboard'))
const Login = React.lazy(() => import('./views/pages/login/Login'))
const Register = React.lazy(() => import('./views/pages/register/Register'))
const Page404 = React.lazy(() => import('./views/pages/page404/Page404'))
const Page500 = React.lazy(() => import('./views/pages/page500/Page500'))
const EditProfile = React.lazy(() => import('./views/pages/profile/EditProfile'))
const UserDetails = React.lazy(() => import('./views/pages/userDetails/UserDetails'))
const ForgotPassword = React.lazy(() => import('./views/pages/forgot-password/ForgotPassword'))
const ResetPassword = React.lazy(() => import('./views/pages/reset-password/ResetPassword'))
const VerifyEmail = React.lazy(() => import('./views/pages/verify-email/VerifyEmail'))
const Performances = React.lazy(() => import('./views/Performances/Performances'))
const EditTask = React.lazy(() => import('./views/tasks/EditTask'))
const AdminRedirect = React.lazy(() => import('./views/pages/admin-redirect/AdminRedirect'))

const routes = [
  { path: '/', exact: true, name: 'Home' },
  { path: '/dashboard', name: 'Dashboard', element: Dashboard },
  { path: '/login', name: 'Login', element: Login },
  { path: '/register', name: 'Register', element: Register },
  { path: '/admin-redirect', name: 'Admin Redirect', element: AdminRedirect },
  { path: '/404', name: 'Page 404', element: Page404 },
  { path: '/500', name: 'Page 500', element: Page500 },
  { path: '/profile', name: 'Profile', element: Profile },
  { path: '/profile/edit/:id', name: 'Edit Profile', element: EditProfile },
  { path: '/user-details/:id', name: 'User Details', element: UserDetails },
  { path: '/forgot-password', name: 'Forgot Password', element: ForgotPassword },
  { path: '/reset-password/:token', name: 'Reset Password', element: ResetPassword },
  { path: '/verify-email/:token', name: 'Verify Email', element: VerifyEmail },
  { path: '/tasks', exact: true, name: 'Tâches', element: TaskList },
  { path: '/tasks/new', exact: true, name: 'Nouvelle tâche', element: TaskForm },
  { path: '/tasks/edit/:id', exact: true, name: 'Modifier tâche', element: EditTask },
  { path: '/tasks/status/:id', exact: true, name: 'Modifier statut', element: TaskStatusForm },
  { path: '/tasks/:id', exact: true, name: 'Détails tâche', element: TaskDetail },
  { path: '/projects', exact: true, name: 'Projets', element: ProjectsList },
  { path: '/projects/new', exact: true, name: 'Créer un projet', element: CreateProject },
  { path: '/projects/edit/:id', exact: true, name: 'Modifier le projet', element: EditProject },
  { path: '/projects/:id', exact: true, name: 'Détails du projet', element: ProjectDetails },
  { path: '/performances', name: 'Suivi des Performances', element: Performances },
  { path: '/collaboration', name: 'Collaboration & Communication', element: Collaboration },
  { path: '/collaboration/chat', name: 'Chat', element: Collaboration },
  { path: '/collaboration/notifications', name: 'Notifications', element: Collaboration },
  { path: '/collaboration/meetings', name: 'Réunions', element: Collaboration },
  { path: '/meeting-room/:id', name: 'Meeting Room', element: MeetingRoomNative },
  { path: '/media', name: 'Gestion des médias', element: MediaPage },
  { path: '/resources', name: 'Ressources', element: Resources },
  { path: '/calendar', name: 'Calendrier', element: CalendarPage },
  { path: '/activity', name: 'Activités', element: Activity },
  { path: '/drive', name: 'Google Drive', element: DrivePage },
  { path: '/drive-auth-success', name: 'Google Drive Auth Success', element: DriveAuthSuccess },
  { path: '/drive-auth-error', name: 'Google Drive Auth Error', element: DriveAuthError },
]

export default routes
