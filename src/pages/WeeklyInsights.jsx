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
  const [currentWeek, setCurrentWeek] = useState(""); // Track current week range

  // Helper function to format week range
  const getWeekRange = (date) => {
    const startOfWeek = new Date(date);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay()); // Start of the week (Sunday)
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // End of the week (Saturday)
    return `${startOfWeek.toLocaleDateString()} - ${endOfWeek.toLocaleDateString()}`;
  };

  // Fetch weekly data and member list once component mounts
  useEffect(() => {
    const fetchMembersAndData = async () => {
      try {
        // Fetch all orders
        const ordersSnapshot = await getDocs(collection(db, "orders"));
        const memberSet = new Set(); // Use a Set to avoid duplicates
        const now = new Date();
        const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay())); // Start of the week (Sunday)
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6); // End of the week (Saturday)

        setWeekRange(getWeekRange(now)); // Set current week range
        const startTimestamp = Timestamp.fromDate(startOfWeek);
        const endTimestamp = Timestamp.fromDate(endOfWeek);

        // Prepare the query for weekly data
        const ordersQuery = query(
          collection(db, "orders"),
          where("timestamp", ">=", startTimestamp),
          where("timestamp", "<=", endTimestamp)
        );

        // Fetch weekly data
        const querySnapshot = await getDocs(ordersQuery);
        const totalCosts = {};

        // Extract member data
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          Object.keys(data).forEach((member) => {
            if (member !== "timestamp") {
              memberSet.add(member); // Add member to the Set
              totalCosts[member] = (totalCosts[member] || 0) + parseFloat(data[member].cost);
            }
          });
        });

        // Set members and weekly total data
        setMembers(Array.from(memberSet)); // Convert Set to array
        setWeeklyTotal(totalCosts);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMembersAndData();
  }, []); // Runs only once on mount

  const maxCost = Math.max(...Object.values(weeklyTotal), 0);

  // Function to convert the weekly data to CSV without any currency symbols
  const exportToCSV = () => {
    const rows = [
      ["Member", "Total Cost"], // Header row
      ...members.map((member) => [
        member,
        (weeklyTotal[member] || 0).toFixed(2), // Format as a decimal number
      ]),
    ];

    // Convert rows to CSV format
    const csvContent = rows
      .map((row) => row.join(","))
      .join("\n");

    // Create a downloadable file with correct encoding
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
                            label={(weeklyTotal[member] || 0).toFixed(2)} // Format as a decimal number
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
            <Button
              variant="contained"
              color="primary"
              onClick={exportToCSV}
              sx={{ mt: 3 }}
            >
              Export to CSV
            </Button>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}

export default WeeklyInsights;
