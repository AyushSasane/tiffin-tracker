export const sendNotification = (title, message) => {
  if (Notification.permission === "granted") {
    new Notification(title, {
      body: message,
      icon: "/food.png", // Updated icon path
    });
  } else if (Notification.permission !== "denied") {
    Notification.requestPermission().then((permission) => {
      if (permission === "granted") {
        new Notification(title, {
          body: message,
          icon: "/food.png", // Updated icon path
        });
      }
    });
  } else {
    // If permission is denied, display a custom message
    console.log("Notifications are denied. Please enable them in your browser settings.");
    // Display custom UI or a message to the user here
    alert("Notifications are disabled. Please enable them manually in your browser settings.");
  }
};

// This function will be used to request notification permission again
export const requestNotificationPermission = () => {
  if (Notification.permission === "default") {
    Notification.requestPermission().then((permission) => {
      console.log("Notification permission: ", permission);
    });
  } else if (Notification.permission === "denied") {
    console.log("Notifications are denied. Please enable them in your browser settings.");
    // Optionally, show an alert or a banner encouraging users to enable notifications manually
    alert("Notifications are disabled. Please enable them manually in your browser settings.");
  }
};
