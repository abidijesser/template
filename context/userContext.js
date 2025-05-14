/* eslint-disable prettier/prettier */
import axios from 'axios';
import React, { createContext, useState, useEffect } from 'react';

export const UserContext = createContext({});

export function UserContextProvider({ children }) {
    const [user, setUser] = useState(null);

    useEffect(() => {
        if (!user) {
            axios.get('http://localhost:3001/profile')
            .then((data) => {
                setUser(data.data);
            })
            .catch((error) => {
                console.error('Error fetching user data: ', error);
            });
        }
    }, []); 

    return React.createElement(
        UserContext.Provider, 
        { value: { user, setUser } }, 
        children
    );
}
