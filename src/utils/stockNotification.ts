import { supabase } from "@/integrations/supabase/client";
import { Product } from "@/store/cartStore";

const DEFAULT_LOW_STOCK_THRESHOLD = 10;

export const checkAndNotifyLowStock = async (
  products: Product[],
  adminEmail: string,
  threshold: number = DEFAULT_LOW_STOCK_THRESHOLD
) => {
  // Filter products that are low stock or out of stock
  const concerningProducts = products.filter(
    (p) => p.stock <= threshold
  );

  if (concerningProducts.length === 0) {
    return { success: true, message: "No low stock products" };
  }

  try {
    const { data, error } = await supabase.functions.invoke(
      "low-stock-notification",
      {
        body: {
          products: concerningProducts.map((p) => ({
            id: p.id,
            name: p.name,
            stock: p.stock,
          })),
          adminEmail,
          threshold,
        },
      }
    );

    if (error) {
      console.error("Failed to send low stock notification:", error);
      return { success: false, error: error.message };
    }

    console.log("Low stock notification sent:", data);
    return { success: true, data };
  } catch (err) {
    console.error("Error calling low stock notification:", err);
    return { success: false, error: String(err) };
  }
};
