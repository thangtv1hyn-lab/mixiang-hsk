import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  inMemoryPersistence,
  setPersistence,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDocFromServer,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

export const BOOTSTRAPPED_ADMIN_EMAIL = 'thangtv1.hyn@gmail.com';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
// CRITICAL: Always pass firebaseConfig.firestoreDatabaseId for the provisioned Enterprise Firestore DB
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

/**
 * Secondary Firebase Auth instance (in-memory only) used exclusively when an Admin
 * provisions a new student/teacher account so the Admin's primary session stays intact.
 */
function getSecondaryAuth() {
  const secondaryName = 'AdminUserProvisioner';
  const existing = getApps().find((a) => a.name === secondaryName);
  const secondaryApp = existing || initializeApp(firebaseConfig, secondaryName);
  return getAuth(secondaryApp);
}

function mapFirebaseAuthError(err: any, fallback: string): string {
  const code = err?.code || '';
  if (code === 'auth/operation-not-allowed' || code === 'auth/configuration-not-found') {
    return 'Bạn chưa bật phương thức đăng nhập Email/Mật khẩu trong Firebase Console → Authentication → Sign-in method → Email/Password (Enable → Save).';
  }
  if (code === 'auth/email-already-in-use') {
    return 'Email này đã được đăng ký tài khoản trên hệ thống. Vui lòng dùng email khác hoặc đặt lại mật khẩu.';
  }
  if (code === 'auth/invalid-email') {
    return 'Địa chỉ email không đúng định dạng.';
  }
  if (code === 'auth/weak-password') {
    return 'Mật khẩu quá yếu. Vui lòng nhập tối thiểu 6 ký tự.';
  }
  if (
    code === 'auth/invalid-credential' ||
    code === 'auth/wrong-password' ||
    code === 'auth/user-not-found'
  ) {
    return 'Email hoặc mật khẩu không chính xác. Vui lòng kiểm tra lại.';
  }
  if (code === 'auth/user-disabled') {
    return 'Tài khoản này đã bị vô hiệu hóa. Vui lòng liên hệ quản trị viên.';
  }
  if (code === 'auth/too-many-requests') {
    return 'Thao tác quá nhiều lần liên tiếp. Vui lòng đợi vài phút rồi thử lại.';
  }
  if (code === 'auth/network-request-failed') {
    return 'Lỗi kết nối mạng tới máy chủ xác thực. Vui lòng kiểm tra mạng và thử lại.';
  }
  return err?.message || fallback;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData.map((provider) => ({
          providerId: provider.providerId,
          displayName: provider.displayName,
          email: provider.email,
          photoUrl: provider.photoURL,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration (Firestore client is offline).');
      return false;
    }
    // Missing document or non-offline response still confirms reachable Firestore backend
    return true;
  }
}

if (typeof window !== 'undefined') {
  void testFirestoreConnection();
}

export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('email');
googleProvider.addScope('profile');
// Always show the official Google account chooser so each user selects their own account
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

export interface GoogleSignInResult {
  uid: string;
  idToken: string;
  email: string;
  name: string;
  avatar: string;
}

export async function signInWithGooglePopup(): Promise<GoogleSignInResult> {
  try {
    const credential = await signInWithPopup(auth, googleProvider);
    const user = credential.user;
    if (!user || !user.email) {
      throw new Error('Không lấy được địa chỉ email từ tài khoản Google. Vui lòng thử lại.');
    }
    const idToken = await user.getIdToken(true);
    return {
      uid: user.uid,
      idToken,
      email: user.email,
      name: user.displayName || user.email.split('@')[0],
      avatar: user.photoURL || '',
    };
  } catch (err: any) {
    const code = err?.code || '';
    if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
      throw new Error('Bạn đã đóng cửa sổ chọn tài khoản Google. Hãy bấm lại để tiếp tục.');
    }
    if (code === 'auth/popup-blocked') {
      throw new Error(
        'Trình duyệt đang chặn cửa sổ bật lên (Popup). Vui lòng cho phép mở popup cho trang web này rồi thử lại.'
      );
    }
    if (code === 'auth/unauthorized-domain') {
      throw new Error(
        `Tên miền hiện tại (${window.location.hostname}) chưa được thêm vào Authorized Domains trong Firebase Console → Authentication → Settings.`
      );
    }
    throw new Error(mapFirebaseAuthError(err, 'Không thể đăng nhập bằng Google lúc này. Vui lòng thử lại.'));
  }
}

export async function createFirebaseAccountAsAdmin(
  email: string,
  password: string,
  displayName?: string
): Promise<{ uid: string; email: string }> {
  const secondaryAuth = getSecondaryAuth();
  try {
    await setPersistence(secondaryAuth, inMemoryPersistence);
    const normalizedEmail = email.trim().toLowerCase();
    const credential = await createUserWithEmailAndPassword(secondaryAuth, normalizedEmail, password);
    if (displayName && displayName.trim()) {
      await updateProfile(credential.user, { displayName: displayName.trim() }).catch(() => {});
    }
    return {
      uid: credential.user.uid,
      email: normalizedEmail,
    };
  } catch (err: any) {
    throw new Error(mapFirebaseAuthError(err, 'Không thể tạo tài khoản mới trên Firebase Authentication.'));
  } finally {
    await signOut(secondaryAuth).catch(() => {});
  }
}

export async function signUpWithEmailPassword(
  email: string,
  password: string,
  displayName: string
): Promise<{ uid: string; email: string; name: string }> {
  try {
    const normalizedEmail = email.trim().toLowerCase();
    const credential = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
    const cleanName = displayName.trim() || normalizedEmail.split('@')[0];
    await updateProfile(credential.user, { displayName: cleanName }).catch(() => {});
    return {
      uid: credential.user.uid,
      email: normalizedEmail,
      name: cleanName,
    };
  } catch (err: any) {
    throw new Error(mapFirebaseAuthError(err, 'Đăng ký tài khoản không thành công.'));
  }
}

export async function signInWithEmailPassword(
  email: string,
  password: string
): Promise<{ uid: string; email: string; name: string; avatar: string }> {
  try {
    const normalizedEmail = email.trim().toLowerCase();
    const credential = await signInWithEmailAndPassword(auth, normalizedEmail, password);
    const user = credential.user;
    return {
      uid: user.uid,
      email: user.email || normalizedEmail,
      name: user.displayName || normalizedEmail.split('@')[0],
      avatar: user.photoURL || '',
    };
  } catch (err: any) {
    throw new Error(mapFirebaseAuthError(err, 'Đăng nhập không thành công.'));
  }
}

export async function sendFirebasePasswordReset(email: string): Promise<void> {
  try {
    const normalizedEmail = email.trim().toLowerCase();
    await sendPasswordResetEmail(auth, normalizedEmail);
  } catch (err: any) {
    throw new Error(mapFirebaseAuthError(err, 'Không thể gửi email đặt lại mật khẩu.'));
  }
}

export async function signOutFirebase(): Promise<void> {
  try {
    await signOut(auth);
  } catch {
    // Ignore client sign-out errors if already signed out
  }
}
