import { SignUp } from "@clerk/nextjs";


const SignUpPage: React.FC = () => {
  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <SignUp />
    </div>
  );
};

export default SignUpPage;
