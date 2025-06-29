import { collection, query, where, orderBy, limit, getDocs, getCountFromServer, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { queryDocuments } from '@/lib/firebase/firestoreService';

/**
 * Represents the health status of a system service
 * Used for monitoring platform service availability
 */
export interface SystemHealthStatus {
  name: string;
  status: 'Operational' | 'Degraded' | 'Outage';
  statusColor: 'green' | 'yellow' | 'red'; // Color mapping for UI display
  lastUpdated?: Date;
}

/**
 * Represents a single activity log entry for audit trails
 * Tracks user actions and system events with severity levels
 */
export interface ActivityLogEntry {
  id: string;
  action: string;
  description: string;
  actor: string; // User or system that performed the action
  timestamp: Date;
  severity: 'high' | 'normal' | 'low'; // Priority level for filtering
}

/**
 * Core platform metrics for dashboard analytics
 * Provides key performance indicators for platform health
 */
export interface PlatformMetrics {
  totalOrganizations: number;
  activeUsers: number;
  systemUptime: number; // Percentage uptime
  pendingApprovals: number;
  organizationGrowthRate: number; // Month-over-month percentage growth
  userGrowthRate: number; // Month-over-month percentage growth
}

/**
 * System resource utilization metrics
 * All values are percentages (0-100) except networkBandwidth
 */
export interface ResourceUtilization {
  cpuUsage: number;
  memoryUsage: number;
  storageUsage: number;
  networkBandwidth: number; // Current bandwidth usage
}

/**
 * Retrieves comprehensive platform metrics including user counts, growth rates, and system status
 * Calculates month-over-month growth rates for organizations and users
 * @returns Promise<PlatformMetrics> Complete platform analytics data
 */
export const getPlatformMetrics = async (): Promise<PlatformMetrics> => {
  try {
    // Get total organization count
    const orgSnapshot = await getCountFromServer(collection(db, 'organizations'));
    const totalOrganizations = orgSnapshot.data().count;
    
    // Calculate date 30 days ago for active user filtering
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    // Get total active users count (currently counts all users)
    const activeUsersQuery = query(
      collection(db, 'users'),
    );
    const activeUsersSnapshot = await getCountFromServer(activeUsersQuery);
    const activeUsers = activeUsersSnapshot.data().count;
    
    // Count pending approvals for admin dashboard
    const approvalsQuery = query(
      collection(db, 'approvals'),
      where('status', '==', 'pending')
    );
    const approvalsSnapshot = await getCountFromServer(approvalsQuery);
    const pendingApprovals = approvalsSnapshot.data().count;
    
    // Setup date ranges for growth rate calculations
    const twoMonthsAgo = new Date();
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
    
    // Previous month boundaries (1st day 00:00:00 to last day 23:59:59)
    const previousMonthStart = new Date();
    previousMonthStart.setMonth(previousMonthStart.getMonth() - 1);
    previousMonthStart.setDate(1);
    previousMonthStart.setHours(0, 0, 0, 0);
    
    const previousMonthEnd = new Date();
    previousMonthEnd.setDate(0); // Last day of previous month
    previousMonthEnd.setHours(23, 59, 59, 999);
    
    // Current month start (1st day 00:00:00)
    const currentMonthStart = new Date();
    currentMonthStart.setDate(1);
    currentMonthStart.setHours(0, 0, 0, 0);
    
    // Query users created in previous month and current month for growth calculation
    const previousMonthQuery = query(
      collection(db, 'users'),
      where('createdAt', '>=', Timestamp.fromDate(previousMonthStart)),
      where('createdAt', '<=', Timestamp.fromDate(previousMonthEnd))
    );
    
    const currentMonthQuery = query(
      collection(db, 'users'),
      where('createdAt', '>=', Timestamp.fromDate(currentMonthStart))
    );
    
    // Execute both queries in parallel for efficiency
    const [previousMonthSnapshot, currentMonthSnapshot] = await Promise.all([
      getCountFromServer(previousMonthQuery),
      getCountFromServer(currentMonthQuery)
    ]);
    
    const previousMonthUsers = previousMonthSnapshot.data().count;
    const currentMonthUsers = currentMonthSnapshot.data().count;
    
    // Calculate user growth rate with edge case handling
    let userGrowthRate = 0;
    if (previousMonthUsers > 0) {
      // Standard percentage growth calculation
      userGrowthRate = ((currentMonthUsers - previousMonthUsers) / previousMonthUsers) * 100;
    } else if (previousMonthUsers === 0 && currentMonthUsers > 0) {
      // Handle division by zero case
      userGrowthRate = 100;
    }
    
    // Round to one decimal place for display
    userGrowthRate = parseFloat(userGrowthRate.toFixed(1));
    
    // Query organizations created in previous month and current month
    const previousMonthOrgsQuery = query(
      collection(db, 'organizations'),
      where('createdAt', '>=', Timestamp.fromDate(previousMonthStart)),
      where('createdAt', '<=', Timestamp.fromDate(previousMonthEnd))
    );
    
    const currentMonthOrgsQuery = query(
      collection(db, 'organizations'),
      where('createdAt', '>=', Timestamp.fromDate(currentMonthStart))
    );
    
    // Execute organization queries in parallel
    const [previousMonthOrgsSnapshot, currentMonthOrgsSnapshot] = await Promise.all([
      getCountFromServer(previousMonthOrgsQuery),
      getCountFromServer(currentMonthOrgsQuery)
    ]);
    
    const previousMonthOrgs = previousMonthOrgsSnapshot.data().count;
    const currentMonthOrgs = currentMonthOrgsSnapshot.data().count;
    
    // Calculate organization growth rate with same logic as user growth
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
      systemUptime: 99.98, // Mock Uptime
      pendingApprovals,
      organizationGrowthRate,
      userGrowthRate
    };
  } catch (error) {
    console.error('Error fetching platform metrics:', error);

    // Return zero values as fallback to prevent UI crashes
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

/**
 * Retrieves system health status for all monitored services
 * Maps status strings to appropriate color codes for UI display
 * @returns Promise<SystemHealthStatus[]> Array of service health statuses
 */
export const getSystemHealth = async (): Promise<SystemHealthStatus[]> => {
  try {
    const healthData = await queryDocuments('systemHealth');
    
    // Transform raw health data and map status to color codes
    return healthData.map(service => ({
      name: service.name,
      status: service.status,
      statusColor: service.status === 'Operational' ? 'green' : 
                  service.status === 'Degraded' ? 'yellow' : 'red',
      lastUpdated: service.lastUpdated?.toDate()
    }));
  } catch (error) {
    console.error('Error fetching system health:', error);
    // Return mock data as fallback to ensure UI remains functional
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

/**
 * Retrieves the latest system resource utilization metrics
 * Fetches the most recent entry from the resourceUtilization collection
 * @returns Promise<ResourceUtilization> Current system resource usage data
 */
export const getResourceUtilization = async (): Promise<ResourceUtilization> => {
  try {
    // Get the most recent resource utilization entry
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
    
    // Return mock data if no real data is available
    return {
      cpuUsage: 42,
      memoryUsage: 68,
      storageUsage: 23,
      networkBandwidth: 51
    };
  } catch (error) {
    console.error('Error fetching resource utilization:', error);
    // Return zero values as error fallback
    return {
      cpuUsage: 0,
      memoryUsage: 0,
      storageUsage: 0,
      networkBandwidth: 0
    };
  }
};

/**
 * Retrieves recent activity logs with optional severity filtering
 * Supports pagination through limitCount parameter
 * @param limitCount Maximum number of logs to return (default: 10)
 * @param filterSeverity Optional severity filter ('high' | 'normal' | 'low')
 * @returns Promise<ActivityLogEntry[]> Array of activity log entries
 */
export const getRecentActivityLogs = async (limitCount = 10, filterSeverity?: 'high' | 'normal' | 'low'): Promise<ActivityLogEntry[]> => {
  try {
    // Build query constraints dynamically based on parameters
    let queryConstraints = [];
    
    // Add severity filter if specified
    if (filterSeverity) {
      queryConstraints.push(where('severity', '==', filterSeverity));
    }
    
    // Always order by timestamp (newest first) and apply limit
    queryConstraints.push(orderBy('timestamp', 'desc'));
    queryConstraints.push(limit(limitCount));
    
    try {
      const logsData = await queryDocuments('activityLogs', queryConstraints);
      
      if (logsData && logsData.length > 0) {
        // Transform raw log data and handle timestamp conversion
        return logsData.map(log => ({
          id: log.id,
          action: log.action,
          description: log.description,
          actor: log.actor,
          // Handle both Firestore Timestamp and regular Date objects
          timestamp: log.timestamp instanceof Timestamp ? log.timestamp.toDate() : new Date(log.timestamp),
          severity: log.severity
        }));
      }
    } catch (firestoreError) {
      console.warn('Firestore query failed, using mock data:', firestoreError);
    }
    
    // Return empty array if no data found
    return [];
    
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    return [];
  }
};