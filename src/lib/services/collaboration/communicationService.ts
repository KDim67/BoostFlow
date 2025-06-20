import {
  createDocument,
  getDocument,
  updateDocument,
  deleteDocument,
  timestampToDate,
  getCollectionRef
} from '@/lib/firebase/firestoreService';
import { createLogger } from '@/lib/utils/logger';
import { 
  where, 
  orderBy, 
  limit as limitQuery, 
  query, 
  getDocs,
  QueryConstraint 
} from 'firebase/firestore';

const logger = createLogger('CommunicationService');

export interface Message {
  id: string;
  channelId: string;
  conversationId?: string;
  content: string;
  author: string;
  authorName?: string;
  createdAt: Date;
  updatedAt?: Date;
  attachments?: Attachment[];
  isEdited: boolean;
  isPinned: boolean;
  mentions?: string[];
  threadId?: string;
  replyCount?: number;
}

export interface Attachment {
  id: string;
  messageId: string;
  type: 'image' | 'file' | 'link';
  url: string;
  name: string;
  size?: number;
  thumbnailUrl?: string;
  metadata?: Record<string, any>;
}



export interface Channel {
  id: string;
  name: string;
  description?: string;
  type: 'public' | 'private';
  memberIds: string[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  isArchived: boolean;
  lastActivity?: Date;
  organizationId: string;
  projectId?: string;
}

export interface ChannelMember {
  userId: string;
  channelId: string;
  role: 'admin' | 'member';
  joinedAt: Date;
  lastReadAt?: Date;
}

const COLLECTIONS = {
  CHANNELS: 'channels',
  MESSAGES: 'messages',
  CHANNEL_MEMBERS: 'channelMembers'
};

export const createChannel = async (channel: Omit<Channel, 'id' | 'createdAt' | 'updatedAt' | 'isArchived' | 'lastActivity'>): Promise<Channel> => {
  try {
    const channelData = {
      ...channel,
      isArchived: false,
      lastActivity: new Date()
    };

    const channelId = await createDocument(COLLECTIONS.CHANNELS, channelData);
    
    const createdChannel = await getDocument(COLLECTIONS.CHANNELS, channelId);
    if (!createdChannel) {
      throw new Error('Failed to retrieve created channel');
    }

    if (channel.type === 'private' && channel.createdBy) {
      await addChannelMember(channelId, channel.createdBy, 'admin');
    }

    const result: Channel = {
      ...createdChannel,
      createdAt: timestampToDate(createdChannel.createdAt) || new Date(),
      updatedAt: timestampToDate(createdChannel.updatedAt) || new Date(),
      lastActivity: createdChannel.lastActivity ? timestampToDate(createdChannel.lastActivity) || undefined : undefined
    } as Channel;

    logger.info('Channel created successfully', { channelId, name: channel.name });
    return result;
  } catch (error) {
    logger.error('Error creating channel', error as Error, { channelName: channel.name });
    throw error;
  }
};

export const getChannel = async (id: string): Promise<Channel | null> => {
  try {
    const channelDoc = await getDocument(COLLECTIONS.CHANNELS, id);
    if (!channelDoc) {
      return null;
    }

    return {
      ...channelDoc,
      createdAt: timestampToDate(channelDoc.createdAt) || new Date(),
      updatedAt: timestampToDate(channelDoc.updatedAt) || new Date(),
      lastActivity: channelDoc.lastActivity ? timestampToDate(channelDoc.lastActivity) || undefined : undefined
    } as Channel;
  } catch (error) {
    logger.error('Error fetching channel', error as Error, { channelId: id });
    throw error;
  }
};

export const getChannelsByOrganization = async (organizationId: string): Promise<Channel[]> => {
  try {
    const collectionRef = getCollectionRef(COLLECTIONS.CHANNELS);
    const q = query(
      collectionRef,
      where('organizationId', '==', organizationId),
      where('isArchived', '==', false),
      orderBy('lastActivity', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const channels: any[] = [];
    querySnapshot.forEach((doc) => {
      channels.push({ id: doc.id, ...doc.data() });
    });

    return channels.map(channel => ({
      ...channel,
      createdAt: timestampToDate(channel.createdAt) || new Date(),
      updatedAt: timestampToDate(channel.updatedAt) || new Date(),
      lastActivity: channel.lastActivity ? timestampToDate(channel.lastActivity) || undefined : undefined
    })) as Channel[];
  } catch (error) {
    logger.error('Error fetching organization channels', error as Error, { organizationId });
    throw error;
  }
};

export const getChannelsByOrganizationForUser = async (organizationId: string, userId: string): Promise<Channel[]> => {
  try {
    const allChannels = await getChannelsByOrganization(organizationId);
    
    const filteredChannels: Channel[] = [];
    
    for (const channel of allChannels) {
      if (channel.type === 'public') {
        filteredChannels.push(channel);
      } else if (channel.type === 'private') {
        const memberIds = await getChannelMemberIds(channel.id);
        if (memberIds.includes(userId)) {
          filteredChannels.push(channel);
        }
      }
    }
    
    return filteredChannels;
  } catch (error) {
    logger.error('Error fetching user channels', error as Error, { organizationId, userId });
    throw error;
  }
};

export const getOrCreateDirectMessageChannel = async (userId1: string, userId2: string, organizationId: string): Promise<Channel> => {
  try {
    const conversationId = [userId1, userId2].sort().join('_');
    
    const existingChannel = await getChannel(conversationId);
    if (existingChannel) {
      return existingChannel;
    }

    const channelData = {
      id: conversationId,
      name: `DM_${conversationId}`,
      description: 'Direct message conversation',
      type: 'private' as const,
      memberIds: [userId1, userId2],
      organizationId,
      createdBy: userId1
    };

    await createDocument(COLLECTIONS.CHANNELS, channelData, conversationId);
    
    const createdChannel = await getChannel(conversationId);
    if (!createdChannel) {
      throw new Error('Failed to create direct message channel');
    }

    logger.info('Direct message channel created', { conversationId, userId1, userId2 });
    return createdChannel;
  } catch (error) {
    logger.error('Error creating direct message channel', error as Error, { userId1, userId2 });
    throw error;
  }
};

export const sendMessage = async (message: Omit<Message, 'id' | 'createdAt' | 'updatedAt' | 'isEdited' | 'isPinned'>): Promise<Message> => {
  try {
    const messageData = {
      ...message,
      isEdited: false,
      isPinned: false,
      replyCount: 0
    };

    const messageId = await createDocument(COLLECTIONS.MESSAGES, messageData);
    
    try {
      await updateDocument(COLLECTIONS.CHANNELS, message.channelId, {
        lastActivity: new Date()
      });
    } catch (channelError) {
      logger.warn('Could not update channel lastActivity', { channelId: message.channelId, error: (channelError as Error).message });
    }

    try {
      const channel = await getChannel(message.channelId);
      if (channel && channel.type === 'private' && channel.memberIds.length === 2) {
        const recipientId = channel.memberIds.find(id => id !== message.author);
        if (recipientId) {
          const { NotificationService } = await import('@/lib/firebase/notificationService');
          const { getUserProfile } = await import('@/lib/firebase/userProfileService');
          
          const senderProfile = await getUserProfile(message.author);
          const senderName = senderProfile?.displayName || message.authorName || 'Someone';
          
          const existingNotifications = await NotificationService.getUserNotifications(recipientId, 50, true, true);
          const existingDMNotification = existingNotifications.find(n => 
            n.type === 'direct_message' && 
            n.metadata?.senderId === message.author &&
            !n.read
          );
          
          if (existingDMNotification) {
            await NotificationService.updateNotification(existingDMNotification.id, {
              message: `${senderName}: ${message.content.length > 50 ? message.content.substring(0, 50) + '...' : message.content}`,
              updatedAt: new Date()
            });
          } else {
            await NotificationService.createNotification(
              recipientId,
              `New message from ${senderName}`,
              `${senderName}: ${message.content.length > 50 ? message.content.substring(0, 50) + '...' : message.content}`,
              'direct_message',
              channel.organizationId,
              `/organizations/${channel.organizationId}/communication/direct/${message.author}`,
              {
                senderId: message.author,
                channelId: message.channelId,
                messageId: messageId
              }
            );
          }
        }
      }
    } catch (notificationError) {
      logger.warn('Could not create direct message notification', { error: (notificationError as Error).message });
    }

    const createdMessage = await getDocument(COLLECTIONS.MESSAGES, messageId);
    if (!createdMessage) {
      throw new Error('Failed to retrieve created message');
    }

    const result: Message = {
      ...createdMessage,
      createdAt: timestampToDate(createdMessage.createdAt) || new Date(),
      updatedAt: createdMessage.updatedAt ? timestampToDate(createdMessage.updatedAt) || undefined : undefined
    } as Message;

    logger.info('Message sent successfully', { messageId, channelId: message.channelId });
    return result;
  } catch (error) {
    logger.error('Error sending message', error as Error, { channelId: message.channelId });
    throw error;
  }
};

export const getChannelMessages = async (
  channelId: string,
  options: {
    limit?: number;
    before?: Date;
    after?: Date;
  } = {}
): Promise<Message[]> => {
  try {
    const { limit = 50, before, after } = options;
    
    const collectionRef = getCollectionRef(COLLECTIONS.MESSAGES);
    const constraints: QueryConstraint[] = [where('channelId', '==', channelId)];
    
    if (before) {
      constraints.push(where('createdAt', '<', before));
    }
    if (after) {
      constraints.push(where('createdAt', '>', after));
    }

    constraints.push(orderBy('createdAt', 'desc'));
    constraints.push(limitQuery(limit));

    const q = query(collectionRef, ...constraints);
    const querySnapshot = await getDocs(q);
    
    const messages: any[] = [];
    querySnapshot.forEach((doc) => {
      messages.push({ id: doc.id, ...doc.data() });
    });

    return messages.map(message => ({
      ...message,
      createdAt: timestampToDate(message.createdAt) || new Date(),
      updatedAt: message.updatedAt ? timestampToDate(message.updatedAt) || undefined : undefined
    })).reverse() as Message[];
  } catch (error) {
    logger.error('Error fetching channel messages', error as Error, { channelId });
    throw error;
  }
};

export const updateMessage = async (id: string, content: string): Promise<Message | null> => {
  try {
    await updateDocument(COLLECTIONS.MESSAGES, id, {
      content,
      isEdited: true
    });

    const updatedMessage = await getDocument(COLLECTIONS.MESSAGES, id);
    if (!updatedMessage) {
      return null;
    }

    return {
      ...updatedMessage,
      createdAt: timestampToDate(updatedMessage.createdAt) || new Date(),
      updatedAt: timestampToDate(updatedMessage.updatedAt) || new Date()
    } as Message;
  } catch (error) {
    logger.error('Error updating message', error as Error, { messageId: id });
    throw error;
  }
};

export const deleteMessage = async (id: string): Promise<boolean> => {
  try {
    await deleteDocument(COLLECTIONS.MESSAGES, id);
    logger.info('Message deleted successfully', { messageId: id });
    return true;
  } catch (error) {
    logger.error('Error deleting message', error as Error, { messageId: id });
    return false;
  }
};







export const pinMessage = async (messageId: string): Promise<boolean> => {
  try {
    await updateDocument(COLLECTIONS.MESSAGES, messageId, {
      isPinned: true
    });
    
    logger.info('Message pinned successfully', { messageId });
    return true;
  } catch (error) {
    logger.error('Error pinning message', error as Error, { messageId });
    return false;
  }
};

export const unpinMessage = async (messageId: string): Promise<boolean> => {
  try {
    await updateDocument(COLLECTIONS.MESSAGES, messageId, {
      isPinned: false
    });
    
    logger.info('Message unpinned successfully', { messageId });
    return true;
  } catch (error) {
    logger.error('Error unpinning message', error as Error, { messageId });
    return false;
  }
};

export const addChannelMember = async (channelId: string, userId: string, role: 'admin' | 'member' = 'member'): Promise<boolean> => {
  try {
    const memberId = `${channelId}_${userId}`;
    
    await createDocument(COLLECTIONS.CHANNEL_MEMBERS, {
      channelId,
      userId,
      role,
      joinedAt: new Date()
    }, memberId);

    await updateDocument(COLLECTIONS.CHANNELS, channelId, {
            memberIds: await getChannelMemberIds(channelId)
        });

    const channelDoc = await getDocument(COLLECTIONS.CHANNELS, channelId);
    if (channelDoc) {
      try {
        const { NotificationService } = await import('@/lib/firebase/notificationService');
        
        await NotificationService.createNotification(
          userId,
          'Added to Channel',
          `You have been added to the channel "${channelDoc.name}".`,
          'channel_added',
          channelDoc.organizationId,
          `/organizations/${channelDoc.organizationId}/communication/channels/${channelId}`,
          {
            channelId,
            channelName: channelDoc.name,
            organizationId: channelDoc.organizationId
          }
        );
      } catch (notificationError) {
        logger.warn('Could not create channel member notification', { error: (notificationError as Error).message });
      }
    }

    logger.info('Channel member added successfully', { channelId, userId, role });
    return true;
  } catch (error) {
    logger.error('Error adding channel member', error as Error, { channelId, userId });
    return false;
  }
};

export const removeChannelMember = async (channelId: string, userId: string): Promise<boolean> => {
  try {
    const memberId = `${channelId}_${userId}`;
    await deleteDocument(COLLECTIONS.CHANNEL_MEMBERS, memberId);

    await updateDocument(COLLECTIONS.CHANNELS, channelId, {
            memberIds: await getChannelMemberIds(channelId)
        });

    logger.info('Channel member removed successfully', { channelId, userId });
    return true;
  } catch (error) {
    logger.error('Error removing channel member', error as Error, { channelId, userId });
    return false;
  }
};

const getChannelMemberIds = async (channelId: string): Promise<string[]> => {
  try {
    const collectionRef = getCollectionRef(COLLECTIONS.CHANNEL_MEMBERS);
    const q = query(collectionRef, where('channelId', '==', channelId));
    const querySnapshot = await getDocs(q);
    
    const members: any[] = [];
    querySnapshot.forEach((doc) => {
      members.push({ id: doc.id, ...doc.data() });
    });
    
    return members.map(member => member.userId);
  } catch (error) {
    logger.error('Error fetching channel member IDs', error as Error, { channelId });
    return [];
  }
};

export const getChannelMembers = async (channelId: string): Promise<ChannelMember[]> => {
  try {
    const collectionRef = getCollectionRef(COLLECTIONS.CHANNEL_MEMBERS);
    const q = query(collectionRef, where('channelId', '==', channelId));
    const querySnapshot = await getDocs(q);
    
    const members: any[] = [];
    querySnapshot.forEach((doc) => {
      members.push({ id: doc.id, ...doc.data() });
    });

    return members.map(member => ({
      ...member,
      joinedAt: timestampToDate(member.joinedAt) || new Date(),
      lastReadAt: member.lastReadAt ? timestampToDate(member.lastReadAt) || undefined : undefined
    })) as ChannelMember[];
  } catch (error) {
    logger.error('Error fetching channel members', error as Error, { channelId });
    return [];
  }
};

export const markChannelAsRead = async (channelId: string, userId: string): Promise<boolean> => {
  try {
    const memberId = `${channelId}_${userId}`;
    
    await updateDocument(COLLECTIONS.CHANNEL_MEMBERS, memberId, {
      lastReadAt: new Date()
    });

    logger.info('Channel marked as read', { channelId, userId });
    return true;
  } catch (error) {
    logger.error('Error marking channel as read', error as Error, { channelId, userId });
    return false;
  }
};

export const updateChannel = async (channelId: string, updates: Partial<Pick<Channel, 'name' | 'description'>>): Promise<boolean> => {
  try {
    await updateDocument(COLLECTIONS.CHANNELS, channelId, {
      ...updates,
      updatedAt: new Date()
    });

    logger.info('Channel updated successfully', { channelId, updates });
    return true;
  } catch (error) {
    logger.error('Error updating channel', error as Error, { channelId, updates });
    return false;
  }
};

export const deleteChannel = async (channelId: string): Promise<boolean> => {
  try {
    await deleteDocument(COLLECTIONS.CHANNELS, channelId);
    
    const collectionRef = getCollectionRef(COLLECTIONS.CHANNEL_MEMBERS);
    const membersQuery = query(collectionRef, where('channelId', '==', channelId));
    const membersSnapshot = await getDocs(membersQuery);
    
    const deletePromises = membersSnapshot.docs.map(doc => 
      deleteDocument(COLLECTIONS.CHANNEL_MEMBERS, doc.id)
    );
    
    const messagesRef = getCollectionRef(COLLECTIONS.MESSAGES);
    const messagesQuery = query(messagesRef, where('channelId', '==', channelId));
    const messagesSnapshot = await getDocs(messagesQuery);
    
    const deleteMessagePromises = messagesSnapshot.docs.map(doc => 
      deleteDocument(COLLECTIONS.MESSAGES, doc.id)
    );
    
    await Promise.all([...deletePromises, ...deleteMessagePromises]);

    logger.info('Channel deleted successfully', { channelId });
    return true;
  } catch (error) {
    logger.error('Error deleting channel', error as Error, { channelId });
    return false;
  }
};