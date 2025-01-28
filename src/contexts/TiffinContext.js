// src/contexts/TiffinContext.js
import { createContext, useContext, useState } from "react";

const TiffinContext = createContext();

export function useTiffin() {
  return useContext(TiffinContext);
}

export function TiffinProvider({ children }) {
  const [orders, setOrders] = useState([]);
  const [members, setMembers] = useState(["Member 1", "Member 2", "Member 3", "Member 4", "Member 5"]);
  
  const addOrder = (order) => {
    setOrders((prevOrders) => [...prevOrders, order]);
  };

  const addMember = (memberName) => {
    setMembers((prevMembers) => [...prevMembers, memberName]);
  };

  return (
    <TiffinContext.Provider value={{ orders, members, addOrder, addMember }}>
      {children}
    </TiffinContext.Provider>
  );
}
