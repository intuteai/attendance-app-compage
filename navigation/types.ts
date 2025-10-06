// navigation/types.ts
export type RootStackParamList = {
  Signup: undefined;
  OTP: undefined;
  Home: undefined;
  Login: undefined;
  Dashboard: { imagePaths?: string[] } | undefined; // single source of truth
   AddEmployee: undefined;
};

// (optional but nice for useNavigation without generics)
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}