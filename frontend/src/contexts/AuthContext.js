import React, { createContext, useState, useContext, useEffect } from 'react';

// -----------------------------------------------------------------------------
// crypto helpers (lines 11-32)
// async function hashPassword(password) {                                           // hash the pwd
//   /**
//   Brief description of function purpose
//   Args:
//   password: plain-text password to hash
//   Returns:
//   sha-256 hex digest
//   */
//   const data = new TextEncoder().encode(password);                                // encode to utf-8
//   const hashBuffer = await crypto.subtle.digest('SHA-256', data);                 // browser crypto
//   const hashArray = [...new Uint8Array(hashBuffer)];                              // bytes → array
//   return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');            // bytes → hex
// }

// function genUserId(hash) {                                                        // quick uid from hash
//   return hash.slice(0, 16);                                                       // 64-bit hex looks nice
// }

// ---------- helper section (right after React imports) ----------
async function hashString(text) {                         // generic sha‑256 helper
  /** return hex digest of any string */
  const data = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(hashBuffer)].map(b => b.toString(16).padStart(2, '0')).join('');
}

const computeUserId = async (email, password) =>          // email:pwd → uid
  hashString(`${email}:${password}`);
// -----------------------------------------------------------------

// Create the auth context
const AuthContext = createContext();

// Mock user data
// const mockUser = {
//   username: 'test',
//   email: 'test@uci.edu',
//   firstName: 'Peter',
//   lastName: 'Anteater',
//   major: 'Computer Science',
//   year: 'Senior',
//   studentId: '12345678',
// };

// Auth provider component
export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // mark ctx ready right after mount (no localStorage anymore)
  useEffect(() => { setLoading(false); }, []);                                    // line 43

  // ------------------------- LOGIN ------------------------------------------
  const login = async (email, password) => {               // email required now
    const userId = await computeUserId(email, password);   // uid derived
    const res = await fetch('http://localhost:3001/account/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })                     // pwd never leaves client
    });

    if (!res.ok) {                                                               // invalid creds?
      const msg = await res.text();
      throw new Error(msg || 'invalid credentials');
    }

    const user = await res.json();                                               // full user profile
    setCurrentUser(user);                                                        // keep in‑memory only
    return user;
  };

  // ------------------------- SIGN-UP ----------------------------------------
  const signup = async (userData) => {
    const userId = await computeUserId(userData.email, userData.password);
    const newUser = { ...userData, userId };
    delete newUser.password;                               // drop plain pwd

    setCurrentUser(newUser);                                                     // in‑memory only

    try {                                                                        // POST to backend
      await fetch('http://localhost:3001/account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser)
      });
    } catch (err) {
      console.error('failed to sync user (signup)', err);
    }

    return newUser;
  };

  // -------------------------- LOGOUT ----------------------------------------
  const logout = () => {                                                         // wipe session
    setCurrentUser(null);
  };

  const value = { currentUser, login, signup, logout, loading };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

// Custom hook for using auth context
export function useAuth() {
  return useContext(AuthContext);
}
