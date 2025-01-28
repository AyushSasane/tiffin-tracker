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
            icon: "/assets/food-icon.png", // Updated icon path
          });
        }
      });
    }
};
