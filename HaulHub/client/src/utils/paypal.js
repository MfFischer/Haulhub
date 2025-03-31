import { loadScript } from "@paypal/paypal-js";

export const getPayPal = async () => {
  return await loadScript({
    'client-id': process.env.REACT_APP_PAYPAL_CLIENT_ID,
    currency: 'USD'
  });
};
