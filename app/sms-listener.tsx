import { useEffect } from 'react';
import SmsListener from 'react-native-android-sms-listener';
import { PermissionsAndroid, Platform } from 'react-native';

// CHANGE THIS TO YOUR PC IP
const API_URL = "http://192.168.1.5:8000/api/transactions/";

export default function SMSListener() {
  useEffect(() => {
    requestSMSPermission(); //  asking permission first

    const subscription = SmsListener.addListener(message => {
      const sms = message.body;

      console.log(" SMS Received:", sms);

      //  Only processing banking SMS
      if (isBankingSMS(sms)) {
        const amount = extractAmount(sms);
        const type = detectType(sms);
        const date = new Date();

        console.log(" Detected:", { amount, type });

        sendToBackend(amount, type, date, sms);
      }
    });

    return () => subscription.remove();
  }, []);

  return null;
}

/* REQUEST SMS PERMISSION */
const requestSMSPermission = async () => {
  if (Platform.OS === 'android') {
    try {
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.READ_SMS,
        PermissionsAndroid.PERMISSIONS.RECEIVE_SMS,
      ]);

      if (
        granted['android.permission.READ_SMS'] === 'granted' &&
        granted['android.permission.RECEIVE_SMS'] === 'granted'
      ) {
        console.log(" SMS Permission Granted");
      } else {
        console.log(" SMS Permission Denied");
      }
    } catch (err) {
      console.warn(err);
    }
  }
};

/*  DETECT BANKING SMS */
const isBankingSMS = (sms: string) => {
  const lower = sms.toLowerCase();

  return (
    // Shine Resunga 
    lower.includes("a/c") ||
    lower.includes("avl bal") ||
    lower.includes("shine") ||
    lower.includes("resunga") ||

    // General banking
    lower.includes("credited") ||
    lower.includes("debited") ||
    lower.includes("withdrawn") ||
    lower.includes("deposit") ||
    lower.includes("txn") ||
    lower.includes("transaction") ||
    lower.includes("payment") ||
    lower.includes("purchase")
  );
};

/*  EXTRACT AMOUNT */
const extractAmount = (sms: string) => {
  const match = sms.match(/(Rs\.?|NPR)\s?([\d,]+)/i);

  if (match) {
    return parseFloat(match[2].replace(/,/g, ''));
  }

  return 0;
};

/*  DETECT TYPE */
const detectType = (sms: string) => {
  const lower = sms.toLowerCase();

  if (lower.includes("credited") || lower.includes("deposit")) {
    return "income";
  }

  if (
    lower.includes("debited") ||
    lower.includes("withdrawn") ||
    lower.includes("purchase") ||
    lower.includes("payment")
  ) {
    return "expense";
  }

  return "unknown";
};

/* SEND TO DJANGO */
const sendToBackend = async (
  amount: number,
  type: string,
  date: Date,
  raw_sms: string
) => {
  try {
    await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: amount,
        type: type,
        date: date,
        source: "sms",
        description: raw_sms,
      }),
    });

    console.log(" Sent to backend");
  } catch (error) {
    console.log(" API Error:", error);
  }
};