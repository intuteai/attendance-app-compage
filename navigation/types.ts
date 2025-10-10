// navigation/types.ts
export type RootStackParamList = {
  Signup: undefined;
  OTP: undefined;
  Home: undefined;
  Login: undefined;
  Dashboard: { imagePaths?: string[] } | undefined; // single source of truth
   AddEmployee: { videoDone?: boolean };
  RecordFaceVideo: {
    empId: string;
    fullName: string;
    uploadUrl: string;
    // remove addEmployeeKey if you adopt the pop-back approach
  };
};

// (optional but nice for useNavigation without generics)
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}