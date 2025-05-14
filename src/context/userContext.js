// filepath: c:\Users\Lenovo\Desktop\pi1\MERN-Project-Manager\Client\src\context\userContext.js
import React, { createContext, useState } from 'react';

export const UserContext = createContext();

export const UserContextProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
};