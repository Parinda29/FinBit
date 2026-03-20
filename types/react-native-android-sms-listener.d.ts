declare module 'react-native-android-sms-listener' {
  interface SMSMessage {
    originatingAddress: string;
    body: string;
    timestamp: number;
  }

  const SmsListener: {
    addListener(callback: (message: SMSMessage) => void): { remove(): void };
  };

  export default SmsListener;
}