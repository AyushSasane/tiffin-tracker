import React, { useEffect, useState } from "react";
import { db } from "../firebaseConfig";
import { collection, query, where, getDocs, Timestamp, updateDoc, orderBy } from "firebase/firestore"; // Import orderBy here
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
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";

function WeeklyInsights() {
  const [weeklyTotal, setWeeklyTotal] = useState({});
  const [loading, setLoading] = useState(true);
  const [weekRange, setWeekRange] = useState("");
  const [members, setMembers] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date()); // Track selected week
  const [paymentStatus, setPaymentStatus] = useState({}); // Track payment status of each member

  // State for confirmation dialog
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);

  // Function to get the start and end of the week
  const getWeekRange = (date) => {
    const startOfWeek = new Date(date);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay()); // Sunday as start
    startOfWeek.setHours(0, 0, 0, 0); // Reset time to 00:00:00

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6); // Saturday as end
    endOfWeek.setHours(23, 59, 59, 999); // Set time to 23:59:59

    return {
      startOfWeek,
      endOfWeek,
      formatted: `${startOfWeek.toLocaleDateString()} - ${endOfWeek.toLocaleDateString()}`,
    };
  };

  // Fetch members dynamically from Firestore
  const fetchMembers = async () => {
    try {
      const ordersSnapshot = await getDocs(collection(db, "orders"));
      const memberSet = new Set();

      ordersSnapshot.forEach((doc) => {
        const data = doc.data();
        const memberId = data.memberId;
        if (memberId) memberSet.add(memberId); // Add memberId to set
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
      where("timestamp", "<=", endTimestamp),
      orderBy("timestamp") // Apply orderBy here
    );

    try {
      const querySnapshot = await getDocs(ordersQuery);
      const totalCosts = {};
      const paymentStatuses = {}; // Store payment status for each member

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const memberId = data.memberId;
        const cost = parseFloat(data.cost);
        const paymentStatus = data.paymentStatus || "Unpaid"; // If no payment status is set, default to "Unpaid"

        if (memberId && !isNaN(cost)) {
          totalCosts[memberId] = (totalCosts[memberId] || 0) + cost;
          paymentStatuses[memberId] = paymentStatus; // Track the payment status
        }
      });

      setWeeklyTotal(totalCosts);
      setPaymentStatus(paymentStatuses); // Set the payment status for each member
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

  // Calculate the total sum of all payments for the week
  const totalSum = Object.values(weeklyTotal).reduce((sum, cost) => sum + cost, 0);

  const maxCost = Math.max(...Object.values(weeklyTotal), 0);

  // Navigation for previous and next weeks
  const handleWeekChange = (weeks) => {
    setSelectedDate((prevDate) => {
      const newDate = new Date(prevDate);
      newDate.setDate(prevDate.getDate() + weeks * 7); // Move forward or backward by 7 days
      return newDate;
    });
  };

  // Handle the Mark as Paid action
  const handleMarkAsPaid = async (member) => {
    try {
      const { startOfWeek, endOfWeek } = getWeekRange(selectedDate);
      const startTimestamp = Timestamp.fromDate(startOfWeek);
      const endTimestamp = Timestamp.fromDate(endOfWeek);

      const ordersQuery = query(
        collection(db, "orders"),
        where("memberId", "==", member),
        where("timestamp", ">=", startTimestamp),
        where("timestamp", "<=", endTimestamp),
        where("paymentStatus", "!=", "Paid")
      );

      const querySnapshot = await getDocs(ordersQuery);
      if (querySnapshot.empty) {
        console.log(`No unpaid orders found for ${member} this week.`);
        return;
      }

      const updatePromises = querySnapshot.docs.map((orderDoc) =>
        updateDoc(orderDoc.ref, { paymentStatus: "Paid" })
      );

      await Promise.all(updatePromises);

      // Update the payment status in the UI
      setPaymentStatus((prevStatus) => ({
        ...prevStatus,
        [member]: "Paid", // Update the member's status
      }));

      setOpenDialog(false);
      setSelectedMember(null);
    } catch (error) {
      console.error("Error marking orders as paid:", error);
    }
  };

  // Export data to CSV
  const exportToCSV = () => {
    const rows = [
      ["Member", "Total Cost"],
      ...members.map((member) => [member, (weeklyTotal[member] || 0).toFixed(2)]),
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
      <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, justifyContent: "center", gap: 2, mb: 2 }}>
        <Button variant="outlined" onClick={() => handleWeekChange(-1)} sx={{ width: { xs: "100%", sm: "auto" } }}>
          Previous Week
        </Button>
        <Button
          variant="outlined"
          onClick={() => handleWeekChange(1)}
          disabled={getWeekRange(selectedDate).formatted === getWeekRange(new Date()).formatted}
          sx={{ width: { xs: "100%", sm: "auto" } }}
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

            {/* Display Total Sum */}
            <Box sx={{ mb: 3, p: 2, backgroundColor: "#f5f5f5", borderRadius: 2 }}>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                Total Sum for the Week:
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 700, color: "#00796B" }}>
                ₹{totalSum.toFixed(2)}
              </Typography>
            </Box>

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

                        {/* Display payment status */}
                        <Typography
                          variant="body2"
                          color={paymentStatus[member] === "Paid" ? "success.main" : "error.main"}
                          sx={{ fontWeight: 600 }}
                        >
                          {paymentStatus[member] || "Unpaid"}
                        </Typography>

                        <LinearProgress
                          variant="determinate"
                          value={((weeklyTotal[member] || 0) / maxCost) * 100}
                          sx={{ height: 8, borderRadius: 2 }}
                        />

                        <Box sx={{ mt: 2 }}>
                          <Typography variant="body2" color="textSecondary">
                            Payment due for {member}: ₹{(weeklyTotal[member] || 0).toFixed(2)}
                          </Typography>
                          <Box sx={{ display: "flex", gap: 2, flexDirection: { xs: "column", sm: "row" }, mt: 2 }}>
                            {/* Google Pay Button */}
                            <Button
                              variant="contained"
                              color="primary"
                              onClick={() => {
                                if (/Mobi|Android/i.test(navigator.userAgent)) {
                                  window.location.href = `intent://pay?pa=ravinapawar987-1@okicici&pn=Ravi%20N%20Pawar#Intent;scheme=upi;package=com.google.android.apps.nbu.paisa.user;end`;
                                } else {
                                  window.open("https://pay.google.com/gp/p/ui/pay?pa=ravinapawar987-1@okicici", "_blank");
                                }
                              }}
                              sx={{ width: { xs: "100%", sm: "auto" } }}
                            >
                              Pay via Google Pay
                            </Button>

                            {/* Mark as Paid Button */}
                            <Button
                              variant="contained"
                              color="secondary"
                              onClick={() => {
                                setSelectedMember(member);
                                setOpenDialog(true);
                              }}
                              disabled={paymentStatus[member] === "Paid"} // Disable if already paid
                              sx={{ width: { xs: "100%", sm: "auto" } }}
                            >
                              {paymentStatus[member] === "Paid" ? "Paid" : "Mark as Paid"}
                            </Button>
                          </Box>
                        </Box>
                      </Stack>
                    </ListItem>
                  ))}
                </Stack>
              </List>
            ) : (
              <Alert severity="info">No orders found for this week.</Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Dialog for Mark as Paid */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Mark {selectedMember} as Paid</DialogTitle>
        <DialogContent>
          <Typography variant="body1">Are you sure you want to mark {selectedMember} as paid?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)} color="primary">
            Cancel
          </Button>
          <Button
            onClick={() => handleMarkAsPaid(selectedMember)}
            color="secondary"
            variant="contained"
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      {/* Export CSV Button */}
      <Box sx={{ mt: 4, textAlign: "center" }}>
        <Button variant="contained" color="primary" onClick={exportToCSV}>
          Export Data to CSV
        </Button>
      </Box>
    </Box>
  );
}

export default WeeklyInsights;
