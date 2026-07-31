import pb from '@/lib/pocketbase/client'
import { AutomationLog } from '@/types'

export const getAutomationLogs = async (page = 1, perPage = 20, filterString = '') => {
  return pb.collection('automation_logs').getList<AutomationLog>(page, perPage, {
    filter: filterString,
    sort: '-created',
    expand: 'post,agenda,created_by',
  })
}

export const getRecentLogs = async (limit = 5) => {
  return pb.collection('automation_logs').getList<AutomationLog>(1, limit, {
    sort: '-created',
    expand: 'created_by',
  })
}
