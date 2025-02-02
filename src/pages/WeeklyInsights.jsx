import React, { useEffect, useState } from "react";
import { db } from "../firebaseConfig";
import { collection, query, where, getDocs, Timestamp } from "firebase/firestore";
import {
  Box,
  Typography,
  CircularProgress,
  Card,
  CardContent,
  List,
  ListItem,
  Divider,
  Alert,
  LinearProgress,
  Stack,
  Chip,
  Button,
} from "@mui/material";

function WeeklyInsights() {
  const [weeklyTotal, setWeeklyTotal] = useState({});
  const [loading, setLoading] = useState(true);
  const [weekRange, setWeekRange] = useState("");
  const [members, setMembers] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date()); // Track selected week

  // Function to get the start and end of the week
  const getWeekRange = (date) => {
    const startOfWeek = new Date(date);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay()); // Sunday as start
    startOfWeek.setHours(0, 0, 0, 0); // Reset time to 00:00:00

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // Saturday as end
    endOfWeek.setHours(23, 59, 59, 999); // Set time to 23:59:59

    return {
      startOfWeek,
      endOfWeek,
      formatted: `${startOfWeek.toLocaleDateString()} - ${endOfWeek.toLocaleDateString()}`
    };
  };

  // Fetch members dynamically from Firestore
  const fetchMembers = async () => {
    try {
      const ordersSnapshot = await getDocs(collection(db, "orders"));
      const memberSet = new Set();

      ordersSnapshot.forEach((doc) => {
        const data = doc.data();
        Object.keys(data).forEach((key) => {
          if (key !== "timestamp") {
            memberSet.add(key);
          }
        });
      });

      setMembers(Array.from(memberSet));
    } catch (error) {
      console.error("Error fetching members:", error);
    }
  };

  // Fetch weekly data based on selected date
  const fetchWeeklyData = async () => {
    setLoading(true);
    const { startOfWeek, endOfWeek, formatted } = getWeekRange(selectedDate);

    setWeekRange(formatted);
    const startTimestamp = Timestamp.fromDate(startOfWeek);
    const endTimestamp = Timestamp.fromDate(endOfWeek);

    const ordersQuery = query(
      collection(db, "orders"),
      where("timestamp", ">=", startTimestamp),
      where("timestamp", "<=", endTimestamp)
    );

    try {
      const querySnapshot = await getDocs(ordersQuery);
      const totalCosts = {};

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        Object.keys(data).forEach((member) => {
          if (member !== "timestamp") {
            totalCosts[member] = (totalCosts[member] || 0) + parseFloat(data[member].cost);
          }
        });
      });

      setWeeklyTotal(totalCosts);
    } catch (error) {
      console.error("Error fetching weekly data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  useEffect(() => {
    fetchWeeklyData();
  }, [selectedDate]); // Refetch when selected date changes

  const maxCost = Math.max(...Object.values(weeklyTotal), 0);

  // Navigation for previous and next weeks
  const handleWeekChange = (weeks) => {
    setSelectedDate((prevDate) => {
      const newDate = new Date(prevDate);
      newDate.setDate(prevDate.getDate() + weeks * 7); // Move forward or backward by 7 days
      return newDate;
    });
  };

  // Export data to CSV
  const exportToCSV = () => {
    const rows = [
      ["Member", "Total Cost"],
      ...members.map((member) => [member, (weeklyTotal[member] || 0).toFixed(2)])
    ];

    const csvContent = rows.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");

    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `weekly_insights_${weekRange}.csv`);
      link.click();
    }
  };

  return (
    <Box sx={{ maxWidth: 700, mx: "auto", mt: 5, p: 3 }}>
      <Typography variant="h4" align="center" gutterBottom>
        Weekly Insights
      </Typography>
      <Typography variant="subtitle1" align="center" color="text.secondary" gutterBottom>
        Week: {weekRange}
      </Typography>

      {/* Week Navigation Buttons */}
      <Box sx={{ display: "flex", justifyContent: "center", gap: 2, mb: 2 }}>
        <Button variant="outlined" onClick={() => handleWeekChange(-1)}>
          Previous Week
        </Button>
        <Button
          variant="outlined"
          onClick={() => handleWeekChange(1)}
          disabled={getWeekRange(selectedDate).formatted === getWeekRange(new Date()).formatted}
        >
          Next Week
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <CircularProgress size={60} />
        </Box>
      ) : (
        <Card sx={{ boxShadow: 4, borderRadius: 3, p: 2 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Total Costs for the Week
            </Typography>
            <Divider sx={{ mb: 2 }} />
            {members.length > 0 ? (
              <List>
                <Stack spacing={3}>
                  {members.map((member) => (
                    <ListItem key={member} sx={{ px: 0 }}>
                      <Stack spacing={1} width="100%">
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Typography variant="body1" sx={{ fontWeight: 600 }}>
                            {member}
                          </Typography>
                          <Chip
                            label={(weeklyTotal[member] || 0).toFixed(2)}
                            color="primary"
                            size="small"
                          />
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={((weeklyTotal[member] || 0) / maxCost) * 100}
                          sx={{ height: 8, borderRadius: 2 }}
                        />
                      </Stack>
                    </ListItem>
                  ))}
                </Stack>
              </List>
            ) : (
              <Alert severity="info" sx={{ mt: 3 }}>
                No data available for this week.
              </Alert>
            )}
            <Button variant="contained" color="primary" onClick={exportToCSV} sx={{ mt: 3 }}>
              Export to CSV
            </Button>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}

export default WeeklyInsights;
