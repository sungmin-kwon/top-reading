// js/firebase-init.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyARGXx_Xyo6BMuMuDLOriWTISKCB3hbXi0",
  authDomain: "top-reading.firebaseapp.com",
  projectId: "top-reading",
  storageBucket: "top-reading.appspot.com",
  messagingSenderId: "147776736959",
  appId: "1:147776736959:web:150f3a25409ba7f2c1800a",
  measurementId: "G-NDKY8VNG00"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
