import React, { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { AppBar, Toolbar, Typography, IconButton, Tabs, Tab, Box, Container } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import DailyEntry from "./pages/DailyEntry";
import WeeklyInsights from "./pages/WeeklyInsights";
import { sendNotification, requestNotificationPermission } from "./utils/notification"; // Import the notification utility

function App() {
  const [activeTab, setActiveTab] = useState(0);
  const [openDrawer, setOpenDrawer] = useState(false);

  // Handle Tab Change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Set the time for the reminder at 9:00 PM daily
  useEffect(() => {
    // Request notification permission on component load
    requestNotificationPermission();

    const checkAndSendNotification = () => {
      const now = new Date();
      const targetTime = new Date();
      targetTime.setHours(21, 0, 0, 0); // Set target time to 9:00 PM

      if (now >= targetTime) {
        // If it's past 9:00 PM, schedule for next day
        targetTime.setDate(targetTime.getDate() + 1);
      }

      const timeUntilReminder = targetTime.getTime() - now.getTime();

      setTimeout(() => {
        sendNotification("Reminder", "Please enter your tiffin orders for today!");
        checkAndSendNotification(); // Reschedule for the next day
      }, timeUntilReminder);
    };

    checkAndSendNotification(); // Run function initially
  }, []);

  return (
    <div>
      {/* AppBar */}
      <AppBar position="sticky" sx={{ backgroundColor: "#00796B", padding: "10px" }}>
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            aria-label="menu"
            onClick={() => setOpenDrawer(!openDrawer)}
            sx={{
              display: { sm: "none", xs: "block" },
              ":hover": {
                backgroundColor: "transparent", // Remove hover effect
              },
            }}
          >
            {/* <MenuIcon /> */}
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Tiffin Tracker
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Tab Navigation */}
      <Container>
        <Box sx={{ marginTop: 3 }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            indicatorColor="primary"
            textColor="primary"
            centered
            sx={{
              "& .MuiTab-root": {
                ":hover": {
                  backgroundColor: "transparent", // Remove hover effect
                },
              },
            }}
          >
            <Tab label="Daily Entry" />
            <Tab label="Weekly Insights" />
          </Tabs>
        </Box>

        {/* Tab Content */}
        <Box sx={{ marginTop: 3 }}>
          {activeTab === 0 && (
            <Box>
              <Typography variant="h5" sx={{ marginBottom: 2 }}>
                {/* Daily Entry */}
              </Typography>
              <DailyEntry />
            </Box>
          )}
          {activeTab === 1 && (
            <Box>
              <Typography variant="h5" sx={{ marginBottom: 2 }}>
                {/* Weekly Insights */}
              </Typography>
              <WeeklyInsights />
            </Box>
          )}
        </Box>
      </Container>
    </div>
  );
}

export default App;
