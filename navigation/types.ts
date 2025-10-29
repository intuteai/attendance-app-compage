// navigation/types.ts
export type RootStackParamList = {
  Signup: undefined;
  OTP: undefined;
  Home: undefined;
  Login: undefined;
  Dashboard: { imagePaths?: string[] } | undefined; // single source of truth
   AddEmployee: { videoDone?: boolean };
  RecordFaceVideo: { name: string;userId: string; uploadUrl?: string };
};

// (optional but nice for useNavigation without generics)
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}