import { supabase } from "@/integrations/supabase/client";

interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
}

interface NewOrderNotificationData {
  orderId: string;
  customerName: string;
  customerEmail: string;
  items: OrderItem[];
  total: number;
  shippingAddress?: string;
  adminEmail: string;
}

export const sendNewOrderNotification = async (data: NewOrderNotificationData) => {
  try {
    console.log("Sending new order notification for:", data.orderId);
    
    const { data: result, error } = await supabase.functions.invoke(
      "new-order-notification",
      {
        body: data,
      }
    );

    if (error) {
      console.error("Failed to send new order notification:", error);
      return { success: false, error: error.message };
    }

    console.log("New order notification sent:", result);
    return { success: true, data: result };
  } catch (err) {
    console.error("Error calling new order notification:", err);
    return { success: false, error: String(err) };
  }
};
