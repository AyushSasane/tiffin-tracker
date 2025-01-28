export const sendNotification = (title, message) => {
    if (Notification.permission === "granted") {
      new Notification(title, {
        body: message,
        icon: "/tiffin-icon.png", // Custom icon if you'd like
      });
    } else if (Notification.permission !== "denied") {
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
          new Notification(title, {
            body: message,
            icon: "/tiffin-icon.png",
          });
        }
      });
    }
  };
  