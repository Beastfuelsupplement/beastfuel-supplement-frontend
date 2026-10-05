import { supabase } from "@/integrations/supabase/client";

interface OrderStatusNotificationParams {
  orderId: string;
  customerName: string;
  customerEmail: string;
  newStatus: string;
  previousStatus: string;
  items: Array<{ productName: string; quantity: number; price: number }>;
  total: number;
  shippingAddress?: string;
  storeName: string;
}

export const sendOrderStatusNotification = async (params: OrderStatusNotificationParams): Promise<boolean> => {
  try {
    console.log('Sending order status notification:', params);
    
    const { data, error } = await supabase.functions.invoke('order-status-notification', {
      body: params,
    });

    if (error) {
      console.error('Error sending order status notification:', error);
      return false;
    }

    console.log('Order status notification sent successfully:', data);
    return true;
  } catch (error) {
    console.error('Failed to send order status notification:', error);
    return false;
  }
};
