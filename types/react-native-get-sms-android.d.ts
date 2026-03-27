declare module 'react-native-get-sms-android' {
  export interface SmsRecord {
    _id?: string | number;
    thread_id?: string | number;
    address?: string;
    body?: string;
    date?: number | string;
    date_sent?: number | string;
    read?: number;
    status?: number;
    type?: number;
  }

  interface SmsAndroidModule {
    list(
      filter: string,
      failure: (error: string) => void,
      success: (count: number, smsList: string) => void
    ): void;
    delete(_id: string | number, failure: (error: string) => void, success: (message: string) => void): void;
    autoSend(
      phoneNumber: string,
      message: string,
      failure: (error: string) => void,
      success: (message: string) => void
    ): void;
  }

  const SmsAndroid: SmsAndroidModule;
  export default SmsAndroid;
}
