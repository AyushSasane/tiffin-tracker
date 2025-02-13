import React, { useState } from "react";
import { db } from "../firebaseConfig"; // Ensure this is correctly initialized
import { collection, addDoc, Timestamp } from "firebase/firestore";
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  Card,
  CardContent,
  Stack,
  Snackbar,
  Grid,
} from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";

// Create a custom theme using Material-UI's createTheme function
const theme = createTheme({
  typography: {
    fontFamily: '"Roboto", "Arial", sans-serif',
    h4: {
      fontFamily: '"Poppins", "Arial", sans-serif',
      fontWeight: "600",
    },
    h6: {
      fontFamily: '"Poppins", "Arial", sans-serif',
      fontWeight: "500",
    },
    subtitle1: {
      fontFamily: '"Roboto", "Arial", sans-serif',
    },
    body1: {
      fontFamily: '"Roboto", "Arial", sans-serif',
    },
  },
  palette: {
    primary: {
      main: "#00796B", // Teal
    },
    success: {
      main: "#388E3C", // Fresh Green
    },
    error: {
      main: "#D32F2F", // Deep Red
    },
    background: {
      default: "#F5F5F5", // Soft light gray background
    },
    text: {
      primary: "#212121", // Dark gray for primary text
    },
  },
});

function DailyEntry() {
  const [members, setMembers] = useState([
    "Ayush",
    "Saish",
    "Pranav",
    "Dhiraj",
    "Vivek",
    "Vaibhav",
  ]);
  const [orders, setOrders] = useState({});
  const [newMember, setNewMember] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState(false);

  // Handle input change for each member's cost
  const handleInputChange = (e, member) => {
    const { value } = e.target;
    setOrders((prevOrders) => ({
      ...prevOrders,
      [member]: { cost: value, paymentStatus: "Pending" },
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); // Reset any previous error

    // Validate that all costs are positive numbers
    for (let member in orders) {
      const cost = parseFloat(orders[member]?.cost || "0");
      if (isNaN(cost) || cost <= 0) {
        setError(`Please enter a valid positive cost for ${member}.`);
        return; // Stop the submission if there's an invalid input
      }
    }

    // If validation passes, submit to Firestore
    try {
      // Save each member's order to the `orders` collection
      for (let member in orders) {
        await addDoc(collection(db, "orders"), {
          memberId: member,
          cost: parseFloat(orders[member].cost),
          paymentStatus: orders[member].paymentStatus,
          timestamp: Timestamp.now(),
        });
      }

      // Optionally, update the `members` collection with the latest due payment
      // This part will aggregate data from the `orders` collection

      setOrders({}); // Reset orders after submission
      setSuccessMessage(true); // Show success message
    } catch (e) {
      console.error("Error adding document: ", e);
    }
  };

  // Add a new member to the list
  const addMember = () => {
    if (newMember.trim()) {
      if (members.includes(newMember)) {
        setError("Member already exists.");
        return;
      }
      setMembers([...members, newMember]);
      setNewMember(""); // Reset input after adding member
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ width: "100%", maxWidth: 600, mx: "auto", mt: 5, p: 3 }}>
        <Typography variant="h4" align="center" gutterBottom>
          Daily Tiffin Entry
        </Typography>

        {/* Display error message */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Form to enter daily orders */}
        <form onSubmit={handleSubmit}>
          <Stack spacing={2}>
            {members.map((member) => (
              <Card
                key={member}
                variant="outlined"
                sx={{
                  borderRadius: 2,
                  boxShadow: 3,
                  backgroundColor: "#FFFFFF", // Card background
                  "&:hover": {
                    boxShadow: 6,
                  },
                }}
              >
                <CardContent>
                  <Typography
                    variant="subtitle1"
                    sx={{ mb: 1, fontWeight: "500" }}
                  >
                    {`Enter ${member}'s Tiffin Cost`}
                  </Typography>
                  <TextField
                    fullWidth
                    type="number"
                    label={`Daily cost for ${member}`}
                    placeholder={`Enter ${member}'s daily tiffin cost in ₹`}
                    variant="outlined"
                    value={orders[member]?.cost || ""}
                    onChange={(e) => handleInputChange(e, member)}
                    error={!!error && orders[member]?.cost === ""}
                    helperText={
                      !!error && orders[member]?.cost === ""
                        ? `Please provide a valid cost for ${member}.`
                        : ""
                    }
                    sx={{
                      input: {
                        fontFamily: '"Roboto", "Arial", sans-serif',
                      },
                    }}
                  />
                </CardContent>
              </Card>
            ))}
          </Stack>

          {/* Add new member input */}
          <Grid container spacing={2} sx={{ mb: 3, mt: 3 }}>
            <Grid item xs={12} sm={8}>
              <TextField
                fullWidth
                label="Add new member"
                variant="outlined"
                value={newMember}
                onChange={(e) => setNewMember(e.target.value)}
                sx={{
                  input: {
                    fontFamily: '"Roboto", "Arial", sans-serif',
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Button
                onClick={addMember}
                variant="contained"
                color="primary"
                fullWidth
                sx={{ height: "100%" }}
              >
                Add Member
              </Button>
            </Grid>
          </Grid>

          {/* Submit Button */}
          <Box sx={{ textAlign: "center", mt: 4 }}>
            <Button type="submit" variant="contained" color="success" size="large" fullWidth>
              Submit Orders
            </Button>
          </Box>
        </form>

        {/* Success Snackbar */}
        <Snackbar
          open={successMessage}
          autoHideDuration={4000}
          onClose={() => setSuccessMessage(false)}
          message="Orders submitted successfully!"
        />
      </Box>
    </ThemeProvider>
  );
}

export default DailyEntry;
