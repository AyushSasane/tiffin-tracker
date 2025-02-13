import React, { useEffect, useState } from "react";
import { db } from "../firebaseConfig";
import { collection, query, where, getDocs, Timestamp } from "firebase/firestore";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
  List,
  ListItem,
  Divider,
  Chip,
  Button,
} from "@mui/material";

const OrderDetailsModal = ({ open, onClose, memberId, weekRange }) => {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    if (open && memberId) {
      fetchOrderDetails();
    }
  }, [open, memberId]);

  const fetchOrderDetails = async () => {
    const { startOfWeek, endOfWeek } = getWeekRange(new Date(weekRange)); // Use the passed weekRange for filtering
    const startTimestamp = Timestamp.fromDate(startOfWeek);
    const endTimestamp = Timestamp.fromDate(endOfWeek);

    const ordersQuery = query(
      collection(db, "orders"),
      where("memberId", "==", memberId),
      where("timestamp", ">=", startTimestamp),
      where("timestamp", "<=", endTimestamp)
    );

    try {
      const querySnapshot = await getDocs(ordersQuery);
      const fetchedOrders = querySnapshot.docs.map((doc) => doc.data());
      setOrders(fetchedOrders);
    } catch (error) {
      console.error("Error fetching order details:", error);
    }
  };

  const getWeekRange = (date) => {
    const startOfWeek = new Date(date);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay()); // Sunday as start
    startOfWeek.setHours(0, 0, 0, 0); // Reset time to 00:00:00

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6); // Saturday as end
    endOfWeek.setHours(23, 59, 59, 999); // Set time to 23:59:59

    return { startOfWeek, endOfWeek };
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Order Details for {memberId}</DialogTitle>
      <DialogContent>
        {orders.length > 0 ? (
          <List>
            {orders.map((order, index) => (
              <ListItem key={index}>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  <Chip label={`₹${order.cost.toFixed(2)}`} size="small" color="primary" />
                  <Typography variant="body2" color="textSecondary">
                    Member ID: {order.memberId}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Status: {order.paymentStatus}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Timestamp: {new Date(order.timestamp.seconds * 1000).toLocaleString()}
                  </Typography>
                </Typography>
              </ListItem>
            ))}
          </List>
        ) : (
          <Typography variant="body2" color="textSecondary">
            No orders found for this member this week.
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default OrderDetailsModal;
