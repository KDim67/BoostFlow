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

// Logger instance for tracking communication service operations
const logger = createLogger('CommunicationService');

/**
 * Represents a message within a channel or conversation
 * Supports text content, attachments, threading, and social features like pinning
 */
export interface Message {
  id: string;
  channelId: string;
  conversationId?: string; // Optional for direct message conversations
  content: string;
  author: string; // User ID of the message author
  authorName?: string; // Display name for the author
  createdAt: Date;
  updatedAt?: Date; // Set when message is edited
  attachments?: Attachment[]; // Files, images, or links attached to the message
  isEdited: boolean; // Indicates if the message has been modified
  isPinned: boolean; // Whether the message is pinned in the channel
  mentions?: string[]; // Array of user IDs mentioned in the message
  threadId?: string; // For threaded conversations
  replyCount?: number; // Number of replies in a thread
}

/**
 * Represents a file, image, or link attachment to a message
 * Supports various media types with optional thumbnails and metadata
 */
export interface Attachment {
  id: string;
  messageId: string; // Reference to the parent message
  type: 'image' | 'file' | 'link'; // Type of attachment for proper rendering
  url: string; // Direct URL to the attachment resource
  name: string; // Display name for the attachment
  size?: number; // File size in bytes (for files)
  thumbnailUrl?: string; // Preview image URL (for images/videos)
  metadata?: Record<string, any>; // Additional type-specific data
}



/**
 * Represents a communication channel within an organization
 * Can be public (accessible to all org members) or private (invite-only)
 */
export interface Channel {
  id: string;
  name: string;
  description?: string; // Optional channel description
  type: 'public' | 'private'; // Determines access control
  memberIds: string[]; // Array of user IDs who are members
  createdBy: string; // User ID of the channel creator
  createdAt: Date;
  updatedAt: Date;
  isArchived: boolean; // Archived channels are hidden but preserved
  lastActivity?: Date; // Timestamp of the most recent message
  organizationId: string; // Parent organization
  projectId?: string; // Optional project association
}

/**
 * Represents a user's membership in a specific channel
 * Tracks role, join date, and read status for notification management
 */
export interface ChannelMember {
  userId: string;
  channelId: string;
  role: 'admin' | 'member'; // Admins can manage channel settings and members
  joinedAt: Date;
  lastReadAt?: Date; // Used to determine unread message count
}

// Firestore collection names for communication data
const COLLECTIONS = {
  CHANNELS: 'channels',
  MESSAGES: 'messages',
  CHANNEL_MEMBERS: 'channelMembers'
};

/**
 * Creates a new communication channel within an organization
 * Automatically sets up default properties and adds creator as admin for private channels
 * 
 * @param channel - Channel data excluding auto-generated fields
 * @returns Promise resolving to the created channel with all fields populated
 */
export const createChannel = async (channel: Omit<Channel, 'id' | 'createdAt' | 'updatedAt' | 'isArchived' | 'lastActivity'>): Promise<Channel> => {
  try {
    // Set default values for auto-managed fields
    const channelData = {
      ...channel,
      isArchived: false,
      lastActivity: new Date()
    };

    const channelId = await createDocument(COLLECTIONS.CHANNELS, channelData);
    
    // Retrieve the created channel to get server-generated timestamps
    const createdChannel = await getDocument(COLLECTIONS.CHANNELS, channelId);
    if (!createdChannel) {
      throw new Error('Failed to retrieve created channel');
    }

    // For private channels, automatically add the creator as an admin
    if (channel.type === 'private' && channel.createdBy) {
      await addChannelMember(channelId, channel.createdBy, 'admin');
    }

    // Convert Firestore timestamps to JavaScript Date objects
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

/**
 * Retrieves a single channel by its ID
 * Converts Firestore timestamps to JavaScript Date objects for client use
 * 
 * @param id - The channel ID to retrieve
 * @returns Promise resolving to the channel or null if not found
 */
export const getChannel = async (id: string): Promise<Channel | null> => {
  try {
    const channelDoc = await getDocument(COLLECTIONS.CHANNELS, id);
    if (!channelDoc) {
      return null;
    }

    // Convert Firestore timestamps to JavaScript Date objects
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

/**
 * Retrieves all active (non-archived) channels for an organization
 * Results are ordered by most recent activity for better UX
 * 
 * @param organizationId - The organization ID to fetch channels for
 * @returns Promise resolving to array of channels sorted by recent activity
 */
export const getChannelsByOrganization = async (organizationId: string): Promise<Channel[]> => {
  try {
    const collectionRef = getCollectionRef(COLLECTIONS.CHANNELS);
    // Query for active channels in the organization, ordered by recent activity
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

    // Convert Firestore timestamps to JavaScript Date objects
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

/**
 * Retrieves channels that a specific user has access to within an organization
 * Includes all public channels and only private channels where the user is a member
 * 
 * @param organizationId - The organization ID to fetch channels for
 * @param userId - The user ID to check channel access for
 * @returns Promise resolving to array of accessible channels
 */
export const getChannelsByOrganizationForUser = async (organizationId: string, userId: string): Promise<Channel[]> => {
  try {
    const allChannels = await getChannelsByOrganization(organizationId);
    
    const filteredChannels: Channel[] = [];
    
    // Filter channels based on user access permissions
    for (const channel of allChannels) {
      if (channel.type === 'public') {
        // All users can access public channels
        filteredChannels.push(channel);
      } else if (channel.type === 'private') {
        // Check if user is a member of the private channel
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

/**
 * Gets an existing direct message channel between two users or creates one if it doesn't exist
 * Uses deterministic ID generation to ensure the same channel is always used for the same pair
 * 
 * @param userId1 - First user ID
 * @param userId2 - Second user ID
 * @param organizationId - Organization context for the DM
 * @returns Promise resolving to the direct message channel
 */
export const getOrCreateDirectMessageChannel = async (userId1: string, userId2: string, organizationId: string): Promise<Channel> => {
  try {
    // Create deterministic conversation ID by sorting user IDs
    // This ensures the same channel is used regardless of parameter order
    const conversationId = [userId1, userId2].sort().join('_');
    
    // Check if a DM channel already exists between these users
    const existingChannel = await getChannel(conversationId);
    if (existingChannel) {
      return existingChannel;
    }

    // Create new DM channel with predefined structure
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

/**
 * Sends a new message to a channel and handles related side effects
 * Automatically updates channel activity, manages notifications for DMs, and sets default message properties
 * 
 * @param message - Message data excluding auto-generated fields
 * @returns Promise resolving to the created message with all fields populated
 */
export const sendMessage = async (message: Omit<Message, 'id' | 'createdAt' | 'updatedAt' | 'isEdited' | 'isPinned'>): Promise<Message> => {
  try {
    // Set default values for new messages
    const messageData = {
      ...message,
      isEdited: false,
      isPinned: false,
      replyCount: 0
    };

    const messageId = await createDocument(COLLECTIONS.MESSAGES, messageData);
    
    // Update channel's last activity timestamp (non-critical operation)
    try {
      await updateDocument(COLLECTIONS.CHANNELS, message.channelId, {
        lastActivity: new Date()
      });
    } catch (channelError) {
      logger.warn('Could not update channel lastActivity', { channelId: message.channelId, error: (channelError as Error).message });
    }

    // Handle direct message notifications (non-critical operation)
    try {
      const channel = await getChannel(message.channelId);
      // Only create notifications for direct messages (private channels with 2 members)
      if (channel && channel.type === 'private' && channel.memberIds.length === 2) {
        const recipientId = channel.memberIds.find(id => id !== message.author);
        if (recipientId) {
          // Dynamic imports to avoid circular dependencies
          const { NotificationService } = await import('@/lib/firebase/notificationService');
          const { getUserProfile } = await import('@/lib/firebase/userProfileService');
          
          const senderProfile = await getUserProfile(message.author);
          const senderName = senderProfile?.displayName || message.authorName || 'Someone';
          
          // Check for existing unread DM notification from this sender
          const existingNotifications = await NotificationService.getUserNotifications(recipientId, 50, true, true);
          const existingDMNotification = existingNotifications.find(n => 
            n.type === 'direct_message' && 
            n.metadata?.senderId === message.author &&
            !n.read
          );
          
          // Update existing notification or create new one to avoid spam
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

    // Retrieve the created message with server-generated timestamps
    const createdMessage = await getDocument(COLLECTIONS.MESSAGES, messageId);
    if (!createdMessage) {
      throw new Error('Failed to retrieve created message');
    }

    // Convert Firestore timestamps to JavaScript Date objects
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

/**
 * Retrieves messages from a channel with optional pagination and filtering
 * Supports time-based filtering and configurable limits for efficient loading
 * 
 * @param channelId - The channel ID to fetch messages from
 * @param options - Optional filtering and pagination parameters
 * @returns Promise resolving to array of messages in chronological order
 */
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
    
    // Add time-based filtering constraints if provided
    if (before) {
      constraints.push(where('createdAt', '<', before));
    }
    if (after) {
      constraints.push(where('createdAt', '>', after));
    }

    // Order by creation time (newest first) and apply limit
    constraints.push(orderBy('createdAt', 'desc'));
    constraints.push(limitQuery(limit));

    const q = query(collectionRef, ...constraints);
    const querySnapshot = await getDocs(q);
    
    const messages: any[] = [];
    querySnapshot.forEach((doc) => {
      messages.push({ id: doc.id, ...doc.data() });
    });

    // Convert timestamps and reverse to chronological order (oldest first)
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

/**
 * Updates the content of an existing message and marks it as edited
 * Automatically sets the isEdited flag and updates the timestamp
 * 
 * @param id - The message ID to update
 * @param content - The new message content
 * @returns Promise resolving to the updated message or null if not found
 */
export const updateMessage = async (id: string, content: string): Promise<Message | null> => {
  try {
    await updateDocument(COLLECTIONS.MESSAGES, id, {
      content,
      isEdited: true // Mark message as edited for UI indication
    });

    const updatedMessage = await getDocument(COLLECTIONS.MESSAGES, id);
    if (!updatedMessage) {
      return null;
    }

    // Convert Firestore timestamps to JavaScript Date objects
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

/**
 * Permanently deletes a message from the database
 * Note: This is a hard delete - consider soft delete for audit trails
 * 
 * @param id - The message ID to delete
 * @returns Promise resolving to true if successful, false otherwise
 */
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

/**
 * Pins a message in a channel for easy reference
 * Pinned messages are typically displayed prominently in the UI
 * 
 * @param messageId - The message ID to pin
 * @returns Promise resolving to true if successful, false otherwise
 */
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

/**
 * Unpins a previously pinned message
 * Removes the message from the pinned messages display
 * 
 * @param messageId - The message ID to unpin
 * @returns Promise resolving to true if successful, false otherwise
 */
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

/**
 * Adds a user to a channel with the specified role
 * Creates membership record, updates channel member list, and sends notification
 * 
 * @param channelId - The channel ID to add the user to
 * @param userId - The user ID to add as a member
 * @param role - The role to assign ('admin' or 'member')
 * @returns Promise resolving to true if successful, false otherwise
 */
export const addChannelMember = async (channelId: string, userId: string, role: 'admin' | 'member' = 'member'): Promise<boolean> => {
  try {
    // Create composite ID to ensure uniqueness and easy lookups
    const memberId = `${channelId}_${userId}`;
    
    // Create the membership record
    await createDocument(COLLECTIONS.CHANNEL_MEMBERS, {
      channelId,
      userId,
      role,
      joinedAt: new Date()
    }, memberId);

    // Update the channel's member list for quick access
    await updateDocument(COLLECTIONS.CHANNELS, channelId, {
            memberIds: await getChannelMemberIds(channelId)
        });

    // Send notification to the new member (non-critical operation)
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

/**
 * Removes a user from a channel
 * Deletes membership record and updates channel member list
 * 
 * @param channelId - The channel ID to remove the user from
 * @param userId - The user ID to remove from the channel
 * @returns Promise resolving to true if successful, false otherwise
 */
export const removeChannelMember = async (channelId: string, userId: string): Promise<boolean> => {
  try {
    // Use composite ID to locate the membership record
    const memberId = `${channelId}_${userId}`;
    await deleteDocument(COLLECTIONS.CHANNEL_MEMBERS, memberId);

    // Update the channel's member list to reflect the removal
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

/**
 * Helper function to retrieve all user IDs for members of a specific channel
 * Used internally to maintain the memberIds array in channel documents
 * 
 * @param channelId - The channel ID to get member IDs for
 * @returns Promise resolving to array of user IDs, empty array on error
 */
const getChannelMemberIds = async (channelId: string): Promise<string[]> => {
  try {
    const collectionRef = getCollectionRef(COLLECTIONS.CHANNEL_MEMBERS);
    const q = query(collectionRef, where('channelId', '==', channelId));
    const querySnapshot = await getDocs(q);
    
    const members: any[] = [];
    querySnapshot.forEach((doc) => {
      members.push({ id: doc.id, ...doc.data() });
    });
    
    // Extract just the user IDs from the membership records
    return members.map(member => member.userId);
  } catch (error) {
    logger.error('Error fetching channel member IDs', error as Error, { channelId });
    return []; // Return empty array to prevent breaking operations
  }
};

/**
 * Retrieves detailed membership information for all members of a channel
 * Includes role, join date, and read status for each member
 * 
 * @param channelId - The channel ID to get members for
 * @returns Promise resolving to array of channel member objects
 */
export const getChannelMembers = async (channelId: string): Promise<ChannelMember[]> => {
  try {
    const collectionRef = getCollectionRef(COLLECTIONS.CHANNEL_MEMBERS);
    const q = query(collectionRef, where('channelId', '==', channelId));
    const querySnapshot = await getDocs(q);
    
    const members: any[] = [];
    querySnapshot.forEach((doc) => {
      members.push({ id: doc.id, ...doc.data() });
    });

    // Convert Firestore timestamps to JavaScript Date objects
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

/**
 * Updates a user's last read timestamp for a channel
 * Used to track unread messages and show notification badges
 * 
 * @param channelId - The channel ID that was read
 * @param userId - The user ID who read the channel
 * @returns Promise resolving to true if successful, false otherwise
 */
export const markChannelAsRead = async (channelId: string, userId: string): Promise<boolean> => {
  try {
    // Use composite ID to locate the specific membership record
    const memberId = `${channelId}_${userId}`;
    
    await updateDocument(COLLECTIONS.CHANNEL_MEMBERS, memberId, {
      lastReadAt: new Date() // Update to current timestamp
    });

    logger.info('Channel marked as read', { channelId, userId });
    return true;
  } catch (error) {
    logger.error('Error marking channel as read', error as Error, { channelId, userId });
    return false;
  }
};

/**
 * Updates channel metadata such as name and description
 * Automatically updates the updatedAt timestamp
 * 
 * @param channelId - The channel ID to update
 * @param updates - Partial channel data containing fields to update
 * @returns Promise resolving to true if successful, false otherwise
 */
export const updateChannel = async (channelId: string, updates: Partial<Pick<Channel, 'name' | 'description'>>): Promise<boolean> => {
  try {
    await updateDocument(COLLECTIONS.CHANNELS, channelId, {
      ...updates,
      updatedAt: new Date() // Automatically track when channel was last modified
    });

    logger.info('Channel updated successfully', { channelId, updates });
    return true;
  } catch (error) {
    logger.error('Error updating channel', error as Error, { channelId, updates });
    return false;
  }
};

/**
 * Permanently deletes a channel and all associated data
 * Performs cascading delete of channel members and messages
 * 
 * @param channelId - The channel ID to delete
 * @returns Promise resolving to true if successful, false otherwise
 */
export const deleteChannel = async (channelId: string): Promise<boolean> => {
  try {
    // Delete the channel document first
    await deleteDocument(COLLECTIONS.CHANNELS, channelId);
    
    // Find and delete all channel membership records
    const collectionRef = getCollectionRef(COLLECTIONS.CHANNEL_MEMBERS);
    const membersQuery = query(collectionRef, where('channelId', '==', channelId));
    const membersSnapshot = await getDocs(membersQuery);
    
    const deletePromises = membersSnapshot.docs.map(doc => 
      deleteDocument(COLLECTIONS.CHANNEL_MEMBERS, doc.id)
    );
    
    // Find and delete all messages in the channel
    const messagesRef = getCollectionRef(COLLECTIONS.MESSAGES);
    const messagesQuery = query(messagesRef, where('channelId', '==', channelId));
    const messagesSnapshot = await getDocs(messagesQuery);
    
    const deleteMessagePromises = messagesSnapshot.docs.map(doc => 
      deleteDocument(COLLECTIONS.MESSAGES, doc.id)
    );
    
    // Execute all deletions in parallel for efficiency
    await Promise.all([...deletePromises, ...deleteMessagePromises]);

    logger.info('Channel deleted successfully', { channelId });
    return true;
  } catch (error) {
    logger.error('Error deleting channel', error as Error, { channelId });
    return false;
  }
};