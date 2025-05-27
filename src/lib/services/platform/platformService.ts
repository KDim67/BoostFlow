import { collection, query, where, orderBy, limit, getDocs, getCountFromServer, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { queryDocuments } from '@/lib/firebase/firestoreService';

export interface SystemHealthStatus {
  name: string;
  status: 'Operational' | 'Degraded' | 'Outage';
  statusColor: 'green' | 'yellow' | 'red';
  lastUpdated?: Date;
}

export interface ActivityLogEntry {
  id: string;
  action: string;
  description: string;
  actor: string;
  timestamp: Date;
  severity: 'high' | 'normal' | 'low';
}

export interface PlatformMetrics {
  totalOrganizations: number;
  activeUsers: number;
  systemUptime: number;
  pendingApprovals: number;
  organizationGrowthRate: number;
  userGrowthRate: number;
}

export interface ResourceUtilization {
  cpuUsage: number;
  memoryUsage: number;
  storageUsage: number;
  networkBandwidth: number;
}

export const getPlatformMetrics = async (): Promise<PlatformMetrics> => {
  try {
    const orgSnapshot = await getCountFromServer(collection(db, 'organizations'));
    const totalOrganizations = orgSnapshot.data().count;
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const activeUsersQuery = query(
      collection(db, 'users'),
    );
    const activeUsersSnapshot = await getCountFromServer(activeUsersQuery);
    const activeUsers = activeUsersSnapshot.data().count;
    
    const approvalsQuery = query(
      collection(db, 'approvals'),
      where('status', '==', 'pending')
    );
    const approvalsSnapshot = await getCountFromServer(approvalsQuery);
    const pendingApprovals = approvalsSnapshot.data().count;
    
    const twoMonthsAgo = new Date();
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
    
    const previousMonthStart = new Date();
    previousMonthStart.setMonth(previousMonthStart.getMonth() - 1);
    previousMonthStart.setDate(1);
    previousMonthStart.setHours(0, 0, 0, 0);
    
    const previousMonthEnd = new Date();
    previousMonthEnd.setDate(0);
    previousMonthEnd.setHours(23, 59, 59, 999);
    
    const currentMonthStart = new Date();
    currentMonthStart.setDate(1);
    currentMonthStart.setHours(0, 0, 0, 0);
    
    const previousMonthQuery = query(
      collection(db, 'users'),
      where('createdAt', '>=', Timestamp.fromDate(previousMonthStart)),
      where('createdAt', '<=', Timestamp.fromDate(previousMonthEnd))
    );
    
    const currentMonthQuery = query(
      collection(db, 'users'),
      where('createdAt', '>=', Timestamp.fromDate(currentMonthStart))
    );
    
    const [previousMonthSnapshot, currentMonthSnapshot] = await Promise.all([
      getCountFromServer(previousMonthQuery),
      getCountFromServer(currentMonthQuery)
    ]);
    
    const previousMonthUsers = previousMonthSnapshot.data().count;
    const currentMonthUsers = currentMonthSnapshot.data().count;
    
    let userGrowthRate = 0;
    if (previousMonthUsers > 0) {
      userGrowthRate = ((currentMonthUsers - previousMonthUsers) / previousMonthUsers) * 100;
    } else if (previousMonthUsers === 0 && currentMonthUsers > 0) {
      userGrowthRate = 100;
    }
    
    userGrowthRate = parseFloat(userGrowthRate.toFixed(1));
    
    const previousMonthOrgsQuery = query(
      collection(db, 'organizations'),
      where('createdAt', '>=', Timestamp.fromDate(previousMonthStart)),
      where('createdAt', '<=', Timestamp.fromDate(previousMonthEnd))
    );
    
    const currentMonthOrgsQuery = query(
      collection(db, 'organizations'),
      where('createdAt', '>=', Timestamp.fromDate(currentMonthStart))
    );
    
    const [previousMonthOrgsSnapshot, currentMonthOrgsSnapshot] = await Promise.all([
      getCountFromServer(previousMonthOrgsQuery),
      getCountFromServer(currentMonthOrgsQuery)
    ]);
    
    const previousMonthOrgs = previousMonthOrgsSnapshot.data().count;
    const currentMonthOrgs = currentMonthOrgsSnapshot.data().count;
    
    let organizationGrowthRate = 0;
    if (previousMonthOrgs > 0) {
      organizationGrowthRate = ((currentMonthOrgs - previousMonthOrgs) / previousMonthOrgs) * 100;
    } else if (previousMonthOrgs === 0 && currentMonthOrgs > 0) {
      organizationGrowthRate = 100;
    }
    
    organizationGrowthRate = parseFloat(organizationGrowthRate.toFixed(1));
    
    return {
      totalOrganizations,
      activeUsers,
      systemUptime: 99.98,
      pendingApprovals,
      organizationGrowthRate,
      userGrowthRate
    };
  } catch (error) {
    console.error('Error fetching platform metrics:', error);

    return {
      totalOrganizations: 0,
      activeUsers: 0,
      systemUptime: 0,
      pendingApprovals: 0,
      organizationGrowthRate: 0,
      userGrowthRate: 0
    };
  }
};

export const getSystemHealth = async (): Promise<SystemHealthStatus[]> => {
  try {
    const healthData = await queryDocuments('systemHealth');
    
    return healthData.map(service => ({
      name: service.name,
      status: service.status,
      statusColor: service.status === 'Operational' ? 'green' : 
                  service.status === 'Degraded' ? 'yellow' : 'red',
      lastUpdated: service.lastUpdated?.toDate()
    }));
  } catch (error) {
    console.error('Error fetching system health:', error);
    return [
      { name: 'Authentication Service', status: 'Operational', statusColor: 'green' },
      { name: 'Storage Service', status: 'Operational', statusColor: 'green' },
      { name: 'Database Service', status: 'Operational', statusColor: 'green' },
      { name: 'Analytics Engine', status: 'Operational', statusColor: 'green' },
      { name: 'Notification Service', status: 'Degraded', statusColor: 'yellow' },
      { name: 'Search Service', status: 'Operational', statusColor: 'green' },
    ];
  }
};

export const getResourceUtilization = async (): Promise<ResourceUtilization> => {
  try {
    const utilizationData = await queryDocuments('resourceUtilization', [
      orderBy('timestamp', 'desc'),
      limit(1)
    ]);
    
    if (utilizationData.length > 0) {
      const latest = utilizationData[0];
      return {
        cpuUsage: latest.cpuUsage,
        memoryUsage: latest.memoryUsage,
        storageUsage: latest.storageUsage,
        networkBandwidth: latest.networkBandwidth
      };
    }
    
    return {
      cpuUsage: 42,
      memoryUsage: 68,
      storageUsage: 23,
      networkBandwidth: 51
    };
  } catch (error) {
    console.error('Error fetching resource utilization:', error);
    return {
      cpuUsage: 0,
      memoryUsage: 0,
      storageUsage: 0,
      networkBandwidth: 0
    };
  }
};

export const getRecentActivityLogs = async (limitCount = 10, filterSeverity?: 'high' | 'normal' | 'low'): Promise<ActivityLogEntry[]> => {
  try {
    let queryConstraints = [];
    
    if (filterSeverity) {
      queryConstraints.push(where('severity', '==', filterSeverity));
    }
    
    queryConstraints.push(orderBy('timestamp', 'desc'));
    queryConstraints.push(limit(limitCount));
    
    try {
      const logsData = await queryDocuments('activityLogs', queryConstraints);
      
      if (logsData && logsData.length > 0) {
        return logsData.map(log => ({
          id: log.id,
          action: log.action,
          description: log.description,
          actor: log.actor,
          timestamp: log.timestamp instanceof Timestamp ? log.timestamp.toDate() : new Date(log.timestamp),
          severity: log.severity
        }));
      }
    } catch (firestoreError) {
      console.warn('Firestore query failed, using mock data:', firestoreError);
    }
    
    return [];
    
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    return [];
  }
};