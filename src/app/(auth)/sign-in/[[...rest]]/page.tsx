
import { SignIn } from "@clerk/nextjs";

const SignInPage: React.FC = () => {
  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <SignIn  />
    </div>
  );
};

export default SignInPage;
