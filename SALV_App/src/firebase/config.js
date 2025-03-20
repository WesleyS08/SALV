import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyCVc2UlmMzLLQxhlnFAlVGtlgLs6yOridQ',
  authDomain: 'salv-3318f.firebaseapp.com',
  databaseURL: 'https://salv-3318f.firebaseio.com',
  projectId: 'salv-3318f',
  storageBucket: 'salv-3318f.appspot.com',
  messagingSenderId: '336590363532',
  appId: '1:336590363532:android:8114e02667f0d1371854a9',
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
  console.log('Firebase initialized');
} else {
  console.log('Firebase already initialized');
}

export { firebase };