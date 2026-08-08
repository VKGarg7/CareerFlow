import {
  DashboardOutlined, BusinessOutlined, WorkOutlined,
  PeopleOutlined, NotificationsNoneOutlined, Handshake,
  AdminPanelSettingsOutlined, FolderOutlined,
  BusinessCenterOutlined, HandshakeOutlined, PersonAddAltOutlined,
  FlagOutlined,
} from '@mui/icons-material'

export const NAV = [
  { to: '/dashboard',    Icon: DashboardOutlined,        label: 'Dashboard'    },
  { to: '/workspaces',   Icon: FolderOutlined,            label: 'Workspaces'   },
  { to: '/companies',    Icon: BusinessOutlined,          label: 'Companies'    },
  { to: '/applications', Icon: WorkOutlined,              label: 'Applications' },
  { to: '/follow-ups',   Icon: NotificationsNoneOutlined, label: 'Follow-Ups'   },
  { to: '/recruiters',   Icon: PeopleOutlined,            label: 'Recruiters'   },
  { to: '/referrals',    Icon: Handshake,                 label: 'Referrals'    },
  { to: '/goals',        Icon: FlagOutlined,              label: 'Goals'        },
]

export const ADMIN_NAV = { to: '/admin', Icon: AdminPanelSettingsOutlined, label: 'Admin' }

export const QUICK_ACTIONS = [
  { to: '/applications?add=1', Icon: BusinessCenterOutlined, label: 'Log Application', key: 'A' },
  { to: '/companies?add=1',    Icon: BusinessOutlined,       label: 'Add Company',     key: 'C' },
  { to: '/recruiters?add=1',   Icon: PersonAddAltOutlined,   label: 'Add Recruiter',   key: 'R' },
  { to: '/referrals?add=1',    Icon: HandshakeOutlined,      label: 'New Referral',    key: 'N' },
]
