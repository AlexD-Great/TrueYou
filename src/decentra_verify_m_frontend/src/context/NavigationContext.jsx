import React, { createContext, useContext, useState } from "react";

const NavigationContext = createContext();

export const NavigationProvider = ({ children }) => {
  const [currentView, setCurrentView] = useState("dashboard");

  const handleViewChange = (newView) => {
    console.log("🎯 Navigation context setCurrentView called with:", newView);
    setCurrentView(newView);
  };

  return (
    <NavigationContext.Provider value={{ currentView, setCurrentView: handleViewChange }}>
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error("useNavigation must be used within a NavigationProvider");
  }
  return context;
};