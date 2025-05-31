import { User } from 'firebase/auth';
import { 
  createDocument, 
  getDocument, 
  updateDocument, 
  queryDocuments,
  deleteDocument
} from '@/lib/firebase/firestoreService';
import {
  collection,
  doc,
  where,
  orderBy,
  query,
  onSnapshot,
  Unsubscribe
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('SystemConfigService');
const SYSTEM_CONFIG_COLLECTION = 'systemConfigurations';

export interface SecuritySettings {
  mfaRequired: boolean;
  passwordComplexity: boolean;
  sessionTimeout: boolean;
  ipRestriction: boolean;
  auditLogging: boolean;
  autoLockout: boolean;
}

export interface OrganizationDefaults {
  defaultPlan: 'Standard' | 'Professional' | 'Enterprise';
  trialPeriodDays: number;
  storageLimit: '500 GB' | '1 TB' | '2 TB';
  dataEncryption: boolean;
  contentFiltering: boolean;
  domainRestriction: boolean;
  autoBackup: boolean;
}

export interface MaintenanceSettings {
  maintenanceWindow: string;
  notificationTime: string;
  auditLogRetention: string;
  backupRetention: string;
}

export interface ApiConfiguration {
  defaultRateLimit: number;
  burstLimit: number;
  apiKeyRotation: boolean;
  apiKeyScopes: boolean;
}

export interface SystemConfiguration {
  id?: string;
  userId: string;
  securitySettings: SecuritySettings;
  organizationDefaults: OrganizationDefaults;
  maintenanceSettings: MaintenanceSettings;
  apiConfiguration: ApiConfiguration;
  createdAt?: Date;
  updatedAt?: Date;
}

export const getSystemConfiguration = async (userId: string): Promise<SystemConfiguration | null> => {
  try {
    logger.debug('Fetching system configuration', { userId });
    
    const configs = await queryDocuments(SYSTEM_CONFIG_COLLECTION, [
      where('userId', '==', userId)
    ]) as SystemConfiguration[];
    
    if (configs.length > 0) {
      logger.info('System configuration found', { userId, configId: configs[0].id });
      return configs[0];
    }
    
    logger.info('No system configuration found, returning default', { userId });
    return getDefaultConfiguration(userId);
  } catch (error) {
    logger.error('Error fetching system configuration', error as Error, { userId });
    throw error;
  }
};

export const createSystemConfiguration = async (
  userId: string,
  config: Omit<SystemConfiguration, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
): Promise<string> => {
  try {
    logger.debug('Creating system configuration', { userId });
    
    const configData: Omit<SystemConfiguration, 'id'> = {
      ...config,
      userId
    };
    
    const docId = `${userId}_config`;
    await createDocument(SYSTEM_CONFIG_COLLECTION, configData, docId);
    
    logger.info('System configuration created', { userId, configId: docId });
    return docId;
  } catch (error) {
    logger.error('Error creating system configuration', error as Error, { userId });
    throw error;
  }
};

export const updateSystemConfiguration = async (
  userId: string,
  updates: Partial<Omit<SystemConfiguration, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
): Promise<void> => {
  try {
    logger.debug('Updating system configuration', { userId });
    
    const configs = await queryDocuments(SYSTEM_CONFIG_COLLECTION, [
      where('userId', '==', userId)
    ]) as SystemConfiguration[];
    
    let configId: string;
    
    if (configs.length > 0) {
      configId = configs[0].id!;
    } else {
      const defaultConfig = getDefaultConfiguration(userId);
      configId = await createSystemConfiguration(userId, {
        ...defaultConfig,
        ...updates
      });
      return;
    }
    
    await updateDocument(SYSTEM_CONFIG_COLLECTION, configId, updates);
    logger.info('System configuration updated', { userId, configId });
  } catch (error) {
    logger.error('Error updating system configuration', error as Error, { userId });
    throw error;
  }
};

export const deleteSystemConfiguration = async (userId: string): Promise<void> => {
  try {
    logger.debug('Deleting system configuration', { userId });
    
    const configs = await queryDocuments(SYSTEM_CONFIG_COLLECTION, [
      where('userId', '==', userId)
    ]) as SystemConfiguration[];
    
    if (configs.length > 0) {
      await deleteDocument(SYSTEM_CONFIG_COLLECTION, configs[0].id!);
      logger.info('System configuration deleted', { userId, configId: configs[0].id });
    } else {
      logger.info('No system configuration found to delete', { userId });
    }
  } catch (error) {
    logger.error('Error deleting system configuration', error as Error, { userId });
    throw error;
  }
};

export const subscribeToSystemConfiguration = (
  userId: string,
  callback: (config: SystemConfiguration | null) => void
): Unsubscribe => {
  logger.debug('Subscribing to system configuration changes', { userId });
  
  const configQuery = collection(db, SYSTEM_CONFIG_COLLECTION);
  const q = query(configQuery, where('userId', '==', userId));
  
  return onSnapshot(q, (snapshot) => {
    try {
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        const config: SystemConfiguration = {
          id: doc.id,
          ...doc.data()
        } as SystemConfiguration;
        
        logger.debug('System configuration updated via subscription', { userId, configId: config.id });
        callback(config);
      } else {
        logger.debug('No system configuration found via subscription', { userId });
        callback(getDefaultConfiguration(userId));
      }
    } catch (error) {
      logger.error('Error in system configuration subscription', error as Error, { userId });
      callback(null);
    }
  }, (error) => {
    logger.error('System configuration subscription error', error, { userId });
    callback(null);
  });
};

export const resetToDefaults = async (userId: string): Promise<void> => {
  try {
    logger.debug('Resetting system configuration to defaults', { userId });
    
    const defaultConfig = getDefaultConfiguration(userId);
    await updateSystemConfiguration(userId, defaultConfig);
    
    logger.info('System configuration reset to defaults', { userId });
  } catch (error) {
    logger.error('Error resetting system configuration to defaults', error as Error, { userId });
    throw error;
  }
};

const getDefaultConfiguration = (userId: string): SystemConfiguration => {
  return {
    userId,
    securitySettings: {
      mfaRequired: true,
      passwordComplexity: true,
      sessionTimeout: true,
      ipRestriction: false,
      auditLogging: true,
      autoLockout: true
    },
    organizationDefaults: {
      defaultPlan: 'Standard',
      trialPeriodDays: 14,
      storageLimit: '500 GB',
      dataEncryption: true,
      contentFiltering: true,
      domainRestriction: false,
      autoBackup: true
    },
    maintenanceSettings: {
      maintenanceWindow: 'Sunday, 2:00 AM - 4:00 AM',
      notificationTime: '24 hours before',
      auditLogRetention: '90 days',
      backupRetention: '30 days'
    },
    apiConfiguration: {
      defaultRateLimit: 1000,
      burstLimit: 2000,
      apiKeyRotation: true,
      apiKeyScopes: true
    }
  };
};

export const validateConfiguration = (config: Partial<SystemConfiguration>): string[] => {
  const errors: string[] = [];
  
  if (config.organizationDefaults?.trialPeriodDays !== undefined) {
    if (config.organizationDefaults.trialPeriodDays < 1 || config.organizationDefaults.trialPeriodDays > 365) {
      errors.push('Trial period must be between 1 and 365 days');
    }
  }
  
  if (config.apiConfiguration?.defaultRateLimit !== undefined) {
    if (config.apiConfiguration.defaultRateLimit < 1 || config.apiConfiguration.defaultRateLimit > 10000) {
      errors.push('Default rate limit must be between 1 and 10,000 requests per minute');
    }
  }
  
  if (config.apiConfiguration?.burstLimit !== undefined) {
    if (config.apiConfiguration.burstLimit < 1 || config.apiConfiguration.burstLimit > 20000) {
      errors.push('Burst limit must be between 1 and 20,000 requests');
    }
  }
  
  return errors;
};