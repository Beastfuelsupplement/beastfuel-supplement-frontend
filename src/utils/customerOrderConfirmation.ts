import { supabase } from "@/integrations/supabase/client";

interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
}

export interface CustomerOrderConfirmationData {
  orderId: string;
  customerName: string;
  customerEmail: string;
  items: OrderItem[];
  total: number;
  shippingAddress?: string;
  storeName?: string;
  accessToken?: string;
}

export const sendCustomerOrderConfirmation = async (data: CustomerOrderConfirmationData) => {
  try {
    console.log("Sending order confirmation to customer:", data.customerEmail);
    
    const headers: Record<string, string> = {};
    if (data.accessToken) {
      headers['Authorization'] = `Bearer ${data.accessToken}`;
    }

    const { data: result, error } = await supabase.functions.invoke(
      "customer-order-confirmation",
      {
        body: {
          orderId: data.orderId,
          customerName: data.customerName,
          customerEmail: data.customerEmail,
          items: data.items,
          total: data.total,
          shippingAddress: data.shippingAddress,
          storeName: data.storeName,
        },
        headers,
      }
    );

    if (error) {
      console.error("Failed to send customer order confirmation:", error);
      return { success: false, error: error.message };
    }

    console.log("Customer order confirmation sent:", result);
    return { success: true, data: result };
  } catch (err) {
    console.error("Error calling customer order confirmation:", err);
    return { success: false, error: String(err) };
  }
};
