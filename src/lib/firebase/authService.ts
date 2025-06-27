import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  sendEmailVerification,
  User,
  UserCredential
} from 'firebase/auth';
import { auth } from './config';

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export const registerUser = async (
  email: string, 
  password: string, 
  displayName?: string
): Promise<UserCredential> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    if (displayName && userCredential.user) {
      await updateProfile(userCredential.user, { displayName });
    }
    
    return userCredential;
  } catch (error) {
    console.error('Error registering user:', error);
    throw error;
  }
};

export const loginUser = async (
  email: string, 
  password: string
): Promise<UserCredential> => {
  try {
    return await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    console.error('Error logging in:', error);
    throw error;
  }
};

export const logoutUser = async (): Promise<void> => {
  try {
    return await signOut(auth);
  } catch (error) {
    console.error('Error logging out:', error);
    throw error;
  }
};

export const resetPassword = async (email: string): Promise<void> => {
  try {
    const actionCodeSettings = {
      url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://boostflow.me'}/auth-handler/auth/action`,
      handleCodeInApp: true,
    };
    
    return await sendPasswordResetEmail(auth, email, actionCodeSettings);
  } catch (error) {
    console.error('Error resetting password:', error);
    throw error;
  }
};

export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};

export const signInWithGoogle = async (): Promise<UserCredential> => {
  try {
    return await signInWithPopup(auth, googleProvider);
  } catch (error) {
    console.error('Error signing in with Google:', error);
    throw error;
  }
};

export const sendVerificationEmail = async (user: User): Promise<void> => {
  try {
    const actionCodeSettings = {
      url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://boostflow.me'}/auth-handler/auth/action`,
      handleCodeInApp: true,
    };
    
    await sendEmailVerification(user, actionCodeSettings);
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw error;
  }
};

export const subscribeToAuthChanges = (
  callback: (user: User | null) => void
) => {
  return onAuthStateChanged(auth, callback);
};