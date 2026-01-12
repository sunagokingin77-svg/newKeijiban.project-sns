// Firebaseの設定情報をここにペーストします
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider } from 'firebase/auth'; // GoogleAuthProviderを追加

// ----------------------------------------------------
// 【重要】ここに、先ほどFirebaseからコピーした設定情報をペーストしてください
// 例：
const firebaseConfig = {
  apiKey: "AIzaSyDIH8EZNMfypKuzQKeDmpPhUL9DGrx_8Y4",
  authDomain: "sns-keijiban-app.firebaseapp.com",
  projectId: "sns-keijiban-app",
  storageBucket: "sns-keijiban-app.firebasestorage.app",
  messagingSenderId: "48668601574",
  appId: "1:48668601574:web:133fa707bc10be5ef35f27",
};
// ----------------------------------------------------


// Firebaseを初期化
const app = initializeApp(firebaseConfig);

// データベース（Firestore）を使えるようにする
export const db = getFirestore(app);
// 認証（ユーザーログイン）機能を使えるようにする
export const auth = getAuth(app);


// Googleログインのプロバイダー（窓口）を設定
export const googleProvider = new GoogleAuthProvider();